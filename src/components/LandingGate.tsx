import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';

interface LandingGateProps {
  onSignIn: () => Promise<void>;
  signingIn: boolean;
  authError: string | null;
}

export const LandingGate: React.FC<LandingGateProps> = ({
  onSignIn,
  signingIn,
  authError,
}) => {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [vaultImgFailed, setVaultImgFailed] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="border-b border-slate-800/80 bg-[#0B1220]/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="text-lg font-bold tracking-tight text-white font-display whitespace-nowrap shrink-0"
          >
            FinGuard AI
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a
              href="#capabilities"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Capabilities
            </a>
            <a
              href="#isolation"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Data Isolation
            </a>
            <a
              href="#models"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Model Honesty
            </a>
            <a
              href="#privacy"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Privacy Pledge
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={onSignIn}
              disabled={signingIn}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {signingIn ? 'Connecting...' : 'Sign in with Google'}
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Hero Split Section */}
        <section className="max-w-[1200px] mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-sm font-medium text-teal-400 tracking-wide mb-4">
                Personal Finance &amp; Transaction Risk Intelligence
              </p>
              <h1
                className="font-display font-bold tracking-tight text-white leading-[1.08] mb-6"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
              >
                Clarity for your ledger. Honesty in every risk signal.
              </h1>
              <p className="text-base text-slate-300 leading-relaxed max-w-xl mb-8">
                FinGuard AI pairs user-isolated INR expense tracking and cash-flow analytics with
                explainable spending monitors, a separated PaySim fraud model bench, and a
                rule-based scam-awareness assistant.
              </p>

              {authError && (
                <div
                  role="alert"
                  className="mb-6 p-4 rounded-lg bg-red-950/60 border border-red-800/80 text-sm text-red-200"
                >
                  {authError}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onSignIn}
                  disabled={signingIn}
                  className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>{signingIn ? 'Opening Google Sign-In...' : 'Sign in with Google'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#isolation"
                  className="px-5 py-3 text-sm font-medium text-slate-200 border border-slate-700 hover:border-slate-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Inspect Security Architecture
                </a>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                <span>Google OpenID Identity Only</span>
                <span aria-hidden="true">·</span>
                <span>Zero Gmail or Drive Scopes</span>
                <span aria-hidden="true">·</span>
                <span>Per-User Firestore Rules</span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[320px] rounded-xl overflow-hidden border border-slate-800 bg-[#0F172A]">
                {!heroImgFailed ? (
                  <img
                    src="/src/assets/images/hero_finguard_architecture_1795022885954.jpg"
                    alt="Minimalist obsidian architectural geometry representing layered financial security"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full min-h-[320px] flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#0F172A] to-[#132238] text-center">
                    <ShieldCheck className="w-12 h-12 text-teal-400 mb-3" />
                    <p className="text-sm font-medium text-slate-200">
                      Isolated Financial Architecture
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4-Column Structural Proof Strip */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-800 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-[#0F172A] p-6">
              <p className="text-xs text-slate-400 mb-1">Category Classifier</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-white">74.36%</p>
              <p className="text-xs text-slate-400 mt-2">
                TF-IDF + Logistic Regression held-out benchmark with manual override
              </p>
            </div>
            <div className="bg-[#0F172A] p-6">
              <p className="text-xs text-slate-400 mb-1">PaySim Training Corpus</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-white">6,362,620</p>
              <p className="text-xs text-slate-400 mt-2">
                Synthetic rows kept strictly separate from personal user records
              </p>
            </div>
            <div className="bg-[#0F172A] p-6">
              <p className="text-xs text-slate-400 mb-1">Account Isolation</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-white">100% UID</p>
              <p className="text-xs text-slate-400 mt-2">
                Zero-trust Firestore rules verify verified Google UID on every read &amp; write
              </p>
            </div>
            <div className="bg-[#0F172A] p-6">
              <p className="text-xs text-slate-400 mb-1">Scam Heuristics</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-white">6 Patterns</p>
              <p className="text-xs text-slate-400 mt-2">
                Explainable warning signals for OTP, PIN, urgency, threats, links &amp; prizes
              </p>
            </div>
          </div>
        </section>

        {/* Core Capabilities Bento (Light Crisp Contrast Section) */}
        <section id="capabilities" className="bg-[#F8FAFC] text-[#0F172A] py-20 border-y border-slate-200">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="max-w-2xl mb-12">
              <p className="text-sm font-semibold text-[#0D9488] mb-2">Core Platform Modules</p>
              <h2
                className="text-3xl font-bold font-display tracking-tight text-[#0F172A] mb-3"
                style={{ textWrap: 'balance' }}
              >
                Built for daily clarity and transparent risk review
              </h2>
              <p className="text-base text-slate-600">
                Every workflow inside the authenticated workspace is scoped strictly to your signed-in
                account and respects clear boundaries between personal spending and synthetic ML demos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-8">
                <p className="text-xs font-mono text-slate-500 mb-3">01. Transaction Manager &amp; CSV Pipeline</p>
                <h3 className="text-xl font-bold font-display text-[#0F172A] mb-3">
                  Structured INR ledger with AI category suggestions
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  Log income or expenses with instant TF-IDF category suggestions you can override
                  before saving. Filter by parsed date ranges, search descriptions, edit or delete
                  owned rows, validate bulk CSV imports row-by-row, and export only your records.
                </p>
                <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                  <span>10 Categories</span>
                  <span aria-hidden="true">·</span>
                  <span>CSV Schema Preview</span>
                  <span aria-hidden="true">·</span>
                  <span>Scoped Export</span>
                </div>
              </div>

              <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-8">
                <p className="text-xs font-mono text-slate-500 mb-3">02. Personal Cash-Flow Analytics</p>
                <h3 className="text-xl font-bold font-display text-[#0F172A] mb-3">
                  Five responsive INR visualizations
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  Track monthly Income vs. Expenses, category distribution, monthly net savings
                  trends, daily timelines, and top spend drivers—without judgmental copy.
                </p>
                <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                  <span>INR Formatting</span>
                  <span aria-hidden="true">·</span>
                  <span>Date-Range Sync</span>
                  <span aria-hidden="true">·</span>
                  <span>MoM Guard</span>
                </div>
              </div>

              <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-8">
                <p className="text-xs font-mono text-slate-500 mb-3">03. Personal Activity Monitors</p>
                <h3 className="text-xl font-bold font-display text-[#0F172A] mb-3">
                  Honest anomaly signals on your own baseline
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  Detect possible duplicate entries, configurable daily transaction frequency spikes,
                  and category outliers compared exclusively against your prior history.
                </p>
                <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                  <span>Duplicate Review</span>
                  <span aria-hidden="true">·</span>
                  <span>Prior-Only Baseline</span>
                </div>
              </div>

              <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-8">
                <p className="text-xs font-mono text-slate-500 mb-3">04. PaySim Fraud Bench &amp; Scam Assistant</p>
                <h3 className="text-xl font-bold font-display text-[#0F172A] mb-3">
                  Separated ML evaluation and message warning checks
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  Evaluate complete PaySim TRANSFER/CASH_OUT records across Logistic Regression,
                  Random Forest, and Isolation Forest without contaminating manual personal entries,
                  plus check suspicious SMS or WhatsApp texts for heuristic red flags.
                </p>
                <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                  <span>Model Cards</span>
                  <span aria-hidden="true">·</span>
                  <span>Temporal Shift Audit</span>
                  <span aria-hidden="true">·</span>
                  <span>Scam Explanations</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Isolation Showcase */}
        <section id="isolation" className="max-w-[1200px] mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            <div className="lg:col-span-5">
              <div className="h-full min-h-[280px] rounded-xl overflow-hidden border border-slate-800 bg-[#0F172A]">
                {!vaultImgFailed ? (
                  <img
                    src="/src/assets/images/privacy_vault_partition_1795022885751.jpg"
                    alt="Three separated frosted glass vaults illustrating strict per-user Firestore partition boundaries"
                    referrerPolicy="no-referrer"
                    onError={() => setVaultImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full min-h-[280px] flex flex-col items-center justify-center p-8 bg-[#0F172A] text-center">
                    <Lock className="w-10 h-10 text-teal-400 mb-3" />
                    <p className="text-sm text-slate-300">Per-User Vault Partitioning</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-center">
              <p className="text-sm font-medium text-teal-400 mb-2">Security Foundation</p>
              <h2
                className="text-3xl font-bold font-display text-white mb-4"
                style={{ textWrap: 'balance' }}
              >
                Two-account isolation enforced at the database rules layer
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Client-side filtering alone never secures a multi-user finance app. Every personal
                transaction, preference, and PaySim assessment lives under your verified Firebase UID
                path and is guarded by zero-trust Firestore rules that validate ownership, field
                schemas, numeric bounds, and server timestamps.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[#0F172A] border border-slate-800">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Stable UID Identity</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Anchored to your immutable Google-backed Firebase UID rather than mutable display
                    names.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[#0F172A] border border-slate-800">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Clean Sign-Out Purge</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    All listeners detach and memory state clears before switching to a second test
                    account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Model Honesty & Privacy Pledge */}
        <section id="models" className="border-t border-slate-800 bg-[#0F172A]/60 py-16">
          <div id="privacy" className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-xl font-bold font-display text-white mb-3">
                Model Limitations &amp; Scientific Integrity
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Manual expense entries do not carry bank balance transition schemas. FinGuard AI
                never fabricates missing PaySim balance fields or treats synthetic benchmark
                scores as real-world banking fraud proof. All risk outputs are framed as review
                indicators requiring human judgment.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-white mb-3">
                Data Minimization Pledge
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                FinGuard AI never asks for bank login credentials, card PINs, UPI PINs, CVVs, or
                OTPs. You retain full control to inspect, export (CSV/JSON), or permanently delete
                all of your stored records at any time from the Account &amp; Privacy center.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <span>FinGuard AI — Personal Finance &amp; Transaction Risk Monitoring Prototype</span>
          <div className="flex items-center gap-4">
            <span>Google OIDC Sign-In</span>
            <span aria-hidden="true">·</span>
            <span>Firestore User Isolation</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
