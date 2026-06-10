import { NextResponse } from "next/server";
import { getPreset, type CinemaPayload } from "@/lib/cinema-presets";

type GenerationSource = "preset" | "stepfun";

const endpoint = "https://api.stepfun.com/v1/chat/completions";
const model = process.env.STEPFUN_MODEL || "step-3.7-flash";

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

function parseJsonContent(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced?.[1] ?? trimmed;
  return JSON.parse(jsonText);
}

// 简单 in-memory rate limit：每 IP 每分钟 10 次
// pre-launch 阶段够用，真流量再换 KV / Upstash
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;
const rateBuckets = new Map<string, number[]>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip) ?? [];
  const fresh = bucket.filter((ts) => now - ts < RATE_WINDOW_MS);
  if (fresh.length >= RATE_MAX) {
    rateBuckets.set(ip, fresh);
    return false;
  }
  fresh.push(now);
  rateBuckets.set(ip, fresh);
  return true;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!checkRate(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    trigger?: unknown;
  } | null;
  const trigger =
    typeof body?.trigger === "string" ? body.trigger.trim().slice(0, 700) : "";

  if (!trigger) {
    return NextResponse.json({ error: "Missing trigger." }, { status: 400 });
  }

  const apiKey = process.env.STEPFUN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      cinema: getPreset(trigger),
      source: "preset" satisfies GenerationSource,
    });
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
      const text = await response.text().catch(() => "");
      return NextResponse.json({
        cinema: getPreset(trigger),
        source: "preset" satisfies GenerationSource,
        detail: `StepFun request failed: ${response.status} ${text}`.slice(0, 200),
      });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      return NextResponse.json({
        cinema: getPreset(trigger),
        source: "preset" satisfies GenerationSource,
        detail: "StepFun response did not include content.",
      });
    }

    let parsed: unknown;

    try {
      parsed = parseJsonContent(content);
    } catch {
      return NextResponse.json({
        cinema: getPreset(trigger),
        source: "preset" satisfies GenerationSource,
        detail: "StepFun response was not valid JSON.",
      });
    }

    if (!isCinemaPayload(parsed)) {
      return NextResponse.json({
        cinema: getPreset(trigger),
        source: "preset" satisfies GenerationSource,
        detail: "StepFun response did not match cinema schema.",
      });
    }

    return NextResponse.json({
      cinema: parsed,
      source: "stepfun" satisfies GenerationSource,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? `StepFun generation failed: ${error.message}`
        : "StepFun generation failed.";
    return NextResponse.json({
      cinema: getPreset(trigger),
      source: "preset" satisfies GenerationSource,
      detail: message.slice(0, 200),
    });
  } finally {
    clearTimeout(timeout);
  }
}
