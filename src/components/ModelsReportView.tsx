import React, { useState } from 'react';
import { BookOpen, CheckSquare, FileText, Square } from 'lucide-react';
import { MODEL_CARDS, PAYSIM_TEMPORAL_SPLIT } from '../lib/paysimModels';

const REPORT_CHAPTERS = [
  {
    chapter: '01. Introduction',
    summary:
      'FinGuard AI addresses fragmented personal expense tracking and opaque fraud alerts for students and individuals by combining structured INR cash-flow analytics with explainable, honest ML indicators.',
  },
  {
    chapter: '02. Problem Statement & Objectives',
    summary:
      'Delivers multi-user isolated transaction CRUD, CSV import/export, personal spending anomaly baselines, a separated PaySim fraud bench, and scam warning explanations. Deliberately excludes real bank credential scraping or live payment execution.',
  },
  {
    chapter: '03. Existing & Proposed System',
    summary:
      'Manual spreadsheets lack category automation and duplicate review; black-box fraud tools hide limitations. FinGuard AI pairs user-editable TF-IDF suggestions with zero-trust per-user data boundaries.',
  },
  {
    chapter: '04. Architecture & Design',
    summary:
      'React + TypeScript web interface backed by Firebase Authentication (Google OpenID Connect identity only) and Cloud Firestore with subcollection ownership rules enforced at the database layer.',
  },
  {
    chapter: '05. Dataset & Preprocessing',
    summary:
      'PaySim synthetic corpus (6,362,620 total rows; 8,213 labelled fraud cases) filtered to TRANSFER and CASH_OUT for supervised fraud modelling, using temporal train/validation/test splits without mixing Kaggle rows into user ledgers.',
  },
  {
    chapter: '06. ML Methodology',
    summary:
      'TF-IDF + Logistic Regression for expense text categorization (74.36% held-out accuracy); Logistic Regression baseline, Random Forest, and Isolation Forest for PaySim evaluation with threshold tuning strictly on validation.',
  },
  {
    chapter: '07. Implementation',
    summary:
      'Modular client engines for categorization, analytics, personal activity monitors, PaySim scoring, CSV schema validation, and scam pattern detection synchronized with hardened Firestore rules.',
  },
  {
    chapter: '08. Testing & Results',
    summary:
      'Verified via automated two-account isolation tests, CSV validation tests, scam-detector unit tests, and ESLint security-rule audits.',
  },
  {
    chapter: '09. Security, Privacy & Ethics',
    summary:
      'Verified Google UID ownership, zero Gmail/Drive scopes, never requesting bank PINs/OTPs/CVVs, transparent synthetic-data limitations, and full user data export and deletion.',
  },
  {
    chapter: '10. Conclusion & Future Work',
    summary:
      'Demonstrates a complete multi-user prototype with responsible AI reporting; future iterations may incorporate consented, labelled scam corpora and periodic budget reminders.',
  },
];

const DEMO_SEQUENCE = [
  'Open the polished FinGuard AI welcome screen and explain the purpose and privacy pledge.',
  'Sign in with Test Account A via Google Sign-In (confirming identity-only OIDC scope).',
  'Add a fictional income and expense entry; demonstrate AI category suggestion and manual override.',
  'Open Analytics to walk through INR cash-flow metrics and all five personal charts.',
  'Demonstrate duplicate review and unusual-spending detection in the Personal Risk Monitor.',
  'Switch to the PaySim Fraud Model Demo tab, run a preset, and explain its synthetic dataset scope and limitations.',
  'Paste a fictional suspicious SMS into the Scam-Awareness Assistant and review highlighted warning explanations.',
  'Sign out and log in with Test Account B to verify complete two-account data isolation.',
];

export const ModelsReportView: React.FC = () => {
  const [selectedCardId, setSelectedCardId] = useState<string>(MODEL_CARDS[0].id);
  const [checkedDemoSteps, setCheckedDemoSteps] = useState<number[]>([]);

  const selectedCard = MODEL_CARDS.find((c) => c.id === selectedCardId) ?? MODEL_CARDS[0];

  const toggleStep = (idx: number) => {
    setCheckedDemoSteps((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium text-[#0D9488] mb-1">
          Phase 8 &amp; Phase 13 · Model Transparency &amp; Documentation
        </p>
        <h1 className="text-2xl lg:text-3xl font-bold font-display text-[#0F172A] tracking-tight">
          Model Cards, Temporal Audit &amp; Project Report
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Honest documentation of training splits, synthetic dataset cautions, evaluation metrics,
          and final presentation guide.
        </p>
      </div>

      {/* Interactive Model Cards */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#0D9488]" />
            <h2 className="text-base font-semibold font-display text-[#0F172A]">
              Interactive Model Cards
            </h2>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {MODEL_CARDS.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedCardId(card.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedCardId === card.id
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {card.name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold font-display text-[#0F172A]">{selectedCard.name}</h3>
              <p className="text-sm text-slate-600">{selectedCard.purpose}</p>
            </div>
            <span className="text-xs font-medium text-[#0D9488] whitespace-nowrap">
              {selectedCard.cautionBadge}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {selectedCard.metrics.map((m) => (
              <div key={m.label} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500">{m.label}</p>
                <p className="text-base font-bold font-mono tabular-nums text-[#0F172A] mt-1">
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div>
              <dt className="text-xs font-semibold text-slate-500 mb-1">Intended Use</dt>
              <dd className="text-slate-700 leading-relaxed">{selectedCard.intendedUse}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500 mb-1">Training Data</dt>
              <dd className="text-slate-700 leading-relaxed">{selectedCard.data}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500 mb-1">Input Features</dt>
              <dd className="text-slate-700 leading-relaxed">{selectedCard.features}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500 mb-1">Human Role</dt>
              <dd className="text-slate-700 leading-relaxed">{selectedCard.humanRole}</dd>
            </div>
            <div className="md:col-span-2 pt-3 border-t border-slate-100">
              <dt className="text-xs font-semibold text-amber-800 mb-1">
                Known Limitations &amp; Responsible Reporting
              </dt>
              <dd className="text-slate-700 leading-relaxed">{selectedCard.limitations}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* PaySim Temporal Split Audit */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold font-display text-[#0F172A]">
            PaySim Temporal Split &amp; Distribution Shift Caution
          </h2>
          <p className="text-xs text-slate-500">
            Test split fraud prevalence (0.98%) is roughly 7x higher than validation (0.14%),
            requiring PR-AUC, F1, precision/recall, and confusion-matrix inspection rather than
            accuracy alone.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
              <tr>
                <th className="py-2.5 px-6">Temporal Split</th>
                <th className="py-2.5 px-4 text-right">Total Rows</th>
                <th className="py-2.5 px-4 text-right">Fraud Cases</th>
                <th className="py-2.5 px-4 text-right">Prevalence</th>
                <th className="py-2.5 px-6">Evaluation Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {PAYSIM_TEMPORAL_SPLIT.map((row) => (
                <tr key={row.split}>
                  <td className="py-3 px-6 font-semibold text-[#0F172A]">{row.split}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    {row.totalRows.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    {row.fraudRows.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                    {row.prevalencePercent.toFixed(2)}%
                  </td>
                  <td className="py-3 px-6 text-slate-600">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 10-Chapter Project Report & Live Demo Sequence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-[#0D9488]" />
            <h2 className="text-base font-semibold font-display text-[#0F172A]">
              Project Report Outline (Chapters 1–10)
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {REPORT_CHAPTERS.map((item) => (
              <div key={item.chapter} className="py-3">
                <h3 className="text-xs font-bold text-[#0F172A] mb-1">{item.chapter}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.summary}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold font-display text-[#0F172A]">
              Five-to-Seven Minute Live Demo Sequence
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Interactive walkthrough checklist ({checkedDemoSteps.length}/{DEMO_SEQUENCE.length}{' '}
              completed)
            </p>
          </div>

          <div className="space-y-2.5">
            {DEMO_SEQUENCE.map((stepText, idx) => {
              const checked = checkedDemoSteps.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleStep(idx)}
                  className="w-full text-left flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-xs leading-relaxed ${
                      checked ? 'line-through text-slate-400' : 'text-slate-700'
                    }`}
                  >
                    {idx + 1}. {stepText}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
