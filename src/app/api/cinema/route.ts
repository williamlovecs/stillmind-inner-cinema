import { NextResponse } from "next/server";

type CinemaPayload = {
  title: string;
  innerNoise: string[];
  scenes: { label: string; line: string }[];
  roleView: string;
  audienceView: string;
  witnessView: string;
};

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

function textFallback(trigger: string): CinemaPayload {
  const isIgnored = /没回|忽视|不理|冷淡|不回|ignored|reply/i.test(trigger);
  const isConflict = /冲突|吵|反击|批评|指责|证明|conflict|fight|criticized|prove/i.test(
    trigger,
  );

  const preset = isIgnored
    ? {
        title: "沉默之后",
        innerNoise: ["是不是我不重要", "为什么没回应", "我需要答案"],
        scenes: [
          "消息没有回应，心里开始收紧。",
          "念头升起：是不是我不够重要？",
          "现在坐到观众席，看见这份不安。",
        ],
        roleView: "我被忽视了，需要马上确认答案。",
        audienceView: "一个人正被沉默牵动，想抓住回应。",
      }
    : isConflict
      ? {
          title: "冲突之后",
          innerNoise: ["我必须反击", "他们误解我", "我不能输"],
          scenes: [
            "冲突刚刚发生，身体还在反应。",
            "念头升起：我必须立刻反击。",
            "现在先坐到观众席，看见角色。",
          ],
          roleView: "我被推进剧情，想立刻反应。",
          audienceView: "一个人正在防御，想保护自己的位置。",
        }
      : {
          title: "触发之后",
          innerNoise: ["我需要马上处理", "哪里不对劲", "我坐不住"],
          scenes: [
            "触发刚刚发生，身体还在反应。",
            "念头升起：我需要马上处理。",
            "现在先坐到观众席，看见角色。",
          ],
          roleView: "我被触动了，想马上做点什么。",
          audienceView: "一个人正被念头拉走，暂时忘了观看。",
        };

  return {
    title: preset.title,
    innerNoise: preset.innerNoise,
    scenes: preset.scenes.map((line, index) => ({
      label: `镜头 0${index + 1}`,
      line: line.slice(0, 42),
    })),
    roleView: preset.roleView,
    audienceView: preset.audienceView,
    witnessView: `这个反应正在发生。先看见它，再回到当下。`,
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.STEPFUN_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "STEPFUN_API_KEY is not configured." },
      { status: 503 },
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
      return NextResponse.json(
        { error: `StepFun request failed: ${response.status}`, detail: text },
        { status: 502 },
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "StepFun response did not include content." },
        { status: 502 },
      );
    }

    let parsed: unknown;
    let usedFallback = false;

    try {
      parsed = parseJsonContent(content);
    } catch {
      parsed = textFallback(trigger);
      usedFallback = true;
    }

    if (!isCinemaPayload(parsed)) {
      return NextResponse.json(
        { error: "StepFun response did not match cinema schema." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      cinema: parsed,
      source: usedFallback ? "fallback" : "stepfun",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `StepFun generation failed: ${error.message}`
            : "StepFun generation failed.",
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
