import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Play,
  SlidersHorizontal,
} from 'lucide-react';
import {
  FraudAssessmentRecord,
  PAYSIM_TYPES,
  PaySimInput,
  PaySimType,
  RiskPreferences,
  TransactionRecord,
} from '../types/finguard';
import { evaluatePersonalRiskSignals, formatINR } from '../lib/riskMonitor';
import { evaluatePaySimTransaction } from '../lib/paysimModels';

interface RiskMonitorViewProps {
  userId: string;
  transactions: TransactionRecord[];
  fraudAssessments: FraudAssessmentRecord[];
  preferences: RiskPreferences;
  onMarkDuplicateReviewed: (txId: string, reviewed: boolean) => Promise<void>;
  onSavePreferences: (prefs: Omit<RiskPreferences, 'userId'>) => Promise<void>;
  onRunPaySim: (input: PaySimInput) => Promise<FraudAssessmentRecord>;
}

export const RiskMonitorView: React.FC<RiskMonitorViewProps> = ({
  userId,
  transactions,
  fraudAssessments,
  preferences,
  onMarkDuplicateReviewed,
  onSavePreferences,
  onRunPaySim,
}) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'paysim'>('personal');

  // Personal monitor config
  const [dailyThreshold, setDailyThreshold] = useState<number>(
    preferences.dailyFrequencyThreshold
  );
  const [multiplier, setMultiplier] = useState<number>(preferences.unusualSpendMultiplier);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefSavedMsg, setPrefSavedMsg] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // PaySim Demo State
  const [step, setStep] = useState('352');
  const [psType, setPsType] = useState<PaySimType>('TRANSFER');
  const [psAmount, setPsAmount] = useState('185000');
  const [oldOrg, setOldOrg] = useState('185000');
  const [newOrg, setNewOrg] = useState('0');
  const [oldDest, setOldDest] = useState('0');
  const [newDest, setNewDest] = useState('0');
  const [runningPaySim, setRunningPaySim] = useState(false);
  const [paySimError, setPaySimError] = useState<string | null>(null);

  const riskReport = useMemo(
    () =>
      evaluatePersonalRiskSignals(transactions, userId, {
        dailyFrequencyThreshold: preferences.dailyFrequencyThreshold,
        unusualSpendMultiplier: preferences.unusualSpendMultiplier,
      }),
    [transactions, userId, preferences]
  );

  const livePreview = useMemo(() => {
    const amt = Number(psAmount);
    if (!Number.isFinite(amt) || amt <= 0) return null;
    try {
      return evaluatePaySimTransaction({
        step: Number(step) || 1,
        transactionType: psType,
        amount: amt,
        oldbalanceOrg: Math.max(0, Number(oldOrg) || 0),
        newbalanceOrig: Math.max(0, Number(newOrg) || 0),
        oldbalanceDest: Math.max(0, Number(oldDest) || 0),
        newbalanceDest: Math.max(0, Number(newDest) || 0),
      });
    } catch {
      return null;
    }
  }, [step, psType, psAmount, oldOrg, newOrg, oldDest, newDest]);

  const handleSavePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefSavedMsg(null);
    try {
      await onSavePreferences({
        dailyFrequencyThreshold: dailyThreshold,
        unusualSpendMultiplier: multiplier,
      });
      setPrefSavedMsg('Monitoring thresholds updated.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleMarkReviewed = async (txId: string) => {
    setReviewingId(txId);
    try {
      await onMarkDuplicateReviewed(txId, true);
    } finally {
      setReviewingId(null);
    }
  };

  const loadPreset = (preset: 'drain' | 'normal') => {
    if (preset === 'drain') {
      setStep('612');
      setPsType('TRANSFER');
      setPsAmount('250000');
      setOldOrg('250000');
      setNewOrg('0');
      setOldDest('0');
      setNewDest('0');
    } else {
      setStep('120');
      setPsType('PAYMENT');
      setPsAmount('1450');
      setOldOrg('48000');
      setNewOrg('46550');
      setOldDest('12000');
      setNewDest('13450');
    }
  };

  const handleRunAndSavePaySim = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaySimError(null);
    const amt = Number(psAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setPaySimError('PaySim amount must be a positive finite number.');
      return;
    }
    setRunningPaySim(true);
    try {
      await onRunPaySim({
        step: Math.max(1, Math.min(744, Number(step) || 1)),
        transactionType: psType,
        amount: amt,
        oldbalanceOrg: Math.max(0, Number(oldOrg) || 0),
        newbalanceOrig: Math.max(0, Number(newOrg) || 0),
        oldbalanceDest: Math.max(0, Number(oldDest) || 0),
        newbalanceDest: Math.max(0, Number(newDest) || 0),
      });
    } catch (err) {
      setPaySimError(err instanceof Error ? err.message : 'Unable to save PaySim assessment.');
    } finally {
      setRunningPaySim(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#0D9488] mb-1">
            Phase 6 · Risk Monitoring &amp; Fraud Bench
          </p>
          <h1 className="text-2xl lg:text-3xl font-bold font-display text-[#0F172A] tracking-tight">
            Risk Signals &amp; PaySim Fraud Demo
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Personal spending anomaly checks are strictly separated from the PaySim synthetic fraud
            classification models.
          </p>
        </div>

        {/* Segmented Mode Switch */}
        <div className="inline-flex items-center p-1 bg-slate-200/70 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-slate-600 hover:text-[#0F172A]'
            }`}
          >
            Personal Activity Monitors
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paysim')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'paysim'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-slate-600 hover:text-[#0F172A]'
            }`}
          >
            PaySim Fraud Model Demo
          </button>
        </div>
      </div>

      {activeTab === 'personal' ? (
        <div className="space-y-6">
          {/* Separate Counts Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Possible Duplicate Clusters</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#0F172A] mt-1">
                {riskReport.duplicates.length}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Matches normalized description, amount, type, date &amp; method
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">High-Frequency Review Days</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#0F172A] mt-1">
                {riskReport.highFrequencyDays.length}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Configurable alert (&ge; {preferences.dailyFrequencyThreshold} entries/day); not
                universal fraud proof
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Unusual Category Expenses</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#0F172A] mt-1">
                {riskReport.unusualExpenses.length}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Compared strictly against prior category records (&ge;{' '}
                {preferences.unusualSpendMultiplier}x baseline)
              </p>
            </div>
          </div>

          {/* Configurable Thresholds */}
          <form
            onSubmit={handleSavePrefs}
            className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <SlidersHorizontal className="w-4 h-4 text-[#0D9488] mt-1 shrink-0" />
              <div>
                <h2 className="text-sm font-semibold text-[#0F172A]">
                  Personal Monitor Thresholds
                </h2>
                <p className="text-xs text-slate-500">
                  Customize sensitivity for your own ledger without affecting other accounts.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Daily frequency threshold
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={dailyThreshold}
                  onChange={(e) => setDailyThreshold(Number(e.target.value))}
                  className="w-28 px-3 py-1.5 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category baseline multiplier
                </label>
                <input
                  type="number"
                  min={1.2}
                  max={10}
                  step={0.1}
                  value={multiplier}
                  onChange={(e) => setMultiplier(Number(e.target.value))}
                  className="w-28 px-3 py-1.5 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={savingPrefs}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg cursor-pointer"
              >
                {savingPrefs ? 'Saving...' : 'Save Thresholds'}
              </button>
            </div>
          </form>

          {prefSavedMsg && (
            <p className="text-xs text-emerald-700 font-medium">{prefSavedMsg}</p>
          )}

          {/* Section 1: Possible Duplicates */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold font-display text-[#0F172A]">
                Possible Duplicate Review
              </h2>
              <p className="text-xs text-slate-500">
                A similar transaction was recorded. Review matching entries or dismiss once
                verified.
              </p>
            </div>

            {riskReport.duplicates.length === 0 ? (
              <div className="p-6 flex items-center gap-2.5 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>No unreviewed duplicate transaction clusters found.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {riskReport.duplicates.map((cluster) => (
                  <div key={cluster.key} className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
                        <span>Possible Duplicate · {cluster.reason}</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Description</th>
                            <th className="py-2 px-3">Category · Method</th>
                            <th className="py-2 px-3 text-right">Amount</th>
                            <th className="py-2 px-3 text-right">Review Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {cluster.transactions.map((tx) => (
                            <tr key={tx.id}>
                              <td className="py-2 px-3 font-mono">{tx.transactionDate}</td>
                              <td className="py-2 px-3 font-medium text-[#0F172A]">
                                {tx.description}
                              </td>
                              <td className="py-2 px-3 text-slate-600">
                                {tx.category} · {tx.paymentMethod}
                              </td>
                              <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold">
                                {formatINR(tx.amount)}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  disabled={reviewingId === tx.id}
                                  onClick={() => handleMarkReviewed(tx.id)}
                                  className="px-2.5 py-1 text-xs font-medium text-[#0D9488] hover:bg-teal-50 border border-teal-200 rounded cursor-pointer"
                                >
                                  {reviewingId === tx.id ? 'Updating...' : 'Mark Reviewed'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Unusual Category Spending */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold font-display text-[#0F172A]">
                Unusual Category Spending Signals
              </h2>
              <p className="text-xs text-slate-500">
                Each expense is compared strictly against prior expenses in the same category
                (excluding the evaluated transaction from its own baseline).
              </p>
            </div>

            {riskReport.unusualExpenses.length === 0 ? (
              <div className="p-6 flex items-center gap-2.5 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>
                  No expenses exceeded {preferences.unusualSpendMultiplier}x your prior category
                  average (minimum 2 prior category records required).
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                    <tr>
                      <th className="py-2.5 px-5">Date</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4 text-right">Prior Avg</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-5">Signal Explanation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {riskReport.unusualExpenses.map((item) => (
                      <tr key={item.transaction.id}>
                        <td className="py-3 px-5 font-mono text-slate-600">
                          {item.transaction.transactionDate}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#0F172A]">
                          {item.transaction.description}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{item.transaction.category}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                          {formatINR(item.priorAverage)} ({item.priorCount} prior)
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-amber-800">
                          {formatINR(item.transaction.amount)} ({item.ratio.toFixed(1)}x)
                        </td>
                        <td className="py-3 px-5 text-slate-600">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Daily Frequency Days */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold font-display text-[#0F172A]">
                Daily Transaction Frequency Alerts
              </h2>
              <p className="text-xs text-slate-500">
                Configurable review indicator (&ge; {preferences.dailyFrequencyThreshold}{' '}
                transactions on a single day).
              </p>
            </div>
            {riskReport.highFrequencyDays.length === 0 ? (
              <div className="p-6 flex items-center gap-2.5 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>No single date exceeded your configured daily transaction count.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {riskReport.highFrequencyDays.map((day) => (
                  <div key={day.date} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-semibold text-[#0F172A] font-mono">{day.date}</p>
                      <p className="text-slate-600 mt-0.5">{day.reason}</p>
                    </div>
                    <span className="font-mono font-semibold tabular-nums text-amber-800">
                      {day.count} entries
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tab 2: PaySim Fraud Model Demo */
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-3 text-xs text-slate-700">
            <Info className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#0F172A] mb-1">
                Model Scope &amp; Separation Boundary
              </p>
              <p className="leading-relaxed">
                Manual personal finance forms do not capture PaySim bank balance transition fields.
                FinGuard AI keeps this PaySim supervised/unsupervised scoring bench strictly separate
                so missing balance columns are never fabricated. Results reflect synthetic PaySim
                benchmark patterns and are automated indicators—not confirmed fraud findings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleRunAndSavePaySim}
              className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h2 className="text-base font-semibold font-display text-[#0F172A]">
                  PaySim Schema Input
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadPreset('drain')}
                    className="px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded cursor-pointer"
                  >
                    Preset: Balance Drain
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset('normal')}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                  >
                    Preset: Normal Payment
                  </button>
                </div>
              </div>

              {paySimError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  {paySimError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Step (1–744 hr)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={744}
                    required
                    value={step}
                    onChange={(e) => setStep(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    PaySim Channel
                  </label>
                  <select
                    value={psType}
                    onChange={(e) => setPsType(e.target.value as PaySimType)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {PAYSIM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    required
                    value={psAmount}
                    onChange={(e) => setPsAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    oldbalanceOrg
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={oldOrg}
                    onChange={(e) => setOldOrg(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    newbalanceOrig
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    oldbalanceDest
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={oldDest}
                    onChange={(e) => setOldDest(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    newbalanceDest
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={newDest}
                    onChange={(e) => setNewDest(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={runningPaySim}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{runningPaySim ? 'Evaluating & Saving...' : 'Score & Save Assessment'}</span>
                </button>
              </div>
            </form>

            {/* Live Multi-Model Scoring Breakdown */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <h2 className="text-base font-semibold font-display text-[#0F172A] border-b border-slate-100 pb-3">
                Model Signal Output (Preview)
              </h2>

              {!livePreview ? (
                <p className="text-xs text-slate-500">Enter a valid positive amount to score.</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-500">Logistic Baseline</p>
                      <p className="text-xl font-bold font-mono tabular-nums text-[#0F172A] mt-1">
                        {livePreview.logisticScore.toFixed(3)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">Linear probability</p>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-500">Random Forest</p>
                      <p
                        className={`text-xl font-bold font-mono tabular-nums mt-1 ${
                          livePreview.fraudFlagged ? 'text-[#DC2626]' : 'text-[#16A34A]'
                        }`}
                      >
                        {livePreview.randomForestScore.toFixed(3)}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {livePreview.fraudFlagged
                          ? `Above ${livePreview.fraudThreshold} threshold`
                          : `Below ${livePreview.fraudThreshold} threshold`}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-500">Isolation Forest</p>
                      <p
                        className={`text-xl font-bold font-mono tabular-nums mt-1 ${
                          livePreview.anomalyFlagged ? 'text-[#D97706]' : 'text-[#0F172A]'
                        }`}
                      >
                        {livePreview.isolationScore.toFixed(3)}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {livePreview.anomalyFlagged
                          ? `Outlier (<= ${livePreview.anomalyThreshold})`
                          : 'Experimental anomaly'}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {livePreview.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Saved User-Scoped PaySim Assessments */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold font-display text-[#0F172A]">
                Your Saved PaySim Assessments ({fraudAssessments.length})
              </h2>
              <p className="text-xs text-slate-500">
                Stored under your authenticated user ID only.
              </p>
            </div>
            {fraudAssessments.length === 0 ? (
              <p className="p-6 text-xs text-slate-500">
                No PaySim assessments saved yet. Run a preset above to test user-scoped storage.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-2.5 px-5">Channel</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-4 text-right">Logistic</th>
                      <th className="py-2.5 px-4 text-right">Random Forest</th>
                      <th className="py-2.5 px-4 text-right">Isolation</th>
                      <th className="py-2.5 px-5">Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fraudAssessments.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-5 font-medium text-[#0F172A]">
                          {item.transactionType} · Step {item.step}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {formatINR(item.amount)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {item.logisticScore.toFixed(3)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {item.randomForestScore.toFixed(3)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {item.isolationScore.toFixed(3)}
                        </td>
                        <td className="py-2.5 px-5">
                          <span
                            className={`font-semibold ${
                              item.fraudFlagged ? 'text-[#DC2626]' : 'text-[#16A34A]'
                            }`}
                          >
                            {item.fraudFlagged ? 'Higher risk indicator' : 'Lower risk indicator'}
                          </span>
                          {' · '}
                          <span className="text-slate-600">
                            {item.anomalyFlagged ? 'Outlier signal' : 'Typical range'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
