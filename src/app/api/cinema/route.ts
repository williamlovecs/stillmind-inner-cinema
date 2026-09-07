import { readBoundedJson, requestAddress, WindowRateLimit } from "@/lib/server-limits";
import { containsHighRiskLanguage } from "@stillmind/domain";
import { getPreset, type CinemaPayload } from "@/lib/cinema-presets";

type GenerationSource = "preset" | "stepfun";

const endpoint = "https://api.stepfun.com/v1/chat/completions";
const model = process.env.STEPFUN_MODEL || "step-3.7-flash";
const MAX_BODY_BYTES = 4096;
const MAX_TRIGGER_LENGTH = 500;
const PROHIBITED_OUTPUT = /抑郁症|焦虑症|人格障碍|创伤后|你就是|你属于|diagnos|personality disorder/i;

function compact(value: string, max: number): string {
  return value.trim().slice(0, max);
}

function isCinemaPayload(value: unknown): value is CinemaPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<CinemaPayload>;

  return (
    typeof item.title === "string" &&
    Array.isArray(item.innerNoise) &&
    item.innerNoise.every((line) => typeof line === "string") &&
    Array.isArray(item.scenes) &&
    item.scenes.length >= 2 &&
    item.scenes.every(
      (scene) =>
        scene &&
        typeof scene === "object" &&
        typeof scene.label === "string" &&
        typeof scene.line === "string",
    ) &&
    typeof item.roleView === "string" &&
    typeof item.audienceView === "string" &&
    typeof item.witnessView === "string"
  );
}

function normalizeCinema(value: unknown): CinemaPayload | undefined {
  if (!isCinemaPayload(value)) return undefined;
  // Validate all rendered fields before truncating; labels are user-visible too.
  const sourceText = [value.title, ...value.innerNoise, ...value.scenes.flatMap(scene => [scene.label, scene.line]), value.roleView, value.audienceView, value.witnessView].join(" ");
  if (PROHIBITED_OUTPUT.test(sourceText)) return undefined;
  const cinema: CinemaPayload = {
    title: compact(value.title, 24),
    innerNoise: value.innerNoise.slice(0, 4).map((line) => compact(line, 24)).filter(Boolean),
    scenes: value.scenes.slice(0, 3).map((scene, index) => ({
      label: compact(scene.label, 16) || `镜头 0${index + 1}`,
      line: compact(scene.line, 56),
    })).filter((scene) => scene.line),
    roleView: compact(value.roleView, 60),
    audienceView: compact(value.audienceView, 72),
    witnessView: compact(value.witnessView, 60),
  };
  const allText = [cinema.title, ...cinema.innerNoise, ...cinema.scenes.flatMap((scene) => [scene.label, scene.line]), cinema.roleView, cinema.audienceView, cinema.witnessView].join(" ");
  if (!cinema.title || !cinema.roleView || !cinema.audienceView || !cinema.witnessView || cinema.scenes.length < 2 || PROHIBITED_OUTPUT.test(allText)) return undefined;
  return cinema;
}

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function presetResponse(trigger: string) {
  return json({ cinema: getPreset(trigger), source: "preset" satisfies GenerationSource });
}

function parseJsonContent(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced?.[1] ?? trimmed;
  return JSON.parse(jsonText);
}

// Per-instance only. Production must also enforce an infrastructure-level budget.
const rateLimit = new WindowRateLimit(10);

export async function POST(request: Request) {
  const ip = requestAddress(request);
  if (!rateLimit.allow(ip)) {
    return json({ error: "rate-limit" }, 429);
  }

  const read = await readBoundedJson(request, MAX_BODY_BYTES);
  if (!read.ok) return json({ error: read.reason }, read.status);
  const body = read.value as { trigger?: unknown } | null;
  const trigger =
    typeof body?.trigger === "string" ? body.trigger.trim().slice(0, MAX_TRIGGER_LENGTH) : "";

  if (!trigger) {
    return json({ error: "missing-trigger" }, 400);
  }

  if (containsHighRiskLanguage(trigger)) return json({ error: "safety-boundary" }, 422);

  const apiKey = process.env.STEPFUN_API_KEY;
  if (!apiKey) {
    return presetResponse(trigger);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8500);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "你是 StillMind 的内在电影分镜生成器。把用户情绪触发转成 3 个短镜头，像电影字幕，每镜头只有一句话。克制，不分析，不诊断，不贴标签，不解释深层动机，不安慰用户。只输出 JSON。",
          },
          {
            role: "user",
            content: `用户触发事件：${trigger}

请输出严格 JSON：
{
  "title": "6字以内的中文电影标题",
  "innerNoise": ["三条短念头字幕，每条不超过10字"],
  "scenes": [
    { "label": "镜头 01", "line": "发生了什么，不超过18字" },
    { "label": "镜头 02", "line": "念头升起：“……”，不超过18字" },
    { "label": "镜头 03", "line": "引导坐到观众席，不超过16字" }
  ],
  "roleView": "角色视角一句话，不超过20字",
  "audienceView": "观众视角一句话，不超过25字",
  "witnessView": "见证视角一句话，不解释动机，不下结论，不超过20字"
}`,
          },
        ],
        temperature: 0.75,
        max_tokens: 350,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return presetResponse(trigger);
    }

    const providerBody = await readBoundedJson(response, 65_536, 8_500);
    if (!providerBody.ok) return presetResponse(trigger);
    const data = providerBody.value as { choices?: { message?: { content?: unknown } }[] } | null;
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      return presetResponse(trigger);
    }

    let parsed: unknown;

    try {
      parsed = parseJsonContent(content);
    } catch {
      return presetResponse(trigger);
    }

    const cinema = normalizeCinema(parsed);
    if (!cinema) return presetResponse(trigger);

    return json({
      cinema,
      source: "stepfun" satisfies GenerationSource,
    });
  } catch {
    return presetResponse(trigger);
  } finally {
    clearTimeout(timeout);
  }
}
