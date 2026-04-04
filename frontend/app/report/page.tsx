"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Payload = {
  sodium: number;
  hasScan: boolean;
  exercises: { type: string; duration: number; intensity: number }[];
};

type RiskResult = {
  score: number;
  level: "Low" | "Moderate" | "High";
  factors: { label: string; impact: "high" | "medium" | "low"; positive: boolean }[];
  recommendations: string[];
};

function computeRisk(payload: Payload): RiskResult {
  let score = 30; // baseline

  // Sodium contribution
  const na = payload.sodium;
  if (na > 145)      score += 15 + Math.min((na - 145) * 2, 20);
  else if (na < 135) score += 10;
  else               score -= 5;

  // Exercise contribution
  if (payload.exercises.length === 0) {
    score += 20;
  } else {
    const avgIntensity = payload.exercises.reduce((s, e) => s + e.intensity, 0) / payload.exercises.length;
    const totalMins    = payload.exercises.reduce((s, e) => s + e.duration, 0);
    const hasResistance = payload.exercises.some((e) => e.type === "Resistance" || e.type === "Mixed");

    if (avgIntensity < 4)  score += 12;
    if (avgIntensity > 7)  score -= 8;
    if (totalMins < 20)    score += 8;
    if (totalMins >= 45)   score -= 6;
    if (hasResistance)     score -= 8;
  }

  // Retinal scan bonus
  if (payload.hasScan) score -= 5;

  score = Math.max(5, Math.min(98, score));

  const level: RiskResult["level"] =
    score < 35 ? "Low" : score < 65 ? "Moderate" : "High";

  const factors: RiskResult["factors"] = [];

  if (na > 145)
    factors.push({ label: `High sodium (${na} mmol/L)`, impact: "high", positive: false });
  else if (na >= 135 && na <= 145)
    factors.push({ label: `Normal sodium (${na} mmol/L)`, impact: "medium", positive: true });
  else
    factors.push({ label: `Low sodium (${na} mmol/L)`, impact: "medium", positive: false });

  if (payload.exercises.length === 0) {
    factors.push({ label: "No exercise logged", impact: "high", positive: false });
  } else {
    const avgI = payload.exercises.reduce((s, e) => s + e.intensity, 0) / payload.exercises.length;
    const totalM = payload.exercises.reduce((s, e) => s + e.duration, 0);
    factors.push({
      label: `Avg intensity ${avgI.toFixed(1)}/10`,
      impact: avgI < 4 ? "high" : "medium",
      positive: avgI >= 5,
    });
    factors.push({
      label: `${totalM} min total exercise`,
      impact: totalM < 20 ? "medium" : "low",
      positive: totalM >= 30,
    });
    const hasR = payload.exercises.some((e) => e.type === "Resistance" || e.type === "Mixed");
    factors.push({ label: hasR ? "Includes resistance training" : "No resistance training", impact: "medium", positive: hasR });
  }

  if (payload.hasScan)
    factors.push({ label: "Retinal scan provided", impact: "low", positive: true });

  const recommendations: string[] = [];
  if (na > 145)   recommendations.push("Reduce dietary sodium intake. Target 135–145 mmol/L.");
  if (na < 135)   recommendations.push("Monitor sodium levels. Consider electrolyte supplementation.");
  if (payload.exercises.length === 0)
    recommendations.push("Begin a structured exercise program with at least 3 sessions/week.");
  else {
    const avgI = payload.exercises.reduce((s, e) => s + e.intensity, 0) / payload.exercises.length;
    const hasR = payload.exercises.some((e) => e.type === "Resistance" || e.type === "Mixed");
    if (avgI < 5) recommendations.push("Increase exercise intensity to moderate level (5–7/10).");
    if (!hasR)    recommendations.push("Incorporate resistance training — it helps reduce intracranial pressure shifts.");
  }
  if (!payload.hasScan)
    recommendations.push("Schedule a retinal / OCT scan for baseline ocular health data.");
  if (level === "High")
    recommendations.push("Consult a flight surgeon for comprehensive SANS screening protocol.");

  return { score, level, factors, recommendations };
}

export default function ReportPage() {
  const router = useRouter();
  const [result, setResult] = useState<RiskResult | null>(null);
  const [animScore, setAnimScore] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("sans_payload");
    const payload: Payload = raw
      ? JSON.parse(raw)
      : { sodium: 142, hasScan: false, exercises: [] };

    setTimeout(() => {
      const r = computeRisk(payload);
      setResult(r);
      setReady(true);
      // Animate score count-up
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

  const { score, level, factors, recommendations } = result;
  const levelColor = level === "Low" ? "#22c55e" : level === "Moderate" ? "#f59e0b" : "#ef4444";
  const levelBg    = level === "Low" ? "rgba(34,197,94,0.1)" : level === "Moderate" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)";

  // SVG ring
  const R = 70;
  const CIRC = 2 * Math.PI * R;
  const dash = (score / 100) * CIRC;

  return (
    <div className="relative min-h-screen">
      <div className="starfield" />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
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

        {/* Score card */}
        <div className="glass-card p-8 mb-5 slide-up flex flex-col items-center">
          <p className="text-slate-400 text-sm mb-6 uppercase tracking-widest font-medium">SANS Risk Score</p>

          {/* Ring gauge */}
          <div className="relative w-44 h-44 mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              {/* Track */}
              <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
              {/* Score arc */}
              <circle
                cx="80" cy="80" r={R}
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

          {/* Level badge */}
          <div
            className="px-6 py-2 rounded-full text-lg font-semibold mb-3"
            style={{ background: levelBg, color: levelColor, border: `1px solid ${levelColor}44` }}
          >
            {level} Risk
          </div>

          <p className="text-slate-400 text-sm text-center max-w-sm leading-relaxed">
            {level === "Low" &&
              "Your current metrics indicate low SANS risk. Maintain your exercise and dietary habits."}
            {level === "Moderate" &&
              "Moderate risk detected. Consider the recommendations below to reduce risk factors."}
            {level === "High" &&
              "Elevated risk. Action is recommended. Review all contributing factors and consult a specialist."}
          </p>
        </div>

        {/* Contributing factors */}
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

        {/* Recommendations */}
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

        {/* Disclaimer */}
        <div
          className="rounded-xl px-5 py-4 mb-6 text-xs text-slate-500 leading-relaxed border"
          style={{ background: "rgba(245,158,11,0.04)", borderColor: "rgba(245,158,11,0.15)" }}
        >
          ⚠️ <strong className="text-amber-500/80">Prototype only.</strong> SANSight is a screening tool, not a
          clinical diagnostic system. All scores are estimates based on self-reported data. Consult a licensed
          aerospace medicine physician for any health concerns.
        </div>

        {/* CTA */}
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
  if (impact === "high")   return positive ? "#22c55e" : "#ef4444";
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
