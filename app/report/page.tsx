"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ExerciseLog = {
  id: string;
  type: string;
  duration: number;
  intensity: number;
};

type Payload = {
  sodium: number;
  calcium: number;
  magnesium: number;
  vitaminD: number;
  visionChange: number;
  blurredVision: boolean;
  headachePressure: boolean;
  eyeStrain: boolean;
  hasScan: boolean;
  exercises: ExerciseLog[];
};

type Factor = {
  label: string;
  detail: string;
  impact: "low" | "medium" | "high";
  positive: boolean;
};

type RiskResult = {
  score: number;
  level: "Low" | "Moderate" | "High";
  confidence: "Limited" | "Moderate" | "Stronger";
  factors: Factor[];
  recommendations: string[];
};

function computeRisk(payload: Payload): RiskResult {
  let score = 29;
  const factors: Factor[] = [];
  const recommendations: string[] = [];

  if (payload.sodium > 145) {
    score += 18 + Math.min((payload.sodium - 145) * 1.4, 10);
    factors.push({
      label: "Elevated sodium",
      detail: `${payload.sodium} mmol/L may correlate with fluid-shift risk.`,
      impact: "high",
      positive: false,
    });
    recommendations.push("Review sodium intake and hydration targets with your mission medical plan.");
  } else if (payload.sodium < 135) {
    score += 9;
    factors.push({
      label: "Low sodium",
      detail: `${payload.sodium} mmol/L is outside the typical range.`,
      impact: "medium",
      positive: false,
    });
    recommendations.push("Recheck electrolytes to confirm whether sodium is trending out of range.");
  } else {
    score -= 4;
    factors.push({
      label: "Sodium in target range",
      detail: `${payload.sodium} mmol/L supports a lower electrolyte-driven concern.`,
      impact: "medium",
      positive: true,
    });
  }

  if (payload.calcium < 8.6) {
    score += 9;
    factors.push({
      label: "Lower calcium",
      detail: `${payload.calcium} mg/dL may increase musculoskeletal concern.`,
      impact: "medium",
      positive: false,
    });
    recommendations.push("Track calcium with vitamin D because bone health is part of the broader astronaut risk picture.");
  } else {
    score -= 2;
    factors.push({
      label: "Calcium supportive",
      detail: `${payload.calcium} mg/dL is within a reassuring range for this prototype.`,
      impact: "low",
      positive: true,
    });
  }

  if (payload.magnesium < 1.7) {
    score += 8;
    factors.push({
      label: "Lower magnesium",
      detail: `${payload.magnesium} mg/dL can reflect reduced recovery support.`,
      impact: "medium",
      positive: false,
    });
    recommendations.push("Monitor magnesium status, especially if exercise load or muscle symptoms change.");
  } else {
    score -= 2;
    factors.push({
      label: "Magnesium adequate",
      detail: `${payload.magnesium} mg/dL helps stabilize the score.`,
      impact: "low",
      positive: true,
    });
  }

  if (payload.vitaminD < 20) {
    score += 12;
    factors.push({
      label: "Low vitamin D",
      detail: `${payload.vitaminD} ng/mL may signal reduced bone-health support.`,
      impact: "high",
      positive: false,
    });
    recommendations.push("Consider vitamin D follow-up because low levels may compound long-duration mission strain.");
  } else if (payload.vitaminD < 30) {
    score += 5;
    factors.push({
      label: "Borderline vitamin D",
      detail: `${payload.vitaminD} ng/mL is usable but not ideal.`,
      impact: "medium",
      positive: false,
    });
  } else {
    score -= 3;
    factors.push({
      label: "Vitamin D supportive",
      detail: `${payload.vitaminD} ng/mL strengthens nutritional readiness.`,
      impact: "medium",
      positive: true,
    });
  }

  if (payload.visionChange >= 8) {
    score += 20;
    factors.push({
      label: "Concerning vision change",
      detail: `Self-reported change of ${payload.visionChange}/10 needs rapid follow-up.`,
      impact: "high",
      positive: false,
    });
    recommendations.push("Escalate a formal eye exam quickly if vision changes are intensifying.");
  } else if (payload.visionChange >= 5) {
    score += 11;
    factors.push({
      label: "Noticeable vision shift",
      detail: `Self-reported change of ${payload.visionChange}/10 suggests early signal drift.`,
      impact: "medium",
      positive: false,
    });
  } else {
    score -= 4;
    factors.push({
      label: "Stable self-check",
      detail: `Self-reported change of ${payload.visionChange}/10 is relatively mild.`,
      impact: "low",
      positive: true,
    });
  }

  const symptomCount = Number(payload.blurredVision) + Number(payload.headachePressure) + Number(payload.eyeStrain);
  if (symptomCount > 0) {
    score += symptomCount * 5;
    factors.push({
      label: "Reported symptoms today",
      detail: `${symptomCount} symptom${symptomCount > 1 ? "s" : ""} logged in the vision check.`,
      impact: symptomCount >= 2 ? "high" : "medium",
      positive: false,
    });
    recommendations.push("Compare today’s symptoms with prior logs to catch upward trends, not just one-off events.");
  } else {
    factors.push({
      label: "No symptoms reported",
      detail: "No blur, head pressure, or eye strain was logged today.",
      impact: "low",
      positive: true,
    });
  }

  const totalMinutes = payload.exercises.reduce((sum, exercise) => sum + exercise.duration, 0);
  const averageIntensity =
    payload.exercises.length > 0
      ? payload.exercises.reduce((sum, exercise) => sum + exercise.intensity, 0) / payload.exercises.length
      : 0;
  const hasResistance = payload.exercises.some(
    (exercise) => exercise.type === "Resistance" || exercise.type === "Mixed",
  );

  if (payload.exercises.length === 0) {
    score += 15;
    factors.push({
      label: "No exercise logged",
      detail: "Missing training data weakens confidence and raises caution.",
      impact: "high",
      positive: false,
    });
    recommendations.push("Log resistance or mixed exercise sessions to improve musculoskeletal protection.");
  } else {
    if (totalMinutes < 30) {
      score += 7;
      recommendations.push("Aim for a stronger weekly exercise baseline if mission constraints allow.");
    } else {
      score -= 5;
    }

    if (averageIntensity >= 5) {
      score -= 4;
    } else {
      score += 5;
    }

    if (hasResistance) {
      score -= 6;
    } else {
      score += 6;
      recommendations.push("Add resistance work because it supports fluid and musculoskeletal countermeasures.");
    }

    factors.push({
      label: "Exercise adherence",
      detail: `${totalMinutes} min logged at average intensity ${averageIntensity.toFixed(1)}/10.`,
      impact: totalMinutes >= 30 && hasResistance ? "medium" : "high",
      positive: totalMinutes >= 30 && hasResistance,
    });
  }

  if (payload.hasScan) {
    score -= 4;
    factors.push({
      label: "Retinal scan uploaded",
      detail: "More data improves screening coverage and future model confidence.",
      impact: "medium",
      positive: true,
    });
  } else {
    recommendations.push("Upload a retinal scan or OCT image when available to strengthen the vision signal.");
  }

  score = Math.max(6, Math.min(97, Math.round(score)));

  const level: RiskResult["level"] = score < 35 ? "Low" : score < 65 ? "Moderate" : "High";

  const confidence: RiskResult["confidence"] = payload.hasScan
    ? payload.exercises.length > 0
      ? "Stronger"
      : "Moderate"
    : payload.exercises.length > 0
      ? "Moderate"
      : "Limited";

  if (level === "High") {
    recommendations.push("Treat this as an early warning signal and hand off to a clinician or flight surgeon for review.");
  } else if (level === "Moderate") {
    recommendations.push("Repeat the screening after the next data collection cycle to watch for direction of change.");
  } else {
    recommendations.push("Maintain current monitoring cadence and keep collecting high-quality baseline data.");
  }

  return { score, level, confidence, factors, recommendations };
}

export default function ReportPage() {
  const router = useRouter();
  const [result, setResult] = useState<RiskResult | null>(null);
  const [payload, setPayload] = useState<Payload | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem("sans_payload");
    const fallback: Payload = {
      sodium: 139,
      calcium: 9.1,
      magnesium: 2.0,
      vitaminD: 30,
      visionChange: 3,
      blurredVision: false,
      headachePressure: false,
      eyeStrain: false,
      hasScan: false,
      exercises: [],
    };

    const parsed = raw ? (JSON.parse(raw) as Payload) : fallback;
    const computed = computeRisk(parsed);
    setPayload(parsed);
    setResult(computed);

    let current = 0;
    const step = computed.score / 38;
    const interval = setInterval(() => {
      current = Math.min(current + step, computed.score);
      setAnimatedScore(Math.round(current));
      if (current >= computed.score) clearInterval(interval);
    }, 28);

    return () => clearInterval(interval);
  }, []);

  if (!result || !payload) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="starfield" />
        <div className="orb orb-left" />
        <div className="orb orb-right" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
          <p className="text-sm text-slate-400">Computing the SANS screening summary...</p>
        </div>
      </div>
    );
  }

  const levelColor = result.level === "Low" ? "#4ade80" : result.level === "Moderate" ? "#fbbf24" : "#f87171";
  const ringRadius = 76;
  const ringCircumference = 2 * Math.PI * ringRadius;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="starfield" />
      <div className="orb orb-left" />
      <div className="orb orb-right" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <button onClick={() => router.push("/log")} className="icon-button">
            <ArrowLeftIcon />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">SANS Risk Report</h1>
            <p className="text-sm text-slate-400">
              Screening summary for {new Date().toLocaleDateString()} based on the latest intake.
            </p>
          </div>
          <div className="ml-auto hidden sm:block">
            <StepsIndicator step={3} />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.96fr_1.04fr]">
          <section className="space-y-5">
            <div className="glass-card p-6 slide-up">
              <p className="eyebrow mb-4">Risk Estimate</p>
              <div className="flex flex-col items-center rounded-[2rem] border border-white/8 bg-white/[0.03] px-5 py-7">
                <div className="relative h-48 w-48">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 180 180">
                    <circle cx="90" cy="90" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                    <circle
                      cx="90"
                      cy="90"
                      r={ringRadius}
                      fill="none"
                      stroke={levelColor}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${(animatedScore / 100) * ringCircumference} ${ringCircumference}`}
                      style={{ filter: `drop-shadow(0 0 12px ${levelColor})` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-semibold text-white">{animatedScore}</span>
                    <span className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">Risk score</span>
                  </div>
                </div>

                <div
                  className="mt-5 rounded-full border px-4 py-2 text-sm font-semibold"
                  style={{ borderColor: `${levelColor}55`, color: levelColor, background: `${levelColor}14` }}
                >
                  {result.level} risk
                </div>

                <p className="mt-4 max-w-sm text-center text-sm leading-6 text-slate-300">
                  {result.level === "Low" &&
                    "Current inputs suggest a relatively stable baseline. Continue collecting data to strengthen trend visibility."}
                  {result.level === "Moderate" &&
                    "The model sees several inputs worth watching. This is the zone where early intervention and repeat screening matter."}
                  {result.level === "High" &&
                    "Several signals are elevated together. The prototype would flag this entry for rapid follow-up rather than waiting for symptoms to compound."}
                </p>
              </div>
            </div>

            <div className="glass-card p-6 slide-up" style={{ animationDelay: "0.08s" }}>
              <p className="eyebrow mb-4">Model Confidence</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryChip label="Confidence" value={result.confidence} accent="#6ae3ff" />
                <SummaryChip label="Retinal data" value={payload.hasScan ? "Included" : "Missing"} accent="#a78bfa" />
                <SummaryChip label="Exercise logs" value={`${payload.exercises.length} session${payload.exercises.length === 1 ? "" : "s"}`} accent="#fbbf24" />
                <SummaryChip label="Vision self-check" value={`${payload.visionChange}/10`} accent="#fb7185" />
              </div>
            </div>

            <div className="glass-card p-6 slide-up" style={{ animationDelay: "0.16s" }}>
              <p className="eyebrow mb-4">Captured Inputs</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <InputRow label="Sodium" value={`${payload.sodium} mmol/L`} />
                <InputRow label="Calcium" value={`${payload.calcium} mg/dL`} />
                <InputRow label="Magnesium" value={`${payload.magnesium} mg/dL`} />
                <InputRow label="Vitamin D" value={`${payload.vitaminD} ng/mL`} />
                <InputRow label="Blurred vision" value={payload.blurredVision ? "Reported" : "Not reported"} />
                <InputRow label="Head pressure" value={payload.headachePressure ? "Reported" : "Not reported"} />
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="glass-card p-6 slide-up">
              <p className="eyebrow mb-4">Contributing Factors</p>
              <div className="space-y-3">
                {result.factors.map((factor) => (
                  <div key={factor.label} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{factor.label}</p>
                      <span
                        className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em]"
                        style={{
                          color: factor.positive ? "#86efac" : factor.impact === "high" ? "#fca5a5" : "#fcd34d",
                          background: factor.positive ? "rgba(34,197,94,0.14)" : "rgba(251,191,36,0.12)",
                        }}
                      >
                        {factor.impact} impact
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{factor.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 slide-up" style={{ animationDelay: "0.08s" }}>
              <p className="eyebrow mb-4">Recommended Next Steps</p>
              <div className="space-y-3">
                {result.recommendations.map((recommendation, index) => (
                  <div key={`${recommendation}-${index}`} className="flex gap-3 rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-xs font-semibold text-cyan-200">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-slate-300">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-300/15 bg-amber-300/[0.05] px-5 py-4 text-sm leading-6 text-slate-300">
              <span className="font-semibold text-amber-200">Prototype disclaimer:</span> SANSight is a hackathon
              screening tool. It estimates relative risk from a small set of inputs and should not be used as a medical
              diagnosis or treatment recommendation.
            </div>

            <div className="flex gap-3">
              <button onClick={() => router.push("/log")} className="secondary-button flex-1 justify-center">
                Log a new entry
              </button>
              <button
                onClick={() => window.print()}
                className="primary-button flex-1 justify-center"
              >
                Export summary
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SummaryChip({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

function InputRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function StepsIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-2 rounded-full transition-all"
          style={{
            background: item <= step ? "#6ae3ff" : "#2a3c4a",
            width: item === step ? "24px" : "8px",
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
