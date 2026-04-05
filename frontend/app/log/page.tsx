"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function LogPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [sodium, setSodium] = useState("");
  const [vitaminD, setVitaminD] = useState("");
  const [calcium, setCalcium] = useState("");
  const [magnesium, setMagnesium] = useState("");
  const [scanFile, setScanFile] = useState<string | null>(null);
  const [scanName, setScanName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanName(file.name);
    const reader = new FileReader();
    reader.onload = () => setScanFile(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (!sodium || !vitaminD || !calcium || !magnesium) return;
    setSubmitting(true);
    const payload = {
      sodium: Number(sodium),
      vitaminD: Number(vitaminD),
      calcium: Number(calcium),
      magnesium: Number(magnesium),
      hasScan: !!scanFile,
    };
    localStorage.setItem("sans_payload", JSON.stringify(payload));
    setTimeout(() => router.push("/report"), 1200);
  }

  const canSubmit = !!sodium && !!vitaminD && !!calcium && !!magnesium && !submitting;

  return (
    <div className="relative min-h-screen">
      <div className="starfield" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start gap-4">
          <button
            onClick={() => router.push("/")}
            className="mt-1 rounded-xl border border-indigo-400/20 bg-slate-950/70 p-3 text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeftIcon />
          </button>
          <div className="flex-1">
            <div className="mb-4 inline-flex rounded-full border border-indigo-300/15 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-100">
              Health Intake
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Log Health Data
                </h1>
                <p className="mt-3 text-base leading-7 text-slate-300 sm:text-lg">
                  Enter your current nutrition and scan information so SANSight can generate a clearer, easier-to-read
                  risk report.
                </p>
              </div>
              <div className="rounded-2xl border border-indigo-300/12 bg-slate-950/55 px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-indigo-100/80">Progress</p>
                <div className="mt-3">
                  <StepsIndicator step={2} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 slide-up">
          <section className="glass-card overflow-hidden">
            <div className="border-b border-indigo-300/10 bg-slate-950/35 px-6 py-5 sm:px-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-100/80">Core Metrics</p>
              <p className="mt-2 text-base text-slate-300">
                Add the four required values below. Larger labels and guidance make it easier to review before you
                submit.
              </p>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
              <MetricCard
                emoji="🧂"
                label="Sodium Intake"
                unit="mg"
                hint="Recommended daily maximum: 2300 mg"
                value={sodium}
                onChange={setSodium}
                placeholder="e.g. 1800"
              />
              <MetricCard
                emoji="☀️"
                label="Vitamin D"
                unit="mcg"
                hint="Below 10 mcg may indicate deficiency"
                value={vitaminD}
                onChange={setVitaminD}
                placeholder="e.g. 15"
              />
              <MetricCard
                emoji="🦴"
                label="Calcium"
                unit="mg"
                hint="Recommended daily minimum: 1000 mg"
                value={calcium}
                onChange={setCalcium}
                placeholder="e.g. 1000"
              />
              <MetricCard
                emoji="⚡"
                label="Magnesium"
                unit="mg"
                hint="Recommended daily minimum: 310 mg"
                value={magnesium}
                onChange={setMagnesium}
                placeholder="e.g. 320"
              />
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="glass-card p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-2xl">👁️</span>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Retinal Scan</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Upload an OCT or retinal image if available. This is optional, but it gives the report more context.
                  </p>
                </div>
                <span className="ml-auto rounded-full border border-indigo-300/15 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-100">
                  Optional
                </span>
              </div>

              {scanFile ? (
                <div className="relative overflow-hidden rounded-2xl border border-indigo-300/15">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={scanFile} alt="Retinal scan" className="h-52 w-full object-cover" />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent p-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-100/70">Uploaded Scan</p>
                      <span className="mt-1 block text-base font-medium text-white">{scanName}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setScanFile(null);
                      setScanName("");
                    }}
                    className="absolute right-3 top-3 rounded-xl border border-white/15 bg-slate-950/70 p-2 text-white transition-colors hover:bg-slate-900"
                  >
                    <XIcon />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-indigo-300/18 bg-slate-950/35 px-6 py-12 text-slate-300 transition-all hover:border-indigo-400/40 hover:bg-indigo-500/6 hover:text-white"
                >
                  <UploadIcon />
                  <span className="text-lg font-semibold text-white">Upload retinal scan</span>
                  <span className="max-w-sm text-center text-sm leading-6 text-slate-400">
                    PNG, JPG, or similar image formats work best for this prototype upload flow.
                  </span>
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

            <aside className="glass-card p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-100/80">Review Before Submit</p>
              <div className="mt-5 space-y-4">
                <ReviewRow label="Sodium" value={sodium} unit="mg" />
                <ReviewRow label="Vitamin D" value={vitaminD} unit="mcg" />
                <ReviewRow label="Calcium" value={calcium} unit="mg" />
                <ReviewRow label="Magnesium" value={magnesium} unit="mg" />
                <ReviewRow label="Retinal Scan" value={scanFile ? "Attached" : "Not uploaded"} />
              </div>

              <div className="mt-6 rounded-2xl border border-indigo-300/10 bg-slate-950/45 px-4 py-4">
                <p className="text-sm font-medium text-white">Why this matters</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  These metrics feed the report summary, recommendations, and the Moon Guide assistant that explains
                  your results.
                </p>
              </div>
            </aside>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-2xl py-5 text-lg font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              background: canSubmit
                ? "linear-gradient(135deg, #1e3a8a, #4f46e5)"
                : "rgba(79,70,229,0.3)",
              boxShadow: canSubmit ? "0 0 24px rgba(79,70,229,0.4)" : "none",
            }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Building Your Report...
              </span>
            ) : (
              "Generate Risk Report"
            )}
          </button>
          {!(sodium && vitaminD && calcium && magnesium) && (
            <p className="text-center text-sm text-indigo-100/70">
              Complete all four health metrics before generating the report.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

type MetricCardProps = {
  emoji: string;
  label: string;
  unit: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

function MetricCard({ emoji, label, unit, hint, value, onChange, placeholder }: MetricCardProps) {
  return (
    <div className="rounded-3xl border border-indigo-300/12 bg-slate-950/45 p-6 shadow-[0_12px_30px_rgba(2,6,23,0.16)]">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/12 text-2xl">{emoji}</span>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">{label}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">{hint}</p>
        </div>
        <span className="ml-auto rounded-full border border-indigo-300/12 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-100">
          {unit}
        </span>
      </div>
      <input
        type="number"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-indigo-300/12 bg-slate-900/70 px-5 py-4 text-xl font-medium text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/25 transition-all"
      />
      <p className="mt-3 text-sm leading-6 text-slate-300">{hint}</p>
    </div>
  );
}

function ReviewRow({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-indigo-300/10 bg-slate-950/45 px-4 py-4">
      <span className="text-base font-medium text-white">{label}</span>
      <span className="text-base text-slate-300">
        {value ? `${value}${unit ? ` ${unit}` : ""}` : "Pending"}
      </span>
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
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
