"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Payload = {
  sodium: number;
  vitaminD: number;
  calcium: number;
  magnesium: number;
  hasScan: boolean;
};

type RiskResult = {
  score: number;
  level: "Low" | "Moderate" | "High";
  factors: { label: string; impact: "high" | "medium" | "low"; positive: boolean }[];
  recommendations: string[];
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function computeRisk(payload: Payload): RiskResult {
  let score = 30;

  const sodium = payload.sodium;
  const vitaminD = payload.vitaminD;
  const calcium = payload.calcium;
  const magnesium = payload.magnesium;

  if (sodium > 2300) score += 18 + Math.min(((sodium - 2300) / 100) * 1.5, 12);
  else score -= 4;

  if (vitaminD < 10) score += 16;
  else score -= 3;

  if (calcium < 1000) score += 10;
  else score -= 2;

  if (magnesium < 310) score += 8;
  else score -= 2;

  if (payload.hasScan) score -= 5;

  score = Math.max(5, Math.min(98, score));

  const level: RiskResult["level"] =
    score < 35 ? "Low" : score < 65 ? "Moderate" : "High";

  const factors: RiskResult["factors"] = [];

  if (sodium > 2300) {
    factors.push({ label: `High sodium intake (${sodium} mg)`, impact: "high", positive: false });
  } else {
    factors.push({ label: `Sodium within target (${sodium} mg)`, impact: "medium", positive: true });
  }

  if (vitaminD < 10) {
    factors.push({ label: `Vitamin D deficient (${vitaminD} mcg)`, impact: "high", positive: false });
  } else {
    factors.push({ label: `Vitamin D above deficiency threshold (${vitaminD} mcg)`, impact: "medium", positive: true });
  }

  if (calcium < 1000) {
    factors.push({ label: `Calcium below target (${calcium} mg)`, impact: "medium", positive: false });
  } else {
    factors.push({ label: `Calcium meets target (${calcium} mg)`, impact: "low", positive: true });
  }

  if (magnesium < 310) {
    factors.push({ label: `Magnesium below target (${magnesium} mg)`, impact: "medium", positive: false });
  } else {
    factors.push({ label: `Magnesium meets target (${magnesium} mg)`, impact: "low", positive: true });
  }

  if (payload.hasScan) {
    factors.push({ label: "Retinal scan provided", impact: "low", positive: true });
  }

  const recommendations: string[] = [];
  if (sodium > 2300) recommendations.push("Reduce sodium intake toward the recommended maximum of 2300 mg.");
  if (vitaminD < 10) recommendations.push("Address vitamin D deficiency and aim to move above 10 mcg.");
  if (calcium < 1000) recommendations.push("Increase calcium intake toward the recommended minimum of 1000 mg.");
  if (magnesium < 310) recommendations.push("Increase magnesium intake toward the recommended minimum of 310 mg.");
  if (!payload.hasScan) recommendations.push("Schedule a retinal / OCT scan for baseline ocular health data.");
  if (level === "High") recommendations.push("Consult a flight surgeon for comprehensive SANS screening protocol.");

  return { score, level, factors, recommendations };
}

export default function ReportPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [result, setResult] = useState<RiskResult | null>(null);
  const [animScore, setAnimScore] = useState(0);
  const [ready, setReady] = useState(false);
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);

  async function askAboutReport(nextQuestion: string) {
    if (!payload || !result) return;

    const trimmed = nextQuestion.trim();
    if (!trimmed) return;

    setAssistantError(null);
    setAssistantLoading(true);
    setChat((prev) => [...prev, { role: "user", content: trimmed }]);
    setQuestion("");

    try {
      const response = await fetch("/api/report-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: trimmed,
          payload,
          report: result,
        }),
      });

      const data = (await response.json()) as { answer?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to reach the report assistant.");
      }

      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.answer ||
            "I can explain the report, but I could not generate an answer this time.",
        },
      ]);
    } catch (error) {
      setAssistantError(error instanceof Error ? error.message : "Unable to reach the report assistant.");
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I can explain the report, but the assistant is unavailable right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setAssistantLoading(false);
    }
  }

  useEffect(() => {
    const raw = localStorage.getItem("sans_payload");
    const nextPayload: Payload = raw
      ? JSON.parse(raw)
      : { sodium: 1800, vitaminD: 15, calcium: 1000, magnesium: 320, hasScan: false };
    setPayload(nextPayload);

    setTimeout(() => {
      const r = computeRisk(nextPayload);
      setResult(r);
      setReady(true);

      let current = 0;
      const step = r.score / 40;
      const interval = setInterval(() => {
        current = Math.min(current + step, r.score);
        setAnimScore(Math.round(current));
        if (current >= r.score) clearInterval(interval);
      }, 30);
    }, 600);
  }, []);

  if (!ready || !result) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="starfield" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-slate-400">Running risk model…</p>
        </div>
      </div>
    );
  }

  const starterQuestions = [
    "Why is my score this high?",
    "Which metric had the biggest effect?",
    "What should I improve first?",
    "Explain my vitamin D result.",
  ];

  const { level, factors, recommendations } = result;
  const levelColor = level === "Low" ? "#22c55e" : level === "Moderate" ? "#f59e0b" : "#ef4444";
  const levelBg = level === "Low" ? "rgba(34,197,94,0.1)" : level === "Moderate" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)";

  const R = 70;
  const CIRC = 2 * Math.PI * R;

  return (
    <div className="relative min-h-screen">
      <div className="starfield" />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push("/log")}
            className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Risk Report</h1>
            <p className="text-slate-500 text-sm">SANS risk estimation · {new Date().toLocaleDateString()}</p>
          </div>
          <div className="ml-auto">
            <StepsIndicator step={3} />
          </div>
        </div>

        <div className="glass-card p-8 mb-5 slide-up flex flex-col items-center">
          <p className="text-slate-400 text-sm mb-6 uppercase tracking-widest font-medium">SANS Risk Score</p>

          <div className="relative w-44 h-44 mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
              <circle
                cx="80"
                cy="80"
                r={R}
                fill="none"
                stroke={levelColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(animScore / 100) * CIRC} ${CIRC}`}
                style={{ transition: "stroke-dasharray 0.05s linear", filter: `drop-shadow(0 0 8px ${levelColor})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-white">{animScore}</span>
              <span className="text-slate-400 text-sm">out of 100</span>
            </div>
          </div>

          <div
            className="px-6 py-2 rounded-full text-lg font-semibold mb-3"
            style={{ background: levelBg, color: levelColor, border: `1px solid ${levelColor}44` }}
          >
            {level} Risk
          </div>

          <p className="text-slate-400 text-sm text-center max-w-sm leading-relaxed">
            {level === "Low" &&
              "Your current metrics indicate low SANS risk. Maintain your current health and dietary habits."}
            {level === "Moderate" &&
              "Moderate risk detected. Consider the recommendations below to reduce risk factors."}
            {level === "High" &&
              "Elevated risk. Action is recommended. Review all contributing factors and consult a specialist."}
          </p>
        </div>

        <div className="glass-card p-6 mb-5 slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span>📊</span> Contributing Factors
          </h2>
          <div className="space-y-3">
            {factors.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`text-base ${f.positive ? "text-green-400" : "text-red-400"}`}>
                  {f.positive ? "↑" : "↓"}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300 text-sm">{f.label}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                      style={{
                        background: impactColor(f.impact, f.positive) + "22",
                        color: impactColor(f.impact, f.positive),
                      }}
                    >
                      {f.impact} impact
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-700/60 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: f.impact === "high" ? "80%" : f.impact === "medium" ? "50%" : "25%",
                        background: impactColor(f.impact, f.positive),
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="glass-card p-6 mb-5 slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <span>💡</span> Recommendations
            </h2>
            <ul className="space-y-3">
              {recommendations.map((r, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 text-[10px] font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-slate-300 text-sm leading-relaxed">{r}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="glass-card p-6 mb-5 slide-up" style={{ animationDelay: "0.25s" }}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="font-semibold text-white flex items-center gap-2">
                <span>🧠</span> Ask About This Report
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                This assistant can explain the report in plain language, but it does not diagnose, prescribe, or give emergency medical advice.
              </p>
            </div>
            <span className="text-[11px] text-cyan-200 bg-cyan-400/10 border border-cyan-300/20 px-2.5 py-1 rounded-full">
              Educational only
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {starterQuestions.map((starter) => (
              <button
                key={starter}
                onClick={() => void askAboutReport(starter)}
                disabled={assistantLoading}
                className="rounded-full border border-slate-700/60 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300 hover:border-indigo-500/50 hover:text-white transition-all disabled:opacity-50"
              >
                {starter}
              </button>
            ))}
          </div>

          <div className="space-y-3 mb-4">
            {chat.length === 0 && (
              <div className="rounded-2xl border border-slate-700/50 bg-slate-950/45 px-4 py-4 text-sm text-slate-400">
                Ask why a metric changed your score, which factor mattered most, or what this prototype is trying to signal.
              </div>
            )}

            {chat.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "ml-auto max-w-[85%] border border-indigo-500/30 bg-indigo-500/10 text-indigo-100"
                    : "max-w-[90%] border border-slate-700/50 bg-slate-950/50 text-slate-300"
                }`}
              >
                {message.content}
              </div>
            ))}

            {assistantLoading && (
              <div className="max-w-[90%] rounded-2xl border border-slate-700/50 bg-slate-950/50 px-4 py-3 text-sm text-slate-400">
                Thinking through your report...
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void askAboutReport(question);
                }
              }}
              placeholder="Ask a question about this report"
              className="flex-1 rounded-xl border border-slate-700/60 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
            />
            <button
              onClick={() => void askAboutReport(question)}
              disabled={assistantLoading || !question.trim()}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              }}
            >
              Ask
            </button>
          </div>

          {assistantError && <p className="mt-3 text-xs text-amber-400">{assistantError}</p>}
        </div>

        <div
          className="rounded-xl px-5 py-4 mb-6 text-xs text-slate-500 leading-relaxed border"
          style={{ background: "rgba(245,158,11,0.04)", borderColor: "rgba(245,158,11,0.15)" }}
        >
          ⚠️ <strong className="text-amber-500/80">Prototype only.</strong> SANSight is a screening tool, not a
          clinical diagnostic system. All scores are estimates based on self-reported data. Consult a licensed
          aerospace medicine physician for any health concerns.
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/log")}
            className="flex-1 py-3 rounded-xl bg-slate-700/60 border border-slate-600/50 text-slate-300 hover:bg-slate-700 transition-all text-sm font-medium"
          >
            ← Log New Entry
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined") window.print();
            }}
            className="flex-1 py-3 rounded-xl font-semibold text-white transition-all text-sm"
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
          >
            Export Report ↗
          </button>
        </div>
      </div>
    </div>
  );
}

function impactColor(impact: string, positive: boolean) {
  if (impact === "high") return positive ? "#22c55e" : "#ef4444";
  if (impact === "medium") return positive ? "#86efac" : "#f59e0b";
  return "#64748b";
}

function StepsIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className="h-2 rounded-full transition-all"
          style={{
            background: s <= step ? "#6366f1" : "#334155",
            width: s === step ? "20px" : "8px",
          }}
        />
      ))}
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}
