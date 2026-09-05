/** Small in-process guards, not a substitute for a trusted proxy, WAF or provider budget cap. */
export class WindowRateLimit {
  private readonly entries = new Map<string, { count: number; until: number }>();
  constructor(private readonly max: number, private readonly windowMs = 60_000, private readonly capacity = 2_048) {}
  get size(): number { return this.entries.size; }
  allow(key: string, now = Date.now()): boolean {
    if (!key || key.length > 128) return false;
    const current = this.entries.get(key);
    if (current && current.until > now) {
      if (current.count >= this.max) return false;
      current.count += 1; return true;
    }
    if (this.entries.size >= this.capacity) {
      for (const [id, item] of this.entries) if (item.until <= now) this.entries.delete(id);
      // Do not evict active clients: rotating forged identifiers must not reset their buckets.
      if (!this.entries.has(key) && this.entries.size >= this.capacity) return false;
    }
    this.entries.set(key, { count: 1, until: now + this.windowMs }); return true;
  }
}
export function requestAddress(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim() || "unknown";
}
type JsonRead = { ok: true; value: unknown } | { ok: false; status: 400 | 408 | 413; reason: string };
/** Count UTF-8 bytes while reading, including absent/forged Content-Length; cancel on cap/deadline. */
export async function readBoundedJson(input: Pick<Request, "body" | "headers">, maxBytes: number, timeoutMs = 5_000): Promise<JsonRead> {
  if (Number(input.headers.get("content-length")) > maxBytes) {
    void input.body?.cancel().catch(() => undefined);
    return { ok: false, status: 413, reason: "payload-too-large" };
  }
  if (!input.body) return { ok: false, status: 400, reason: "invalid-json" };
  const reader = input.body.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let expired = false;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { expired = true; reject(new Error("body-timeout")); }, timeoutMs);
  });
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0, raw = "";
  try {
    for (;;) {
      const { value, done } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) return { ok: false, status: 413, reason: "payload-too-large" };
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, status: expired ? 408 : 400, reason: expired ? "body-timeout" : "invalid-json" };
  } finally {
    clearTimeout(timer);
    // A malicious cancellation promise must not hold the response hostage.
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
