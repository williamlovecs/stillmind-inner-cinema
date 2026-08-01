import { isAnalyticsEnvelope } from "@stillmind/domain";

const WINDOW_MS = 60_000;
const MAX_EVENTS_PER_WINDOW = 30;
const MAX_BODY_BYTES = 8_192;
const rateLimits = new Map<string, { count: number; resetAt: number }>();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS_HEADERS });
}

function clientAddress(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function allowed(address: string, now = Date.now()): boolean {
  const current = rateLimits.get(address);
  if (!current || current.resetAt <= now) {
    rateLimits.set(address, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_EVENTS_PER_WINDOW) return false;
  current.count += 1;
  return true;
}

function posthogEndpoint(): string | undefined {
  const token = process.env.POSTHOG_PROJECT_API_KEY?.trim();
  if (!token) return undefined;
  const host = (process.env.POSTHOG_HOST || "https://us.i.posthog.com").trim().replace(/\/$/, "");
  try {
    const url = new URL(host);
    if (url.protocol !== "https:") return undefined;
    return `${url.origin}${url.pathname === "/" ? "" : url.pathname}/i/v0/e/`;
  } catch {
    return undefined;
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  if (!allowed(clientAddress(request))) return json({ accepted: false, reason: "rate-limited" }, 429);

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) return json({ accepted: false, reason: "payload-too-large" }, 413);

  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ accepted: false, reason: "payload-too-large" }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ accepted: false, reason: "invalid-json" }, 400);
  }

  if (!isAnalyticsEnvelope(body)) return json({ accepted: false, reason: "invalid-event" }, 400);

  const endpoint = posthogEndpoint();
  const token = process.env.POSTHOG_PROJECT_API_KEY?.trim();
  if (!endpoint || !token) return json({ accepted: false, reason: "not-configured" }, 202);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3_500);
  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        api_key: token,
        event: `stillmind_${body.name}`,
        distinct_id: body.anonymousId,
        properties: {
          ...body.payload,
          platform: body.platform,
          schema_version: body.schemaVersion,
          $process_person_profile: false,
        },
      }),
    });
    if (!upstream.ok) return json({ accepted: false, reason: "upstream-error" }, 502);
    return json({ accepted: true }, 202);
  } catch {
    return json({ accepted: false, reason: "upstream-unavailable" }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
