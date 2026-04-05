"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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

type RetinalResult = {
  detected: boolean;
  label: string;
  stage: "Mild" | "Moderate" | "Severe" | "Proliferative" | null;
  tone: {
    accent: string;
    glow: string;
    panel: string;
    badge: string;
    border: string;
  };
  summary: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function levelFromScore(score: number): RiskResult["level"] {
  if (score < 35) return "Low";
  if (score < 65) return "Moderate";
  return "High";
}

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

  score = Math.max(5, Math.min(98, score));

  const level = levelFromScore(score);

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

  const recommendations: string[] = [];
  if (sodium > 2300) recommendations.push("Reduce sodium intake toward the recommended maximum of 2300 mg.");
  if (vitaminD < 10) recommendations.push("Address vitamin D deficiency and aim to move above 10 mcg.");
  if (calcium < 1000) recommendations.push("Increase calcium intake toward the recommended minimum of 1000 mg.");
  if (magnesium < 310) recommendations.push("Increase magnesium intake toward the recommended minimum of 310 mg.");
  if (!payload.hasScan) recommendations.push("Schedule a retinal / OCT scan for baseline ocular health data.");
  if (level === "High") recommendations.push("Consult a flight surgeon for comprehensive SANS screening protocol.");

  return { score, level, factors, recommendations };
}

function simulateRetinalResult(payload: Payload): RetinalResult {
  if (!payload.hasScan) {
    return {
      detected: false,
      label: "No SANS Detected",
      stage: null,
      tone: {
        accent: "#22c55e",
        glow: "rgba(34,197,94,0.24)",
        panel: "linear-gradient(180deg, rgba(7,28,20,0.96), rgba(7,18,27,0.92))",
        badge: "rgba(34,197,94,0.12)",
        border: "rgba(74,222,128,0.28)",
      },
      summary: "No retinal SANS findings were simulated for the current report state.",
    };
  }

  const abnormalities =
    Number(payload.sodium > 2300) +
    Number(payload.vitaminD < 10) +
    Number(payload.calcium < 1000) +
    Number(payload.magnesium < 310);

  const stage: RetinalResult["stage"] =
    abnormalities >= 4 ? "Proliferative" : abnormalities === 3 ? "Severe" : abnormalities === 2 ? "Moderate" : "Mild";

  return {
    detected: true,
    label: "SANS Detected",
    stage,
    tone: {
      accent: stage === "Mild" ? "#fb923c" : stage === "Moderate" ? "#f97316" : "#ef4444",
      glow: stage === "Mild" ? "rgba(251,146,60,0.3)" : stage === "Moderate" ? "rgba(249,115,22,0.3)" : "rgba(239,68,68,0.32)",
      panel:
        stage === "Mild"
          ? "linear-gradient(180deg, rgba(42,20,10,0.96), rgba(12,16,30,0.92))"
          : stage === "Moderate"
            ? "linear-gradient(180deg, rgba(52,24,8,0.96), rgba(12,16,30,0.92))"
            : "linear-gradient(180deg, rgba(44,10,14,0.96), rgba(12,16,30,0.92))",
      badge: stage === "Mild" ? "rgba(251,146,60,0.14)" : stage === "Moderate" ? "rgba(249,115,22,0.14)" : "rgba(239,68,68,0.14)",
      border: stage === "Mild" ? "rgba(251,146,60,0.3)" : stage === "Moderate" ? "rgba(249,115,22,0.3)" : "rgba(248,113,113,0.32)",
    },
    summary: "A placeholder retinal model flagged simulated optic-disc findings while retinal backend inference is still offline.",
  };
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
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [launchState, setLaunchState] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    moved: boolean;
  } | null>(null);
  const [landingState, setLandingState] = useState<{ x: number; y: number } | null>(null);
  const [earthPosition, setEarthPosition] = useState({ x: 0, y: 96 });
  const [draggingEarth, setDraggingEarth] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelAnchorRef = useRef<HTMLDivElement>(null);
  const formalSectionRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  function clampEarthPosition(x: number, y: number) {
    const width = 120;
    const height = 140;

    return {
      x: Math.min(Math.max(12, x), Math.max(12, window.innerWidth - width - 12)),
      y: Math.min(Math.max(88, y), Math.max(88, window.innerHeight - height - 12)),
    };
  }

  function handleEarthPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (assistantOpen || launchState) return;

    const rect = event.currentTarget.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    setDraggingEarth(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleEarthPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) return;

    const next = clampEarthPosition(
      event.clientX - dragStateRef.current.offsetX,
      event.clientY - dragStateRef.current.offsetY,
    );

    setEarthPosition(next);
    setDraggingEarth(true);
  }

  function handleEarthPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    window.setTimeout(() => setDraggingEarth(false), 0);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleAssistantToggle() {
    if (draggingEarth) return;
    if (assistantOpen) {
      setAssistantOpen(false);
      return;
    }

    const triggerRect = triggerRef.current?.getBoundingClientRect();
    const anchorRect = panelAnchorRef.current?.getBoundingClientRect();

    if (!triggerRect || !anchorRect) {
      setAssistantOpen(true);
      return;
    }

    const startX = triggerRect.left + triggerRect.width / 2 - 21;
    const startY = triggerRect.top + triggerRect.height / 2 - 21;
    const endX = Math.min(anchorRect.left + 32, window.innerWidth - 120);
    const endY = anchorRect.top + 18;

    setLaunchState({ startX, startY, endX, endY, moved: false });

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setLaunchState((prev) => (prev ? { ...prev, moved: true } : prev));
      });
    });

    window.setTimeout(() => {
      setLandingState({ x: endX, y: endY });
    }, 1050);

    window.setTimeout(() => {
      setAssistantOpen(true);
      setLaunchState(null);
      setLandingState(null);
    }, 1280);
  }

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

      const data = (await response.json()) as { answer?: string; error?: string; detail?: string };

      if (!response.ok) {
        throw new Error(data.detail || data.error || "Unable to reach the report assistant.");
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

    let isMounted = true;
    let interval: ReturnType<typeof setInterval> | undefined;

    const loadRisk = async () => {
      const fallback = computeRisk(nextPayload);
      let nextResult = fallback;

      try {
        const response = await fetch("http://localhost:4000/api/predict-risk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(nextPayload),
        });

        if (response.ok) {
          const data = (await response.json()) as { risk_score?: number };
          if (typeof data.risk_score === "number" && Number.isFinite(data.risk_score)) {
            const score = Math.max(0, Math.min(100, data.risk_score * 100));
            nextResult = {
              ...fallback,
              score,
              level: levelFromScore(score),
            };
          }
        }
      } catch {
        nextResult = fallback;
      }

      if (!isMounted) return;

      setResult(nextResult);
      setReady(true);

      let current = 0;
      const step = nextResult.score / 40;
      interval = setInterval(() => {
        current = Math.min(current + step, nextResult.score);
        setAnimScore(Math.round(current));
        if (current >= nextResult.score && interval) clearInterval(interval);
      }, 30);
    };

    const timeout = window.setTimeout(() => {
      void loadRisk();
    }, 600);

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
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
  const retinal = payload
    ? simulateRetinalResult(payload)
    : simulateRetinalResult({ sodium: 0, vitaminD: 0, calcium: 0, magnesium: 0, hasScan: false });
  const summary =
    level === "Low"
      ? "Biometric inputs remain in a comparatively stable range for this prototype model."
      : level === "Moderate"
        ? "A few biometric signals are drifting away from target and deserve closer monitoring."
        : "Multiple biometric signals are outside target ranges and pushing the risk score upward.";
  const metricPlanets = [
    {
      name: "Sodium",
      value: `${payload?.sodium ?? 0} mg`,
      size: 16,
      orbitSize: 320,
      angle: 18,
      duration: 18,
      color: payload && payload.sodium > 2300 ? "#f97316" : "#f8fafc",
      glow: payload && payload.sodium > 2300 ? "rgba(249,115,22,0.45)" : "rgba(148,163,184,0.35)",
    },
    {
      name: "Vitamin D",
      value: `${payload?.vitaminD ?? 0} mcg`,
      size: 15,
      orbitSize: 440,
      angle: 118,
      duration: 24,
      color: payload && payload.vitaminD < 10 ? "#facc15" : "#a5f3fc",
      glow: payload && payload.vitaminD < 10 ? "rgba(250,204,21,0.42)" : "rgba(34,211,238,0.28)",
    },
    {
      name: "Calcium",
      value: `${payload?.calcium ?? 0} mg`,
      size: 17,
      orbitSize: 560,
      angle: 220,
      duration: 30,
      color: payload && payload.calcium < 1000 ? "#fb7185" : "#c4b5fd",
      glow: payload && payload.calcium < 1000 ? "rgba(251,113,133,0.4)" : "rgba(129,140,248,0.3)",
    },
    {
      name: "Magnesium",
      value: `${payload?.magnesium ?? 0} mg`,
      size: 14,
      orbitSize: 440,
      angle: 300,
      duration: 22,
      color: payload && payload.magnesium < 310 ? "#f59e0b" : "#bfdbfe",
      glow: payload && payload.magnesium < 310 ? "rgba(245,158,11,0.35)" : "rgba(191,219,254,0.25)",
    },
  ];

  const R = 70;
  const CIRC = 2 * Math.PI * R;

  return (
    <div className="relative min-h-screen">
      <div className="starfield" />
      {!assistantOpen && !launchState && (
        <div
          className="fixed z-20"
          style={{
            left: earthPosition.x,
            top: earthPosition.y,
          }}
        >
          <button
            ref={triggerRef}
            onClick={handleAssistantToggle}
            onPointerDown={handleEarthPointerDown}
            onPointerMove={handleEarthPointerMove}
            onPointerUp={handleEarthPointerUp}
            onPointerCancel={handleEarthPointerUp}
            className="group relative inline-flex flex-col items-center"
            aria-label="Open Earth Guide"
            style={{
              cursor: draggingEarth ? "grabbing" : "grab",
            }}
          >
            <div className="relative">
              <div className="absolute inset-[-10px] rounded-full border border-cyan-300/20 pulse-ring" />
              <div className="absolute inset-[-22px] rounded-full border border-cyan-200/10 spin-slow" />
              <div className="planet-float relative">
                <EarthLogo open={false} />
              </div>
            </div>
            <span className="mt-3 rounded-full border border-cyan-300/20 bg-slate-950/70 px-3 py-1 text-[11px] text-cyan-100 shadow-[0_0_25px_rgba(15,23,42,0.6)]">
              {draggingEarth ? "Move Earth Guide" : "Talk to Earth Guide"}
            </span>
          </button>
        </div>
      )}

      {launchState && (
        <div
          className="pointer-events-none fixed z-30"
          style={{
            left: launchState.startX,
            top: launchState.startY,
            transform: launchState.moved
              ? `translate(${launchState.endX - launchState.startX}px, ${launchState.endY - launchState.startY}px) rotate(8deg) scale(1.05)`
              : "translate(0px, 0px) rotate(-24deg) scale(0.76)",
            opacity: launchState.moved ? 0.96 : 0,
            transition: "transform 1.18s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.22s ease-out",
          }}
        >
          <RocketIcon />
        </div>
      )}

      {landingState && (
        <div
          className="pointer-events-none fixed z-30"
          style={{
            left: landingState.x - 34,
            top: landingState.y + 28,
          }}
        >
          <LandingEffect />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push("/log")}
            className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Risk Report</h1>
            <p className="text-slate-500 text-sm">SANS risk estimation {new Date().toLocaleDateString()}</p>
          </div>
          <div className="ml-auto">
            <StepsIndicator step={3} />
          </div>
        </div>

        <section className="relative mb-6 overflow-hidden rounded-[28px] border border-indigo-300/12 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_38%),linear-gradient(180deg,rgba(10,15,35,0.98),rgba(8,12,28,0.94))] px-6 py-8 shadow-[0_24px_80px_rgba(2,6,23,0.42)] slide-up sm:px-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="orbit-drift-slow absolute left-[50%] top-[30%] h-[320px] w-[320px] rounded-full border border-white/6" />
            <div className="orbit-drift-reverse absolute left-[50%] top-[30%] h-[440px] w-[440px] rounded-full border border-white/4" />
            <div className="orbit-drift-slow absolute left-[50%] top-[30%] h-[560px] w-[560px] rounded-full border border-white/[0.03]" />
            <div className="central-glow-pulse absolute left-1/2 top-[30%] h-28 w-28 rounded-full bg-[radial-gradient(circle_at_32%_30%,#f8fafc_0%,#c7d2fe_28%,#4f46e5_62%,#0f172a_100%)] shadow-[0_0_50px_rgba(99,102,241,0.35)]" />
            {metricPlanets.map((planet) => (
              <div
                key={planet.name}
                className="orbit-rotate absolute left-1/2 top-[30%]"
                style={{
                  transform: "translate(-50%, -50%)",
                  width: `${planet.orbitSize}px`,
                  height: `${planet.orbitSize}px`,
                  ["--orbit-duration" as string]: `${planet.duration}s`,
                  animationDelay: `-${planet.duration * (planet.angle / 360)}s`,
                }}
              >
                <div
                  className="planet-orbit-float rounded-full"
                  style={{
                    width: `${planet.size}px`,
                    height: `${planet.size}px`,
                    position: "absolute",
                    left: "50%",
                    top: 0,
                    marginLeft: `${planet.size / -2}px`,
                    marginTop: `${planet.size / -2}px`,
                    background: planet.color,
                    boxShadow: `0 0 18px ${planet.glow}`,
                    animationDelay: `${metricPlanets.indexOf(planet) * 0.8}s`,
                  }}
                />
              </div>
            ))}
          </div>

          <div className="relative z-10">
            <div>
              <div className="inline-flex rounded-full border border-indigo-300/15 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-100">
                Orbital Summary
              </div>
              <h2 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                SANS risk overview with key health signals
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                Your current nutrition and scan inputs are mapped into a solar-system view first, with detialed review below.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {metricPlanets.map((planet) => (
                  <div key={planet.name} className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-indigo-100/75">{planet.name}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{planet.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => formalSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="rounded-2xl bg-[linear-gradient(135deg,#1e3a8a,#4f46e5)] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(79,70,229,0.35)] transition-transform hover:scale-[1.02]"
                >
                  Open Formal Brief
                </button>
                <button
                  onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
                  className="rounded-2xl border border-indigo-300/15 bg-slate-950/45 px-5 py-3 text-sm font-semibold text-indigo-100 transition-colors hover:border-indigo-300/30 hover:text-white"
                >
                  Jump to Moon Guide
                </button>
              </div>

              <div className="mt-8 rounded-[28px] border border-white/8 bg-slate-950/55 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-100/75">Dual Model Results</p>
                  <span className="rounded-full border border-indigo-300/10 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-100/75">
                    Retinal + Biometric
                  </span>
                </div>

                <div className="mt-5 flex flex-col gap-6">
                  <div
                    className="rounded-[26px] border p-5"
                    style={{
                      borderColor: retinal.tone.border,
                      background: retinal.tone.panel,
                      boxShadow: `0 0 28px ${retinal.tone.glow}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300/85">
                          Retinal Scan Detection
                        </p>
                        <h3 className="mt-3 text-2xl font-semibold text-white">
                          {retinal.detected ? "⚠️ SANS Detected" : "✅ No SANS Detected"}
                        </h3>
                      </div>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                        style={{
                          color: retinal.tone.accent,
                          background: retinal.tone.badge,
                          border: `1px solid ${retinal.tone.border}`,
                        }}
                      >
                        {retinal.detected ? "Detection Active" : "Clear Scan"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <ScanMetric
                        label="Scan Status"
                        value={payload?.hasScan ? "Scan uploaded" : "No scan uploaded"}
                        accent={retinal.tone.accent}
                      />
                      <ScanMetric
                        label="Stage"
                        value={retinal.stage ?? "Not applicable"}
                        accent={retinal.tone.accent}
                      />
                    </div>

                    <p className="mt-5 text-sm leading-6 text-slate-300">{retinal.summary}</p>
                  </div>

                  <div className="rounded-[26px] border border-indigo-300/10 bg-slate-900/50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-100/78">
                      Biometric Risk Score
                    </p>
                    <div className="mt-5 grid gap-5 xl:grid-cols-[168px_minmax(0,1fr)] xl:items-start">
                      <div className="relative mx-auto h-40 w-40 xl:mx-0">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
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
                          <span className="text-4xl font-bold text-white">{animScore}%</span>
                          <span className="text-sm text-slate-400">Random Forest</span>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-indigo-300/10 bg-slate-950/55 p-3.5 sm:p-4">
                        <div className="mb-3 w-full rounded-2xl border border-indigo-300/12 bg-slate-950/70 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-100/78">
                            Current Status
                          </p>
                          <div className="mt-2.5">
                            <div
                              className="flex w-full justify-center rounded-full px-5 py-1.5 text-sm font-semibold"
                              style={{ background: levelBg, color: levelColor, border: `1px solid ${levelColor}44` }}
                            >
                              {level} Risk
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-[minmax(0,1.45fr)_minmax(200px,0.55fr)]">
                          <BriefPanel
                            label="Model Summary"
                            content={<p className="max-w-2xl text-base leading-8 text-slate-300">{summary}</p>}
                          />
                          <BriefPanel label="Factors Tracked" content={<BriefValue value={`${factors.length}`} />} />
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <BriefPanel label="Inputs Used" content={<BriefValue value="4 biometric metrics" />} />
                          <BriefPanel label="Report Mode" content={<BriefValue value="Solar + Formal" />} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section ref={formalSectionRef} className="mb-5 rounded-[28px] border border-indigo-300/12 bg-slate-950/65 p-6 shadow-[0_18px_40px_rgba(2,6,23,0.35)] slide-up sm:p-8" style={{ animationDelay: "0.1s" }}>
          <div className="flex flex-col gap-3 border-b border-indigo-300/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-100/80">Formal Brief</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Structured mission health report</h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-slate-300">
              The section below keeps the same numbers and interpretation, but presents them in a more formal, review-friendly format.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricBriefCard
              title="Retinal Detection"
              value={retinal.detected ? "SANS Detected" : "No SANS Detected"}
              guidance={retinal.detected ? `Current simulated stage: ${retinal.stage}.` : "No retinal stage is shown when no SANS is detected."}
              status={retinal.detected ? "Retinal positive" : "Retinal clear"}
              accent={retinal.tone.accent}
            />
            <MetricBriefCard
              title="Biometric Risk"
              value={`${result.score.toFixed(0)}%`}
              guidance="Random Forest model using sodium, vitamin D, calcium, and magnesium."
              status={`${level} risk`}
              accent={levelColor}
            />
            <MetricBriefCard
              title="Sodium"
              value={`${payload?.sodium ?? 0} mg`}
              guidance="Max 2300 mg"
              status={(payload?.sodium ?? 0) > 2300 ? "Above target" : "Within target"}
              accent={(payload?.sodium ?? 0) > 2300 ? "#f97316" : "#38bdf8"}
            />
            <MetricBriefCard
              title="Vitamin D"
              value={`${payload?.vitaminD ?? 0} mcg`}
              guidance="Deficient below 10 mcg"
              status={(payload?.vitaminD ?? 0) < 10 ? "Needs attention" : "Above threshold"}
              accent={(payload?.vitaminD ?? 0) < 10 ? "#facc15" : "#a5f3fc"}
            />
            <MetricBriefCard
              title="Calcium"
              value={`${payload?.calcium ?? 0} mg`}
              guidance="Minimum 1000 mg"
              status={(payload?.calcium ?? 0) < 1000 ? "Below target" : "Meets target"}
              accent={(payload?.calcium ?? 0) < 1000 ? "#fb7185" : "#c4b5fd"}
            />
            <MetricBriefCard
              title="Magnesium"
              value={`${payload?.magnesium ?? 0} mg`}
              guidance="Minimum 310 mg"
              status={(payload?.magnesium ?? 0) < 310 ? "Below target" : "Meets target"}
              accent={(payload?.magnesium ?? 0) < 310 ? "#f59e0b" : "#bfdbfe"}
            />
          </div>
        </section>

        <div className="glass-card p-6 mb-5 slide-up" style={{ animationDelay: "0.14s" }}>
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span>📊</span> Key Drivers
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

        <div className="mb-5 slide-up" style={{ animationDelay: "0.25s" }}>
          <div
            ref={panelAnchorRef}
            className={`mb-3 rounded-3xl border border-dashed px-4 py-5 text-sm transition-all ${
              launchState
                ? "border-cyan-300/30 bg-cyan-400/5 text-cyan-100"
                : "border-transparent bg-transparent text-transparent"
            }`}
          >
            {launchState ? "Earth Guide is docking..." : "."}
          </div>
          {assistantOpen && (
            <div className="glass-card p-6 mt-3 panel-bloom">
              <div className="mb-4 flex items-center gap-3">
                <div className="shrink-0">
                  <MoonLogo compact />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-white">Moon Guide</p>
                    <button
                      onClick={handleAssistantToggle}
                      className="rounded-full border border-slate-700/60 px-2.5 py-1 text-[11px] text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
                    >
                      Hide
                    </button>
                  </div>
                  <p className="text-sm text-slate-400">
                    Earth launches you here, and Moon Guide explains this report in plain language.
                  </p>
                </div>
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
          )}
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

function BriefPanel({
  label,
  content,
}: {
  label: string;
  content: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-indigo-300/10 bg-slate-950/55 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-100/78">{label}</p>
      <div className="mt-3">{content}</div>
    </div>
  );
}

function BriefValue({ value }: { value: string }) {
  return <p className="text-lg font-semibold text-white">{value}</p>;
}

function ScanMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

function MetricBriefCard({
  title,
  value,
  guidance,
  status,
  accent,
}: {
  title: string;
  value: string;
  guidance: string;
  status: string;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-indigo-300/10 bg-slate-900/65 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-100/80">{title}</p>
        <span
          className="rounded-full px-3 py-1 text-xs font-medium"
          style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}33` }}
        >
          {status}
        </span>
      </div>
      <p className="text-3xl font-semibold text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{guidance}</p>
    </div>
  );
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

function EarthLogo({ open, compact = false }: { open: boolean; compact?: boolean }) {
  const size = compact ? 42 : 92;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      style={{
        filter: open ? "drop-shadow(0 0 20px rgba(56,189,248,0.35))" : "drop-shadow(0 0 14px rgba(34,197,94,0.16))",
      }}
    >
      <circle cx="60" cy="60" r="50" fill="url(#earthOcean)" />
      <path
        d="M29 41c6-9 17-15 28-14 2 8 6 12 14 13 7 2 11 7 13 13-6 2-12 1-17 6-5 4-7 10-13 13-7 4-15 3-22 1-4-10-6-21-3-32Z"
        fill="url(#earthLand)"
        opacity="0.96"
      />
      <path
        d="M76 28c8 2 15 8 19 16-1 6-6 8-11 10-4 2-8 6-8 11 0 5 2 10 5 14-5 6-10 9-18 12-4-5-4-11-1-17 2-6 0-10-4-15-4-4-7-9-5-16 7-10 13-15 23-15Z"
        fill="#4ade80"
        opacity="0.88"
      />
      <ellipse cx="47" cy="39" rx="31" ry="14" fill="rgba(255,255,255,0.12)" />
      <path
        d="M16 69c18 10 52 14 88 3"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="60" cy="60" r="50" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="1.5" />
      <defs>
        <radialGradient id="earthOcean" cx="0" cy="0" r="1" gradientTransform="translate(46 36) rotate(56) scale(78)">
          <stop stopColor="#7dd3fc" />
          <stop offset="0.45" stopColor="#2563eb" />
          <stop offset="1" stopColor="#0f172a" />
        </radialGradient>
        <linearGradient id="earthLand" x1="24" y1="29" x2="82" y2="82" gradientUnits="userSpaceOnUse">
          <stop stopColor="#bbf7d0" />
          <stop offset="0.45" stopColor="#34d399" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MoonLogo({ compact = false }: { compact?: boolean }) {
  const size = compact ? 42 : 92;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      style={{
        filter: "drop-shadow(0 0 18px rgba(226,232,240,0.18))",
      }}
    >
      <circle cx="60" cy="60" r="44" fill="url(#moonBody)" />
      <path
        d="M78 22c-11 6-19 18-19 32 0 15 8 27 19 33-6 4-13 6-21 6-20 0-37-17-37-38s17-38 37-38c8 0 15 2 21 5Z"
        fill="#0f172a"
        opacity="0.28"
      />
      <circle cx="45" cy="46" r="7" fill="#cbd5e1" opacity="0.55" />
      <circle cx="66" cy="70" r="9" fill="#cbd5e1" opacity="0.5" />
      <circle cx="74" cy="44" r="4.5" fill="#e2e8f0" opacity="0.65" />
      <circle cx="51" cy="73" r="5.5" fill="#94a3b8" opacity="0.45" />
      <defs>
        <radialGradient id="moonBody" cx="0" cy="0" r="1" gradientTransform="translate(46 36) rotate(55) scale(68)">
          <stop stopColor="#f8fafc" />
          <stop offset="0.45" stopColor="#cbd5e1" />
          <stop offset="1" stopColor="#64748b" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg width="102" height="102" viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <g className="rocket-shake" transform="rotate(-18 48 48)">
        <ellipse className="exhaust-trail" cx="49" cy="82" rx="10" ry="12" fill="rgba(56,189,248,0.2)" />
        <ellipse className="exhaust-trail" cx="49" cy="79" rx="7" ry="10" fill="rgba(251,146,60,0.24)" />
        <path d="M52 10c12 9 19 24 18 40-8 4-18 5-28 3-4-10-4-20-1-29 2-6 5-10 11-14Z" fill="#f8fafc" />
        <path d="M59 18c7 7 11 17 11 29-6 3-12 4-19 3-1-10 1-20 8-32Z" fill="#94a3b8" />
        <circle cx="54" cy="31" r="6" fill="#67e8f9" />
        <circle cx="54" cy="31" r="3.5" fill="#0f172a" opacity="0.55" />
        <path d="M38 45 24 57l8-17 6 5Z" fill="#818cf8" />
        <path d="M60 47 75 58l-8-18-7 7Z" fill="#818cf8" />
        <path d="M44 57c-2 8 0 14 5 21 5-7 7-13 5-21-4 2-7 2-10 0Z" fill="#e2e8f0" />
        <path className="rocket-flame" d="M49 80c-5 0-10 7-10 13 6-1 10-4 10-8 0 4 4 7 10 8 0-6-5-13-10-13Z" fill="#fb923c" />
        <path className="rocket-flame" d="M49 82c-3 0-6 5-6 9 3-1 6-3 6-6 0 3 3 5 6 6 0-4-3-9-6-9Z" fill="#fde68a" />
        <path className="rocket-flame" d="M49 84c-2 0-4 3-4 6 2-1 4-2 4-4 0 2 2 3 4 4 0-3-2-6-4-6Z" fill="#fff7ed" />
      </g>
    </svg>
  );
}

function LandingEffect() {
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden="true">
      <ellipse className="landing-dust" cx="44" cy="62" rx="28" ry="10" fill="rgba(148,163,184,0.18)" />
      <ellipse className="landing-dust" cx="44" cy="62" rx="20" ry="7" fill="rgba(226,232,240,0.16)" />
      <path className="landing-burn" d="M44 20c-6 8-10 18-10 28 4-1 7-4 10-9 3 5 6 8 10 9 0-10-4-20-10-28Z" fill="#fb923c" />
      <path className="landing-burn" d="M44 26c-4 6-6 12-6 19 2-1 4-3 6-6 2 3 4 5 6 6 0-7-2-13-6-19Z" fill="#fde68a" />
      <path className="landing-burn" d="M44 31c-2 4-3 8-3 12 1-1 2-2 3-4 1 2 2 3 3 4 0-4-1-8-3-12Z" fill="#fff7ed" />
    </svg>
  );
}
