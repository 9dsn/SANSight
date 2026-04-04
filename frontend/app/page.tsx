"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  const handleDirectLogin = () => {
    setVerified(true);
    setTimeout(() => router.push("/log"), 800);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <div className="starfield" />

      <div className="relative z-10 w-full max-w-md slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mb-5 glow">
            <EyeIcon />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">SANSight</h1>
          <p className="text-slate-400 mt-2 text-center text-sm leading-relaxed max-w-xs">
            AI-powered early detection for Spaceflight-Associated Neuro-ocular Syndrome
          </p>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-lg font-semibold text-white mb-1">Sign in to continue</h2>
          <p className="text-slate-400 text-sm mb-6">
            Authenticate with World ID to access your health dashboard.
          </p>

          <button
            onClick={handleDirectLogin}
            disabled={verified}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-70"
            style={{
              background: verified
                ? "linear-gradient(135deg, #16a34a, #15803d)"
                : "linear-gradient(135deg, #4f46e5, #7c3aed)",
              boxShadow: verified
                ? "0 0 24px rgba(22,163,74,0.35)"
                : "0 0 24px rgba(79,70,229,0.35)",
            }}
          >
            {verified ? (
              <>
                <CheckIcon />
                Verified — redirecting
              </>
            ) : (
              <>
                <WorldIDIcon />
                Sign in with World ID
              </>
            )}
          </button>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-700/60" />
            <span className="text-slate-500 text-xs">Secure · Private · Decentralized</span>
            <div className="h-px flex-1 bg-slate-700/60" />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { icon: "🔐", label: "Zero-knowledge proof" },
              { icon: "🌐", label: "World ID verified" },
              { icon: "🔒", label: "End-to-end encrypted" },
            ].map((b) => (
              <div
                key={b.label}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40"
              >
                <span className="text-lg">{b.icon}</span>
                <span className="text-slate-400 text-[10px] text-center leading-tight">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          SANSight · Hackathon Prototype · Not for clinical use
        </p>
      </div>

      <style jsx>{`
        .glow {
          box-shadow: 0 0 32px rgba(99, 102, 241, 0.3), 0 0 64px rgba(99, 102, 241, 0.1);
        }
      `}</style>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="1" fill="#818cf8" stroke="none" />
    </svg>
  );
}

function WorldIDIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}