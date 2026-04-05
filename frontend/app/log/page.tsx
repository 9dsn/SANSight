"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function LogPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [sodium, setSodium] = useState("");
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
    if (!sodium) return;
    setSubmitting(true);
    const payload = { sodium: Number(sodium), hasScan: !!scanFile };
    localStorage.setItem("sans_payload", JSON.stringify(payload));
    setTimeout(() => router.push("/report"), 1200);
  }

  const canSubmit = !!sodium && !submitting;

  return (
    <div className="relative min-h-screen">
      <div className="starfield" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
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

        <div className="space-y-5 slide-up">
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
            <p className="text-slate-500 text-xs mt-2">Normal range: 135-145 mmol/L</p>
          </div>

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
                  onClick={() => {
                    setScanFile(null);
                    setScanName("");
                  }}
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
                Analyzing...
              </span>
            ) : (
              "Analyze Risk →"
            )}
          </button>
          {!sodium && (
            <p className="text-center text-amber-500/70 text-xs">Sodium level is required before analysis</p>
          )}
        </div>
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
