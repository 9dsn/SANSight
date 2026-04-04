"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

type ExerciseLog = {
  id: string;
  type: string;
  duration: number;
  intensity: number;
};

const EXERCISE_TYPES = ["Resistance", "Cardio", "Mixed", "Yoga / Flexibility", "HIIT"];

const PAST_LOGS: ExerciseLog[] = [
  { id: "p1", type: "Resistance", duration: 45, intensity: 7 },
  { id: "p2", type: "Cardio",     duration: 30, intensity: 5 },
];

export default function LogPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [sodium, setSodium]         = useState("");
  const [scanFile, setScanFile]     = useState<string | null>(null);
  const [scanName, setScanName]     = useState("");
  const [exType, setExType]         = useState("Resistance");
  const [duration, setDuration]     = useState("");
  const [intensity, setIntensity]   = useState(5);
  const [logs, setLogs]             = useState<ExerciseLog[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab]               = useState<"health" | "exercise">("health");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanName(file.name);
    const reader = new FileReader();
    reader.onload = () => setScanFile(reader.result as string);
    reader.readAsDataURL(file);
  }

  function addExercise() {
    if (!duration || Number(duration) <= 0) return;
    setLogs((prev) => [
      ...prev,
      { id: Date.now().toString(), type: exType, duration: Number(duration), intensity },
    ]);
    setDuration("");
    setIntensity(5);
  }

  function removeLog(id: string) {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  function reusePast(log: ExerciseLog) {
    setExType(log.type);
    setDuration(String(log.duration));
    setIntensity(log.intensity);
    setTab("exercise");
  }

  function handleSubmit() {
    if (!sodium) return;
    setSubmitting(true);
    const payload = { sodium: Number(sodium), hasScan: !!scanFile, exercises: logs };
    localStorage.setItem("sans_payload", JSON.stringify(payload));
    setTimeout(() => router.push("/report"), 1200);
  }

  const canSubmit = !!sodium && !submitting;

  return (
    <div className="relative min-h-screen">
      <div className="starfield" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Log Health Data</h1>
            <p className="text-slate-500 text-sm">Enter today&apos;s metrics for risk analysis</p>
          </div>
          <div className="ml-auto">
            <StepsIndicator step={2} />
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6 p-1 bg-slate-800/50 rounded-xl border border-slate-700/40">
          {(["health", "exercise"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t === "health" ? "🩺 Health Metrics" : "🏃 Exercise"}
            </button>
          ))}
        </div>

        {/* Health tab */}
        {tab === "health" && (
          <div className="space-y-5 slide-up">
            {/* Sodium */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🧂</span>
                <h2 className="font-semibold text-white">Sodium Level</h2>
                <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">mmol/L</span>
              </div>
              <input
                type="number"
                placeholder="e.g. 138"
                value={sodium}
                onChange={(e) => setSodium(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all text-lg"
              />
              <p className="text-slate-500 text-xs mt-2">Normal range: 135–145 mmol/L</p>
            </div>

            {/* Retinal Scan */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">👁️</span>
                <h2 className="font-semibold text-white">Retinal Scan</h2>
                <span className="ml-auto text-xs text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded-full">Optional</span>
              </div>

              {scanFile ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-600/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={scanFile} alt="Retinal scan" className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                    <span className="text-white text-sm truncate">{scanName}</span>
                  </div>
                  <button
                    onClick={() => { setScanFile(null); setScanName(""); }}
                    className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg p-1.5 transition-colors"
                  >
                    <XIcon />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-slate-600/60 rounded-xl text-slate-400 hover:border-indigo-500/60 hover:text-indigo-400 transition-all flex flex-col items-center gap-2"
                >
                  <UploadIcon />
                  <span className="text-sm">Upload OCT / retinal image</span>
                  <span className="text-xs text-slate-600">PNG, JPG, DICOM</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <button
              onClick={() => setTab("exercise")}
              className="w-full py-3 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 transition-all text-sm font-medium"
            >
              Continue to Exercise Logging →
            </button>
          </div>
        )}

        {/* Exercise tab */}
        {tab === "exercise" && (
          <div className="space-y-5 slide-up">
            {/* Past workouts quick-add */}
            {PAST_LOGS.length > 0 && (
              <div className="glass-card p-5">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
                  Quick Add — Previous Workouts
                </p>
                <div className="flex gap-2 flex-wrap">
                  {PAST_LOGS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => reusePast(l)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/70 border border-slate-700/50 hover:border-indigo-500/50 text-slate-300 text-sm transition-all"
                    >
                      <span>{typeEmoji(l.type)}</span>
                      <span>{l.type}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">{l.duration}min</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Log new exercise */}
            <div className="glass-card p-6 space-y-5">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <span>🏋️</span> Log Exercise
              </h2>

              {/* Type */}
              <div>
                <label className="text-slate-400 text-sm font-medium mb-2 block">Exercise Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {EXERCISE_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setExType(t)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all border ${
                        exType === t
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      {typeEmoji(t)} {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-slate-400 text-sm font-medium mb-1.5 block">Duration (minutes)</label>
                <input
                  type="number"
                  placeholder="e.g. 45"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                />
              </div>

              {/* Intensity slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-slate-400 text-sm font-medium">Intensity</label>
                  <span
                    className="text-sm font-bold px-2.5 py-0.5 rounded-lg"
                    style={{ background: intensityColor(intensity) + "33", color: intensityColor(intensity) }}
                  >
                    {intensity} / 10 — {intensityLabel(intensity)}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-slate-600 text-xs mt-1">
                  <span>Easy</span><span>Moderate</span><span>Max</span>
                </div>
              </div>

              <button
                onClick={addExercise}
                disabled={!duration}
                className="w-full py-3 rounded-xl bg-teal-600/20 border border-teal-500/30 text-teal-300 hover:bg-teal-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium"
              >
                + Add to Today&apos;s Log
              </button>
            </div>

            {/* Logged exercises list */}
            {logs.length > 0 && (
              <div className="glass-card p-5 space-y-2">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Today&apos;s Log</p>
                {logs.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{typeEmoji(l.type)}</span>
                      <div>
                        <p className="text-white text-sm font-medium">{l.type}</p>
                        <p className="text-slate-500 text-xs">{l.duration} min · intensity {l.intensity}/10</p>
                      </div>
                    </div>
                    <button onClick={() => removeLog(l.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <XIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Analyze button */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: canSubmit
                  ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                  : "rgba(79,70,229,0.3)",
                boxShadow: canSubmit ? "0 0 24px rgba(79,70,229,0.4)" : "none",
              }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Analyzing…
                </span>
              ) : (
                "Analyze Risk →"
              )}
            </button>
            {!sodium && (
              <p className="text-center text-amber-500/70 text-xs">⚠ Sodium level is required before analysis</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StepsIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className="w-2 h-2 rounded-full transition-all"
          style={{
            background: s < step ? "#6366f1" : s === step ? "#818cf8" : "#334155",
            width: s === step ? "20px" : "8px",
          }}
        />
      ))}
    </div>
  );
}

function typeEmoji(type: string) {
  const map: Record<string, string> = {
    Resistance: "🏋️",
    Cardio: "🏃",
    Mixed: "⚡",
    "Yoga / Flexibility": "🧘",
    HIIT: "🔥",
  };
  return map[type] ?? "💪";
}

function intensityLabel(v: number) {
  if (v <= 3) return "Light";
  if (v <= 6) return "Moderate";
  if (v <= 8) return "Hard";
  return "Max";
}

function intensityColor(v: number) {
  if (v <= 3) return "#22c55e";
  if (v <= 6) return "#f59e0b";
  if (v <= 8) return "#f97316";
  return "#ef4444";
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
