import React, { useMemo, useState } from 'react';
import { Calendar, Info } from 'lucide-react';
import { AppRoute, TransactionRecord } from '../types/finguard';
import {
  computeCashFlowMetrics,
  computeCategoryTotals,
  computeMonthOverMonth,
  computeMonthlySeries,
  computeTransactionTimeline,
  filterTransactionsByDateRange,
  formatINR,
} from '../lib/riskMonitor';

interface AnalyticsViewProps {
  transactions: TransactionRecord[];
  onNavigate: (route: AppRoute) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ transactions, onNavigate }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  const scopedFiltered = useMemo(
    () => filterTransactionsByDateRange(transactions, startDate || undefined, endDate || undefined),
    [transactions, startDate, endDate]
  );

  const metrics = useMemo(() => computeCashFlowMetrics(scopedFiltered), [scopedFiltered]);
  const monthlySeries = useMemo(() => computeMonthlySeries(scopedFiltered), [scopedFiltered]);
  const categoryTotals = useMemo(() => computeCategoryTotals(scopedFiltered), [scopedFiltered]);
  const timeline = useMemo(() => computeTransactionTimeline(scopedFiltered), [scopedFiltered]);
  const momComparison = useMemo(() => computeMonthOverMonth(monthlySeries), [monthlySeries]);

  const maxMonthlyValue = useMemo(() => {
    const vals = monthlySeries.flatMap((m) => [m.income, m.expenses]);
    return Math.max(1, ...vals);
  }, [monthlySeries]);

  const maxTimelineValue = useMemo(() => {
    const vals = timeline.map((t) => t.income + t.expenses);
    return Math.max(1, ...vals);
  }, [timeline]);

  const savingsBounds = useMemo(() => {
    const vals = monthlySeries.map((m) => m.netSavings);
    const min = Math.min(0, ...vals);
    const max = Math.max(1, ...vals);
    return { min, max, span: Math.max(1, max - min) };
  }, [monthlySeries]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#0D9488] mb-1">Phase 5 · Personal Analytics</p>
          <h1 className="text-2xl lg:text-3xl font-bold font-display text-[#0F172A] tracking-tight">
            Cash Flow &amp; Spending Trends
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Visualizing your personal cash-flow summaries in INR (₹) across your selected date
            window.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-lg px-3.5 py-2">
          <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="date"
            aria-label="Filter analytics from date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs text-slate-700 focus:outline-none"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            aria-label="Filter analytics to date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs text-slate-700 focus:outline-none"
          />
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs font-medium text-[#0D9488] hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Headline Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Income</p>
          <p className="text-xl font-bold font-mono tabular-nums text-[#0F172A] mt-1">
            {formatINR(metrics.income)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Expenses</p>
          <p className="text-xl font-bold font-mono tabular-nums text-[#0F172A] mt-1">
            {formatINR(metrics.expenses)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Net Savings</p>
          <p
            className={`text-xl font-bold font-mono tabular-nums mt-1 ${
              metrics.netSavings >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
            }`}
          >
            {formatINR(metrics.netSavings)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Savings Rate</p>
          <p className="text-xl font-bold font-mono tabular-nums text-[#0F172A] mt-1">
            {metrics.income > 0 ? `${metrics.savingsRate.toFixed(1)}%` : '0.0%'}
          </p>
        </div>
      </div>

      {/* Month-over-Month Context Notice */}
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
        {momComparison.available ? (
          <span>
            Comparing <strong>{momComparison.currentMonthLabel}</strong> against{' '}
            <strong>{momComparison.previousMonthLabel}</strong>:{' '}
            {momComparison.expenseDeltaPercent !== undefined
              ? `expenses changed by ${momComparison.expenseDeltaPercent >= 0 ? '+' : ''}${momComparison.expenseDeltaPercent.toFixed(1)}%`
              : 'prior month had no expenses'}
            {momComparison.incomeDeltaPercent !== undefined
              ? ` · income changed by ${momComparison.incomeDeltaPercent >= 0 ? '+' : ''}${momComparison.incomeDeltaPercent.toFixed(1)}%`
              : ''}
            . Note: these are cash-flow summaries, not a complete net-worth calculation.
          </span>
        ) : (
          <span>{momComparison.reason}</span>
        )}
      </div>

      {scopedFiltered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm text-slate-600 mb-4">
            No transactions available in this date window to plot charts.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('transactions')}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg cursor-pointer"
          >
            Go to Transactions
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: Income vs Expenses by Month */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold font-display text-[#0F172A]">
                  1. Income vs. Expenses by Month
                </h2>
                <p className="text-xs text-slate-500">How monthly cash flow evolves over time</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#0D9488] rounded-xs" /> Income
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#0F172A] rounded-xs" /> Expenses
                </span>
              </div>
            </div>

            {monthlySeries.length === 0 ? (
              <p className="text-xs text-slate-500">Insufficient monthly records.</p>
            ) : (
              <div className="space-y-4">
                <div className="h-56 flex items-end gap-4 border-b border-slate-200 pb-2 pt-4 overflow-x-auto">
                  {monthlySeries.map((pt) => {
                    const incH = Math.max(4, (pt.income / maxMonthlyValue) * 170);
                    const expH = Math.max(4, (pt.expenses / maxMonthlyValue) * 170);
                    return (
                      <div
                        key={pt.month}
                        onMouseEnter={() => setHoveredMonth(pt.month)}
                        onMouseLeave={() => setHoveredMonth(null)}
                        className="flex-1 min-w-[68px] flex flex-col items-center gap-2 group"
                      >
                        <div className="flex items-end gap-1.5 h-[176px]">
                          <div
                            title={`Income: ${formatINR(pt.income)}`}
                            className="w-5 bg-[#0D9488] rounded-t transition-opacity group-hover:opacity-90"
                            style={{ height: `${pt.income > 0 ? incH : 2}px` }}
                          />
                          <div
                            title={`Expenses: ${formatINR(pt.expenses)}`}
                            className="w-5 bg-[#0F172A] rounded-t transition-opacity group-hover:opacity-90"
                            style={{ height: `${pt.expenses > 0 ? expH : 2}px` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-600 whitespace-nowrap">
                          {pt.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {hoveredMonth && (
                  <div className="text-xs font-mono tabular-nums text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex flex-wrap gap-4">
                    {(() => {
                      const pt = monthlySeries.find((m) => m.month === hoveredMonth);
                      if (!pt) return null;
                      return (
                        <>
                          <span className="font-semibold">{pt.label}</span>
                          <span>Income: {formatINR(pt.income)}</span>
                          <span>Expenses: {formatINR(pt.expenses)}</span>
                          <span>Net: {formatINR(pt.netSavings)}</span>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chart 2: Expenses by Category */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-semibold font-display text-[#0F172A]">
              2. Expenses by Category
            </h2>
            <p className="text-xs text-slate-500 mb-5">Where expense allocations are concentrated</p>

            {categoryTotals.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                No Expense entries recorded in this range.
              </p>
            ) : (
              <div className="space-y-3.5">
                {categoryTotals.map((cat) => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-[#0F172A]">
                        {cat.category} ({cat.count})
                      </span>
                      <span className="font-mono tabular-nums text-slate-700">
                        {formatINR(cat.amount)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0D9488]"
                        style={{ width: `${Math.max(2, cat.sharePercent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chart 3: Monthly Savings Trend */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-semibold font-display text-[#0F172A]">
              3. Monthly Savings Trend
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Monthly surplus (Income minus Expenses) across active months
            </p>

            {monthlySeries.length < 2 ? (
              <div className="space-y-3">
                {monthlySeries.map((m) => (
                  <div
                    key={m.month}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-xs"
                  >
                    <span className="font-medium">{m.label}</span>
                    <span className="font-mono font-semibold tabular-nums">
                      {formatINR(m.netSavings)}
                    </span>
                  </div>
                ))}
                <p className="text-xs text-slate-500">
                  Add records in at least two distinct months to render a multi-point trend curve.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <svg viewBox="0 0 500 180" className="w-full h-44">
                  {/* Zero Baseline */}
                  {(() => {
                    const zeroY =
                      20 + ((savingsBounds.max - 0) / savingsBounds.span) * 130;
                    const points = monthlySeries.map((pt, idx) => {
                      const x =
                        monthlySeries.length === 1
                          ? 250
                          : 40 + (idx / (monthlySeries.length - 1)) * 420;
                      const y =
                        20 + ((savingsBounds.max - pt.netSavings) / savingsBounds.span) * 130;
                      return { x, y, pt };
                    });
                    const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
                    return (
                      <>
                        <line
                          x1="20"
                          y1={zeroY}
                          x2="480"
                          y2={zeroY}
                          stroke="#CBD5E1"
                          strokeDasharray="4 4"
                        />
                        <polyline
                          fill="none"
                          stroke="#0D9488"
                          strokeWidth="2.5"
                          points={polyline}
                        />
                        {points.map((p) => (
                          <g key={p.pt.month}>
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="4.5"
                              fill={p.pt.netSavings >= 0 ? '#0D9488' : '#DC2626'}
                              stroke="#FFFFFF"
                              strokeWidth="1.5"
                            />
                            <text
                              x={p.x}
                              y="170"
                              textAnchor="middle"
                              className="fill-slate-500 text-[10px] font-mono"
                            >
                              {p.pt.label}
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            )}
          </div>

          {/* Chart 4: Transaction Timeline */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-semibold font-display text-[#0F172A]">
              4. Transaction Timeline
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Daily transaction volume (Income + Expense combined) by date
            </p>

            <div className="h-44 flex items-end gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
              {timeline.map((pt) => {
                const total = pt.income + pt.expenses;
                const heightPx = Math.max(8, (total / maxTimelineValue) * 130);
                return (
                  <div
                    key={pt.date}
                    title={`${pt.date}: ${formatINR(total)} (${pt.count} entries)`}
                    className="flex-1 min-w-[24px] flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="w-full max-w-[28px] bg-[#0F172A] hover:bg-[#0D9488] rounded-t transition-colors"
                      style={{ height: `${heightPx}px` }}
                    />
                    <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                      {pt.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 5: Top Expense Categories Ranked Table */}
          <div className="lg:col-span-12 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold font-display text-[#0F172A]">
                5. Top Expense Categories Breakdown
              </h2>
              <p className="text-xs text-slate-500">
                Ranked descending by total INR spent in the active window
              </p>
            </div>
            {categoryTotals.length === 0 ? (
              <p className="p-6 text-xs text-slate-500">No Expense entries to rank.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-medium text-slate-500">
                      <th className="py-2.5 px-6">Rank</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4 text-right">Transactions</th>
                      <th className="py-2.5 px-4 text-right">Share of Expenses</th>
                      <th className="py-2.5 px-6 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categoryTotals.map((cat, idx) => (
                      <tr key={cat.category} className="hover:bg-slate-50/70">
                        <td className="py-3 px-6 font-mono text-xs text-slate-500 tabular-nums">
                          0{idx + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#0F172A]">{cat.category}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                          {cat.count}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                          {cat.sharePercent.toFixed(1)}%
                        </td>
                        <td className="py-3 px-6 text-right font-mono font-semibold tabular-nums text-[#0F172A]">
                          {formatINR(cat.amount)}
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
