import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Database,
  Plus,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { AppRoute, RiskPreferences, TransactionInput, TransactionRecord } from '../types/finguard';
import {
  computeCashFlowMetrics,
  computeCategoryTotals,
  evaluatePersonalRiskSignals,
  formatINR,
} from '../lib/riskMonitor';

interface OverviewViewProps {
  userId: string;
  userName: string;
  transactions: TransactionRecord[];
  preferences: RiskPreferences;
  loading: boolean;
  onNavigate: (route: AppRoute) => void;
  onLoadSampleData: (rows: TransactionInput[]) => Promise<void>;
}

const FICTIONAL_SAMPLE_TRANSACTIONS: TransactionInput[] = [
  {
    transactionDate: '2026-10-02',
    description: 'Monthly Internship Stipend Deposit',
    amount: 42000,
    transactionType: 'Income',
    category: 'Other',
    paymentMethod: 'Bank transfer',
    notes: 'Fictional sample income record for October',
  },
  {
    transactionDate: '2026-10-05',
    description: 'Hostel & Utility Electricity Bill BESCOM',
    amount: 3450,
    transactionType: 'Expense',
    category: 'Bills',
    paymentMethod: 'UPI',
    notes: 'Fictional utility payment',
  },
  {
    transactionDate: '2026-10-12',
    description: 'Swiggy Grocery & Meal Order',
    amount: 680,
    transactionType: 'Expense',
    category: 'Food',
    paymentMethod: 'UPI',
    notes: 'Fictional food expense',
  },
  {
    transactionDate: '2026-10-18',
    description: 'NPTEL & Coursera Data Science Course Fee',
    amount: 2499,
    transactionType: 'Expense',
    category: 'Education',
    paymentMethod: 'Card',
    notes: 'Fictional education expense',
  },
  {
    transactionDate: '2026-11-01',
    description: 'Monthly Internship Stipend Deposit',
    amount: 45000,
    transactionType: 'Income',
    category: 'Other',
    paymentMethod: 'Bank transfer',
    notes: 'Fictional sample income record for November',
  },
  {
    transactionDate: '2026-11-04',
    description: 'Uber Metro Commute Pass',
    amount: 1250,
    transactionType: 'Expense',
    category: 'Transportation',
    paymentMethod: 'UPI',
    notes: 'Fictional transit expense',
  },
  {
    transactionDate: '2026-11-07',
    description: 'Swiggy Lunch Order',
    amount: 540,
    transactionType: 'Expense',
    category: 'Food',
    paymentMethod: 'UPI',
    notes: 'Fictional food baseline record',
  },
  {
    transactionDate: '2026-11-10',
    description: 'Swiggy Family Dinner Catering',
    amount: 3900,
    transactionType: 'Expense',
    category: 'Food',
    paymentMethod: 'UPI',
    notes: 'Fictional higher-than-usual food spend for anomaly monitor demo',
  },
  {
    transactionDate: '2026-11-12',
    description: 'Airtel Broadband Fiber Bill',
    amount: 1179,
    transactionType: 'Expense',
    category: 'Bills',
    paymentMethod: 'UPI',
    notes: 'Fictional duplicate pair entry 1',
  },
  {
    transactionDate: '2026-11-12',
    description: 'Airtel Broadband Fiber Bill',
    amount: 1179,
    transactionType: 'Expense',
    category: 'Bills',
    paymentMethod: 'UPI',
    notes: 'Fictional duplicate pair entry 2 for review demo',
  },
];

export const OverviewView: React.FC<OverviewViewProps> = ({
  userId,
  userName,
  transactions,
  preferences,
  loading,
  onNavigate,
  onLoadSampleData,
}) => {
  const [seeding, setSeeding] = useState(false);

  const metrics = useMemo(() => computeCashFlowMetrics(transactions), [transactions]);
  const topCategories = useMemo(() => computeCategoryTotals(transactions).slice(0, 4), [transactions]);
  const riskReport = useMemo(
    () =>
      evaluatePersonalRiskSignals(transactions, userId, {
        dailyFrequencyThreshold: preferences.dailyFrequencyThreshold,
        unusualSpendMultiplier: preferences.unusualSpendMultiplier,
      }),
    [transactions, userId, preferences]
  );

  const totalAlerts =
    riskReport.duplicates.length +
    riskReport.highFrequencyDays.length +
    riskReport.unusualExpenses.length;

  const handleSeedSamples = async () => {
    setSeeding(true);
    try {
      await onLoadSampleData(FICTIONAL_SAMPLE_TRANSACTIONS);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="h-28 bg-white border border-slate-200 rounded-xl p-5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Greeting & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#0D9488] mb-1">Personal Finance Overview</p>
          <h1 className="text-2xl lg:text-3xl font-bold font-display text-[#0F172A] tracking-tight">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            All metrics, charts, and risk signals below reflect only your authenticated account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {transactions.length === 0 && (
            <button
              type="button"
              onClick={handleSeedSamples}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#0F172A] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Database className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>{seeding ? 'Adding fictional records...' : 'Load Fictional Sample Ledger'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('transactions')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Headline Cash-Flow KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Income</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#0F172A] mt-2">
            {formatINR(metrics.income)}
          </p>
          <p className="text-xs text-slate-500 mt-2">Sum of recorded Income entries</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Expenses</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#0F172A] mt-2">
            {formatINR(metrics.expenses)}
          </p>
          <p className="text-xs text-slate-500 mt-2">Sum of recorded Expense entries</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Net Cash Flow</p>
          <p
            className={`text-2xl font-bold font-mono tabular-nums mt-2 ${
              metrics.netSavings >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
            }`}
          >
            {formatINR(metrics.netSavings)}
          </p>
          <p className="text-xs text-slate-500 mt-2">Income minus expenses for period</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Savings Rate</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#0F172A] mt-2">
            {metrics.income > 0 ? `${metrics.savingsRate.toFixed(1)}%` : '0.0%'}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {metrics.transactionCount} total records stored
          </p>
        </div>
      </div>

      {/* Empty State or Populated Grid */}
      {transactions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-2xl mx-auto">
          <TrendingUp className="w-10 h-10 text-[#0D9488] mx-auto mb-3" />
          <h2 className="text-lg font-semibold font-display text-[#0F172A] mb-2">
            Your private ledger is ready
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Add your first income or expense manually, import a CSV statement, or load a small set
            of fictional demo records to explore analytics and risk monitoring right away.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('transactions')}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg transition-colors cursor-pointer"
            >
              Add First Transaction
            </button>
            <button
              type="button"
              onClick={handleSeedSamples}
              disabled={seeding}
              className="px-4 py-2.5 text-sm font-medium text-[#0F172A] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {seeding ? 'Loading Samples...' : 'Load Fictional Samples'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Recent Transactions Table */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold font-display text-[#0F172A]">
                  Recent Activity
                </h2>
                <p className="text-xs text-slate-500">Latest 6 transactions in your ledger</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('transactions')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D9488] hover:text-[#0F766E] cursor-pointer"
              >
                <span>Manage all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 bg-slate-50/70">
                    <th className="py-2.5 px-6">Date</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-6 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {transactions.slice(0, 6).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-6 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {tx.transactionDate}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#0F172A] max-w-[240px] truncate">
                        {tx.description}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {tx.category} · {tx.paymentMethod}
                      </td>
                      <td
                        className={`py-3 px-6 text-right font-mono text-sm font-semibold tabular-nums whitespace-nowrap ${
                          tx.transactionType === 'Income' ? 'text-[#16A34A]' : 'text-[#0F172A]'
                        }`}
                      >
                        {tx.transactionType === 'Income' ? '+' : '-'}
                        {formatINR(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Active Signals & Category Snapshot */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold font-display text-[#0F172A]">
                  Personal Risk Signals
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('risk-monitor')}
                  className="text-xs font-semibold text-[#0D9488] hover:text-[#0F766E] cursor-pointer"
                >
                  Open Monitor
                </button>
              </div>

              {totalAlerts === 0 ? (
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] mt-0.5 shrink-0" />
                  <p>
                    No active duplicate clusters, frequency spikes, or category spending outliers
                    detected in your history.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
                      Possible duplicates
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-[#0F172A]">
                      {riskReport.duplicates.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0" />
                      Unusual category expenses
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-[#0F172A]">
                      {riskReport.unusualExpenses.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-600">High-frequency days</span>
                    <span className="font-mono font-semibold tabular-nums text-[#0F172A]">
                      {riskReport.highFrequencyDays.length}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold font-display text-[#0F172A]">
                  Top Expense Categories
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('analytics')}
                  className="text-xs font-semibold text-[#0D9488] hover:text-[#0F766E] cursor-pointer"
                >
                  Analytics
                </button>
              </div>
              {topCategories.length === 0 ? (
                <p className="text-xs text-slate-500">No expense categories recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {topCategories.map((cat) => (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-[#0F172A]">{cat.category}</span>
                        <span className="font-mono tabular-nums text-slate-600">
                          {formatINR(cat.amount)} ({cat.sharePercent.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0D9488]"
                          style={{ width: `${Math.min(100, cat.sharePercent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
