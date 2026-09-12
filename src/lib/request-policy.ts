/** Browser abuse guard, not authentication. Native clients may omit Origin. */
export function allowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  if (origin === "null") return false;
  try {
    const parsed = new URL(origin);
    if (parsed.origin !== origin || !["http:", "https:"].includes(parsed.protocol)) return false;
    if (origin === new URL(request.url).origin) return true;
    return (process.env.STILLMIND_ALLOWED_ORIGINS ?? "").split(",").map(value => value.trim()).includes(origin);
  } catch { return false; }
}

export function requestPolicyError(request: Request): { status: number; reason: string } | undefined {
  if (!allowedOrigin(request)) return { status: 403, reason: "origin-not-allowed" };
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return { status: 415, reason: "json-required" };
  }
}

export function corsHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = { "Cache-Control": "no-store", Vary: "Origin" };
  const origin = request.headers.get("origin");
  if (origin && allowedOrigin(request)) Object.assign(headers, {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });
  return headers;
}

export function preflight(request: Request): Response {
  return new Response(null, { status: allowedOrigin(request) ? 204 : 403, headers: corsHeaders(request) });
}
