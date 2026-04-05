import { NextResponse } from "next/server";

type MetricPayload = {
  sodium: number;
  vitaminD: number;
  calcium: number;
  magnesium: number;
  hasScan: boolean;
};

type ReportResult = {
  score: number;
  level: "Low" | "Moderate" | "High";
  factors: { label: string; impact: "high" | "medium" | "low"; positive: boolean }[];
  recommendations: string[];
};

type AssistantRequest = {
  question: string;
  payload: MetricPayload;
  report: ReportResult;
};

const HIGH_RISK_PATTERNS = [
  /\b(do i have|diagnose|diagnosis|am i suffering from)\b/i,
  /\bwhat medication\b/i,
  /\bwhat should i take\b/i,
  /\bprescription\b/i,
  /\btreatment plan\b/i,
  /\bemergency\b/i,
  /\bshould i ignore\b/i,
  /\bchest pain\b/i,
  /\bcannot see\b/i,
  /\bsuicid/i,
];

function isMetricPayload(value: unknown): value is MetricPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;

  return (
    typeof payload.sodium === "number" &&
    typeof payload.vitaminD === "number" &&
    typeof payload.calcium === "number" &&
    typeof payload.magnesium === "number" &&
    typeof payload.hasScan === "boolean"
  );
}

function isReportResult(value: unknown): value is ReportResult {
  if (!value || typeof value !== "object") return false;
  const report = value as Record<string, unknown>;

  return (
    typeof report.score === "number" &&
    (report.level === "Low" || report.level === "Moderate" || report.level === "High") &&
    Array.isArray(report.factors) &&
    Array.isArray(report.recommendations)
  );
}

function isHighRiskQuestion(question: string) {
  return HIGH_RISK_PATTERNS.some((pattern) => pattern.test(question));
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        answer:
          "The report assistant is not configured yet. Add OPENAI_API_KEY on the server to enable educational report Q&A.",
      },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { question, payload, report } = (body ?? {}) as Partial<AssistantRequest>;

  if (typeof question !== "string" || question.trim().length < 2) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  if (!isMetricPayload(payload) || !isReportResult(report)) {
    return NextResponse.json({ error: "Payload and report context are required." }, { status: 400 });
  }

  if (isHighRiskQuestion(question)) {
    return NextResponse.json({
      answer:
        "I can explain this prototype report, but I cannot diagnose SANS, recommend medication, or handle urgent medical decisions. If symptoms feel severe or urgent, contact a licensed clinician or emergency services right away.",
    });
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const systemPrompt = [
    "You are SANSight's report explanation assistant.",
    "You only explain the report already shown to the user.",
    "You are not a doctor and must not diagnose, prescribe, or give treatment plans.",
    "Keep answers educational, cautious, and grounded in the provided report values.",
    "Do not claim certainty. Use wording like 'may', 'could', or 'in this prototype'.",
    "If the user asks for diagnosis, medication, emergency advice, or treatment, refuse briefly and recommend a licensed clinician.",
    "Mention that this is a prototype screening tool, not medical advice.",
    "Prefer short answers under 180 words.",
  ].join(" ");

  const userPrompt = JSON.stringify(
    {
      question: question.trim(),
      metrics: {
        sodium_mg: payload.sodium,
        vitamin_d_mcg: payload.vitaminD,
        calcium_mg: payload.calcium,
        magnesium_mg: payload.magnesium,
        retinal_scan_uploaded: payload.hasScan,
      },
      report,
    },
    null,
    2,
  );

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: userPrompt }],
        },
      ],
      temperature: 0.4,
      max_output_tokens: 260,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    return NextResponse.json(
      {
        error: "OpenAI request failed.",
        detail: errorText.slice(0, 500),
      },
      { status: 502 },
    );
  }

  const data = (await response.json()) as {
    output_text?: string;
  };

  return NextResponse.json({
    answer:
      data.output_text?.trim() ||
      "I can explain the report, but I could not generate an answer this time. Please try rephrasing your question.",
  });
}
