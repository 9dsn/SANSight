"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type ExerciseLog = {
  id: string;
  type: string;
  duration: number;
  intensity: number;
};

type IntakePayload = {
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

const EXERCISE_TYPES = ["Resistance", "Cardio", "Mixed", "Yoga / Flexibility", "Mobility"];

const FALLBACK_LOGS: ExerciseLog[] = [
  { id: "p1", type: "Resistance", duration: 45, intensity: 7 },
  { id: "p2", type: "Cardio", duration: 30, intensity: 5 },
];

export default function LogPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [sodium, setSodium] = useState("");
  const [calcium, setCalcium] = useState("");
  const [magnesium, setMagnesium] = useState("");
  const [vitaminD, setVitaminD] = useState("");
  const [visionChange, setVisionChange] = useState(3);
  const [blurredVision, setBlurredVision] = useState(false);
  const [headachePressure, setHeadachePressure] = useState(false);
  const [eyeStrain, setEyeStrain] = useState(false);
  const [scanFile, setScanFile] = useState<string | null>(null);
  const [scanName, setScanName] = useState("");
  const [exType, setExType] = useState("Resistance");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState(5);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [savedExercises, setSavedExercises] = useState<ExerciseLog[]>(FALLBACK_LOGS);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"health" | "exercise">("health");

  useEffect(() => {
    const stored = localStorage.getItem("sans_saved_exercises");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as ExerciseLog[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSavedExercises(parsed);
      }
    } catch {
      // Ignore malformed demo data and keep fallback workouts.
    }
  }, []);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setScanName(file.name);
    const reader = new FileReader();
    reader.onload = () => setScanFile(reader.result as string);
    reader.readAsDataURL(file);
  }

  function addExercise() {
    if (!duration || Number(duration) <= 0) return;

    const newLog = {
      id: Date.now().toString(),
      type: exType,
      duration: Number(duration),
      intensity,
    };

    setLogs((prev) => [...prev, newLog]);

    setSavedExercises((prev) => {
      const duplicate = prev.some(
        (item) => item.type === newLog.type && item.duration === newLog.duration && item.intensity === newLog.intensity,
      );
      const next = duplicate ? prev : [newLog, ...prev].slice(0, 6);
      localStorage.setItem("sans_saved_exercises", JSON.stringify(next));
      return next;
    });

    setDuration("");
    setIntensity(5);
  }

  function removeLog(id: string) {
    setLogs((prev) => prev.filter((log) => log.id !== id));
  }

  function reusePast(log: ExerciseLog) {
    setExType(log.type);
    setDuration(String(log.duration));
    setIntensity(log.intensity);
    setTab("exercise");
  }

  function handleSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    const payload: IntakePayload = {
      sodium: Number(sodium),
      calcium: Number(calcium),
      magnesium: Number(magnesium),
      vitaminD: Number(vitaminD),
      visionChange,
      blurredVision,
      headachePressure,
      eyeStrain,
      hasScan: Boolean(scanFile),
      exercises: logs,
    };

    localStorage.setItem("sans_payload", JSON.stringify(payload));
    setTimeout(() => router.push("/report"), 900);
  }

  const requiredFieldsFilled = [sodium, calcium, magnesium, vitaminD].every(Boolean);
  const canSubmit = requiredFieldsFilled && !submitting;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="starfield" />
      <div className="orb orb-left" />
      <div className="orb orb-right" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <button onClick={() => router.push("/")} className="icon-button">
            <ArrowLeftIcon />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">Astronaut Intake</h1>
            <p className="text-sm text-slate-400">
              Capture the signals your SANS screening model needs before generating a risk estimate.
            </p>
          </div>
          <div className="ml-auto hidden sm:block">
            <StepsIndicator step={2} />
          </div>
        </div>

        <div className="mb-6 flex gap-2 rounded-2xl border border-white/8 bg-slate-950/55 p-1">
          {(["health", "exercise"] as const).map((section) => (
            <button
              key={section}
              onClick={() => setTab(section)}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                tab === section ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              {section === "health" ? "Health Metrics" : "Exercise Log"}
            </button>
          ))}
        </div>

        {tab === "health" && (
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-5 slide-up">
              <div className="glass-card p-6">
                <p className="eyebrow mb-4">Biometrics</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <MetricInput
                    emoji="🧂"
                    label="Sodium"
                    unit="mmol/L"
                    hint="Typical serum range: 135-145"
                    value={sodium}
                    onChange={setSodium}
                    placeholder="138"
                  />
                  <MetricInput
                    emoji="🦴"
                    label="Calcium"
                    unit="mg/dL"
                    hint="Supports bone health under microgravity stress"
                    value={calcium}
                    onChange={setCalcium}
                    placeholder="9.4"
                  />
                  <MetricInput
                    emoji="⚡"
                    label="Magnesium"
                    unit="mg/dL"
                    hint="Useful for muscle and nerve function"
                    value={magnesium}
                    onChange={setMagnesium}
                    placeholder="2.0"
                  />
                  <MetricInput
                    emoji="☀️"
                    label="Vitamin D"
                    unit="ng/mL"
                    hint="Lower values may elevate bone risk"
                    value={vitaminD}
                    onChange={setVitaminD}
                    placeholder="32"
                  />
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow mb-2">Vision Check</p>
                    <h2 className="text-lg font-semibold text-white">Self-reported eyesight changes</h2>
                  </div>
                  <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200">
                    Daily check
                  </span>
                </div>

                <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">How different does your vision feel today?</label>
                    <span className="rounded-lg px-2.5 py-1 text-sm font-semibold text-cyan-200">
                      {visionChange}/10
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={visionChange}
                    onChange={(event) => setVisionChange(Number(event.target.value))}
                    className="w-full accent-cyan-300"
                  />
                  <div className="mt-2 flex justify-between text-xs text-slate-500">
                    <span>No change</span>
                    <span>Subtle blur</span>
                    <span>Concerning</span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <SymptomToggle label="Blurred vision" checked={blurredVision} onChange={setBlurredVision} />
                  <SymptomToggle label="Head pressure" checked={headachePressure} onChange={setHeadachePressure} />
                  <SymptomToggle label="Eye strain" checked={eyeStrain} onChange={setEyeStrain} />
                </div>
              </div>
            </section>

            <section className="space-y-5 slide-up" style={{ animationDelay: "0.08s" }}>
              <div className="glass-card p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow mb-2">Retina Scan</p>
                    <h2 className="text-lg font-semibold text-white">Upload OCT or retinal imagery</h2>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Optional for demo</span>
                </div>

                {scanFile ? (
                  <div className="relative overflow-hidden rounded-3xl border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={scanFile} alt="Retinal scan preview" className="h-60 w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 to-transparent p-4">
                      <p className="text-sm font-medium text-white">{scanName}</p>
                      <p className="mt-1 text-xs text-slate-400">Image attached for future ML-based retinal analysis.</p>
                    </div>
                    <button
                      onClick={() => {
                        setScanFile(null);
                        setScanName("");
                      }}
                      className="icon-button absolute right-3 top-3"
                    >
                      <XIcon />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} className="upload-panel">
                    <UploadIcon />
                    <span className="text-base font-medium text-white">Upload scan file</span>
                    <span className="text-sm text-slate-400">PNG, JPG, or DICOM preview for the prototype</span>
                  </button>
                )}

                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              <div className="glass-card p-6">
                <p className="eyebrow mb-4">Model Notes</p>
                <div className="space-y-3 text-sm leading-6 text-slate-300">
                  <p>This intake is tuned for screening signals associated with SANS rather than making a diagnosis.</p>
                  <p>
                    In a full version, tabular health data would pair with a retinal-image model and wearable inputs to
                    monitor trend changes over time.
                  </p>
                </div>
              </div>

              <button onClick={() => setTab("exercise")} className="primary-button w-full justify-center">
                Continue to exercise logging
              </button>
            </section>
          </div>
        )}

        {tab === "exercise" && (
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <section className="space-y-5 slide-up">
              <div className="glass-card p-6">
                <p className="eyebrow mb-4">Workout Memory</p>
                <div className="space-y-3">
                  {savedExercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => reusePast(exercise)}
                      className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition-all hover:border-cyan-300/35"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {typeEmoji(exercise.type)} {exercise.type}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {exercise.duration} min · intensity {exercise.intensity}/10
                        </p>
                      </div>
                      <span className="text-xs text-cyan-200">Reuse</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6">
                <p className="eyebrow mb-3">Why Exercise Matters</p>
                <p className="text-sm leading-6 text-slate-300">
                  Structured resistance and cardio support muscle retention and fluid regulation. Missing exercise logs
                  should increase screening caution in the risk report.
                </p>
              </div>
            </section>

            <section className="space-y-5 slide-up" style={{ animationDelay: "0.08s" }}>
              <div className="glass-card p-6">
                <p className="eyebrow mb-4">Log Today&apos;s Exercise</p>

                <div className="grid gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Exercise type</label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {EXERCISE_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => setExType(type)}
                          className={`rounded-2xl border px-3 py-3 text-sm font-medium transition-all ${
                            exType === type
                              ? "border-cyan-300 bg-cyan-300 text-slate-950"
                              : "border-white/8 bg-white/[0.03] text-slate-300 hover:border-white/16"
                          }`}
                        >
                          {typeEmoji(type)} {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Duration (minutes)</label>
                      <input
                        type="number"
                        placeholder="45"
                        value={duration}
                        onChange={(event) => setDuration(event.target.value)}
                        className="field-input"
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-300">Intensity</label>
                        <span
                          className="rounded-lg px-2.5 py-1 text-sm font-semibold"
                          style={{ background: `${intensityColor(intensity)}26`, color: intensityColor(intensity) }}
                        >
                          {intensity}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={intensity}
                        onChange={(event) => setIntensity(Number(event.target.value))}
                        className="w-full accent-cyan-300"
                      />
                    </div>
                  </div>

                  <button onClick={addExercise} disabled={!duration} className="secondary-button justify-center disabled:opacity-45">
                    Add exercise to today&apos;s log
                  </button>
                </div>
              </div>

              {logs.length > 0 && (
                <div className="glass-card p-6">
                  <p className="eyebrow mb-4">Today&apos;s Exercise Data</p>
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">
                            {typeEmoji(log.type)} {log.type}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {log.duration} min · intensity {log.intensity}/10
                          </p>
                        </div>
                        <button onClick={() => removeLog(log.id)} className="icon-button">
                          <XIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleSubmit} disabled={!canSubmit} className="primary-button w-full justify-center disabled:opacity-45">
                {submitting ? "Generating risk report..." : "Analyze SANS risk"}
              </button>

              {!requiredFieldsFilled && (
                <p className="text-center text-xs text-amber-300/80">
                  Sodium, calcium, magnesium, and vitamin D are required before analysis.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricInput({
  emoji,
  label,
  unit,
  hint,
  value,
  onChange,
  placeholder,
}: {
  emoji: string;
  label: string;
  unit: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span>{emoji}</span>
        <p className="text-sm font-semibold text-white">{label}</p>
        <span className="ml-auto text-xs text-slate-500">{unit}</span>
      </div>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="field-input"
      />
      <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>
    </div>
  );
}

function SymptomToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`rounded-2xl border px-4 py-4 text-left transition-all ${
        checked ? "border-cyan-300 bg-cyan-300/10" : "border-white/8 bg-white/[0.03]"
      }`}
    >
      <p className="text-sm font-medium text-white">{label}</p>
      <p className="mt-1 text-xs text-slate-400">{checked ? "Reported today" : "Not reported"}</p>
    </button>
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

function typeEmoji(type: string) {
  const map: Record<string, string> = {
    Resistance: "🏋️",
    Cardio: "🏃",
    Mixed: "🛰️",
    "Yoga / Flexibility": "🧘",
    Mobility: "🤸",
  };
  return map[type] ?? "💪";
}

function intensityColor(value: number) {
  if (value <= 3) return "#7dd3fc";
  if (value <= 6) return "#fbbf24";
  if (value <= 8) return "#fb923c";
  return "#f87171";
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
