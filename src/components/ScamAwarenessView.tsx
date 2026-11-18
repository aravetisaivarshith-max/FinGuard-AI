import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { analyzeScamMessage, ScamAnalysisResult } from '../lib/scamDetector';

const SAMPLE_MESSAGES = [
  {
    label: 'High Priority Example (Fictional KYC Phishing)',
    text: 'URGENT: Your bank account suspended today because KYC expired. Act now and share your OTP and UPI PIN immediately at http://verify-kyc-demo.example to restore access.',
  },
  {
    label: 'Review Recommended (Fictional Prize Link)',
    text: 'Congratulations! You have won a cash reward. Visit www.claim-reward-demo.example to claim your prize.',
  },
  {
    label: 'Routine Notification (Harmless Sample)',
    text: 'Your library book reservation is ready for pickup at the campus desk between 10 AM and 4 PM.',
  },
];

export const ScamAwarenessView: React.FC = () => {
  const [messageText, setMessageText] = useState('');
  const [result, setResult] = useState<ScamAnalysisResult | null>(null);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(analyzeScamMessage(messageText));
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium text-[#0D9488] mb-1">
          Phase 7 · Scam-Awareness Assistant
        </p>
        <h1 className="text-2xl lg:text-3xl font-bold font-display text-[#0F172A] tracking-tight">
          Suspicious Message Warning Check
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Paste a suspicious SMS, WhatsApp, or email excerpt to inspect common social-engineering
          warning signs. This is an educational heuristic—not transaction fraud scoring or proof.
        </p>
      </div>

      {/* Strict Data Minimization Guard */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-[#0F172A] mb-1">Never paste sensitive codes or PINs</p>
          <p>
            Do not enter real OTPs, passwords, UPI PINs, card PINs, CVVs, or account recovery codes.
            Use anonymized or fictional text when testing warning patterns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleAnalyze}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="scam-input" className="text-sm font-semibold text-[#0F172A]">
              Paste a suspicious message
            </label>
            <span className="text-xs text-slate-500">Analyzed locally in-browser</span>
          </div>

          <textarea
            id="scam-input"
            rows={6}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Paste the text of a message here..."
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          />

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {SAMPLE_MESSAGES.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => {
                  setMessageText(sample.text);
                  setResult(analyzeScamMessage(sample.text));
                }}
                className="px-2.5 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              >
                {sample.label}
              </button>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setMessageText('');
                setResult(null);
              }}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-[#0F172A] cursor-pointer"
            >
              Clear
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg transition-colors cursor-pointer"
            >
              Check Warning Signs
            </button>
          </div>
        </form>

        {/* Assessment Output Panel */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          {!result ? (
            <div className="my-auto text-center py-8">
              <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-[#0F172A]">Ready to inspect message text</p>
              <p className="text-xs text-slate-500 mt-1">
                Checks for OTP requests, PIN requests, urgent pressure, account threats, links, and
                prize claims.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-4">
                <p className="text-xs text-slate-500 mb-1">Heuristic Assessment</p>
                <div className="flex items-center gap-2.5">
                  {result.riskLevel === 'High review priority' ? (
                    <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0" />
                  ) : result.riskLevel === 'Review recommended' ? (
                    <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
                  )}
                  <h2
                    className={`text-lg font-bold font-display ${
                      result.riskLevel === 'High review priority'
                        ? 'text-[#DC2626]'
                        : result.riskLevel === 'Review recommended'
                          ? 'text-[#D97706]'
                          : 'text-[#0F172A]'
                    }`}
                  >
                    {result.riskLevel}
                  </h2>
                </div>
              </div>

              {result.details.length === 0 ? (
                <p className="text-sm text-slate-600 leading-relaxed">
                  No rule-based warning phrases matched. Remember: absence of matched keywords does
                  not prove a sender is authentic. Always verify links or financial requests via an
                  official app.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-700">
                    Detected Warning Indicators ({result.details.length})
                  </p>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                    {result.details.map((item) => (
                      <div key={item.label} className="p-3.5 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#0F172A]">{item.label}</span>
                          <code className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.matchedPhrase}
                          </code>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{item.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500 border-t border-slate-100 pt-3">
                {result.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
