"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const pillars = [
  {
    title: "Vision-first monitoring",
    description:
      "Track retinal uploads, eyesight test responses, and optic-health signals linked to fluid shifts in microgravity.",
  },
  {
    title: "Biometrics that matter",
    description:
      "Combine sodium, calcium, magnesium, and vitamin D with exercise adherence for a practical SANS risk estimate.",
  },
  {
    title: "Risk, not diagnosis",
    description:
      "Surface early warning signs and next actions for astronauts and flight teams before vision changes escalate.",
  },
];

const roadmap = [
  "World ID login for privacy-preserving identity verification",
  "Retina scan upload plus a simple onboard vision self-check",
  "Exercise memory so repeated workouts can be logged in one tap",
  "Tabular + vision ML pipeline that outputs a SANS risk percentage",
  "Future wearable integration for continuous monitoring",
];

const team = [
  { name: "Ramya", role: "World ID backend, logo" },
  { name: "Samvida", role: "ML pipeline, presentation" },
];

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  function handleWorldID() {
    setLoading(true);
    setTimeout(() => {
      setVerified(true);
      setTimeout(() => router.push("/log"), 900);
    }, 1600);
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="starfield" />
      <div className="orb orb-left" />
      <div className="orb orb-right" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <p className="eyebrow mb-3">Astronaut Health Intelligence</p>
            <div className="flex items-center gap-3">
              <LogoMark />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">SANSight</h1>
                <p className="text-sm text-slate-400">Early warning for Spaceflight-Associated Neuro-ocular Syndrome</p>
              </div>
            </div>
          </div>

          <a
            href="https://docs.world.org/world-id/overview"
            target="_blank"
            rel="noreferrer"
            className="chip hidden sm:inline-flex"
          >
            World ID docs
          </a>
        </header>

        <section className="grid flex-1 items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <div className="hero-card slide-up">
              <p className="eyebrow mb-4">Mission Control</p>
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Monitor the earliest signs of vision risk before SANS compromises a mission.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                SANSight is a hackathon prototype for screening astronaut health data in one place. It blends retinal
                images, electrolyte and nutrition markers, and exercise logs into an explainable risk percentage.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={handleWorldID}
                  disabled={loading || verified}
                  className="primary-button"
                >
                  {loading && !verified ? (
                    <>
                      <SpinnerIcon />
                      Verifying with World ID
                    </>
                  ) : verified ? (
                    <>
                      <CheckIcon />
                      Verified, opening intake
                    </>
                  ) : (
                    <>
                      <WorldIDIcon />
                      Sign in with World ID
                    </>
                  )}
                </button>

                <Link href="/log" className="secondary-button">
                  Open prototype intake
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {pillars.map((pillar) => (
                  <div key={pillar.title} className="info-panel">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200/90">{pillar.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{pillar.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <section className="glass-card p-6 slide-up" style={{ animationDelay: "0.08s" }}>
                <p className="eyebrow mb-4">Health Concerns</p>
                <div className="space-y-4">
                  <RiskBullet
                    title="Vision changes"
                    description="Fluid shifts can alter optic disc shape, flatten the globe, and change visual acuity over time."
                  />
                  <RiskBullet
                    title="Musculoskeletal decline"
                    description="Bone density loss and muscle atrophy increase injury risk and can reduce exercise capacity."
                  />
                  <RiskBullet
                    title="Silent progression"
                    description="Astronauts may not notice subtle early changes, which makes trend-aware monitoring especially valuable."
                  />
                </div>
              </section>

              <section className="glass-card p-6 slide-up" style={{ animationDelay: "0.16s" }}>
                <p className="eyebrow mb-4">Prototype Inputs</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    "Retinal scan upload",
                    "Sodium level",
                    "Vitamin D",
                    "Calcium",
                    "Magnesium",
                    "Vision self-check",
                    "Exercise type and duration",
                    "Workout intensity and reuse",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <aside className="space-y-5">
            <section className="glass-card p-6 slide-up" style={{ animationDelay: "0.1s" }}>
              <p className="eyebrow mb-4">Plan Snapshot</p>
              <div className="space-y-3">
                {roadmap.map((item, index) => (
                  <div key={item} className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-xs font-semibold text-cyan-200">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-card p-6 slide-up" style={{ animationDelay: "0.18s" }}>
              <p className="eyebrow mb-4">ML Direction</p>
              <div className="rounded-3xl border border-cyan-300/15 bg-slate-950/40 p-4">
                <p className="text-sm font-medium text-white">Weighted fusion model</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Retinal image signals can feed a CNN later, while tabular health features work well with tree-based
                  models today. This prototype simulates that fusion with transparent feature weighting.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["EfficientNet-B0", "XGBoost", "Random Forest", "Explainable scoring"].map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            <section className="glass-card p-6 slide-up" style={{ animationDelay: "0.24s" }}>
              <p className="eyebrow mb-4">Team Ownership</p>
              <div className="space-y-3">
                {team.map((person) => (
                  <div key={person.name} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                    <p className="text-sm font-semibold text-white">{person.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{person.role}</p>
                  </div>
                ))}
              </div>
            </section>

            <p className="px-1 text-xs leading-5 text-slate-500">
              Prototype only. SANSight estimates risk and should not be used as a clinical diagnosis or treatment plan.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}

function RiskBullet({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function LogoMark() {
  return (
    <div className="logo-shell">
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
        <circle cx="15" cy="15" r="14" stroke="rgba(180,246,255,0.45)" />
        <path d="M4 15s4.5-6 11-6 11 6 11 6-4.5 6-11 6-11-6-11-6Z" stroke="#b6f6ff" strokeWidth="1.4" />
        <circle cx="15" cy="15" r="4.2" fill="rgba(106,227,255,0.16)" stroke="#6ae3ff" strokeWidth="1.4" />
        <circle cx="15" cy="15" r="1.8" fill="#6ae3ff" />
      </svg>
    </div>
  );
}

function WorldIDIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
      <path d="M2 12h20" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
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
