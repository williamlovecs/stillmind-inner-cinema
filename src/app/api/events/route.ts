import { isAnalyticsEnvelope } from "@stillmind/domain";
import { readBoundedJson, requestAddress, WindowRateLimit } from "@/lib/server-limits";

const MAX_BODY_BYTES = 8_192;
const rateLimit = new WindowRateLimit(30);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS_HEADERS });
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
  if (!rateLimit.allow(requestAddress(request))) return json({ accepted: false, reason: "rate-limited" }, 429);

  const read = await readBoundedJson(request, MAX_BODY_BYTES);
  if (!read.ok) return json({ accepted: false, reason: read.reason }, read.status);
  const body = read.value;

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
