import { TransactionRecord } from '../types/finguard';

export interface CashFlowMetrics {
  income: number;
  expenses: number;
  netSavings: number;
  savingsRate: number;
  transactionCount: number;
}

export interface MonthlyCashFlowPoint {
  month: string; // YYYY-MM
  label: string; // e.g., Nov 2026
  income: number;
  expenses: number;
  netSavings: number;
}

export interface CategoryTotalPoint {
  category: string;
  amount: number;
  sharePercent: number;
  count: number;
}

export interface TimelinePoint {
  date: string;
  income: number;
  expenses: number;
  count: number;
}

export interface MonthComparison {
  available: boolean;
  currentMonthLabel?: string;
  previousMonthLabel?: string;
  expenseDeltaPercent?: number;
  incomeDeltaPercent?: number;
  reason?: string;
}

export interface DuplicateCluster {
  key: string;
  transactionIds: string[];
  transactions: TransactionRecord[];
  reason: string;
}

export interface DailyFrequencyAlert {
  date: string;
  count: number;
  threshold: number;
  transactions: TransactionRecord[];
  reason: string;
}

export interface UnusualSpendingAlert {
  transaction: TransactionRecord;
  priorCount: number;
  priorAverage: number;
  ratio: number;
  reason: string;
}

export interface PersonalRiskReport {
  duplicates: DuplicateCluster[];
  highFrequencyDays: DailyFrequencyAlert[];
  unusualExpenses: UnusualSpendingAlert[];
}

export function formatINR(value: number): string {
  if (!Number.isFinite(value)) return '₹0.00';
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return value < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

export function formatShortMonth(yyyyMm: string): string {
  const [yearStr, monthStr] = yyyyMm.split('-');
  const year = Number(yearStr);
  const monthIdx = Number(monthStr) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIdx) || monthIdx < 0 || monthIdx > 11) {
    return yyyyMm;
  }
  const dt = new Date(Date.UTC(year, monthIdx, 1));
  return dt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function filterTransactionsByDateRange(
  records: TransactionRecord[],
  startDate?: string,
  endDate?: string
): TransactionRecord[] {
  return records.filter((tx) => {
    if (startDate && tx.transactionDate < startDate) return false;
    if (endDate && tx.transactionDate > endDate) return false;
    return true;
  });
}

export function computeCashFlowMetrics(records: TransactionRecord[]): CashFlowMetrics {
  let income = 0;
  let expenses = 0;

  for (const tx of records) {
    if (tx.transactionType === 'Income') {
      income += tx.amount;
    } else if (tx.transactionType === 'Expense') {
      expenses += tx.amount;
    }
  }

  const netSavings = income - expenses;
  const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

  return {
    income,
    expenses,
    netSavings,
    savingsRate,
    transactionCount: records.length,
  };
}

export function computeMonthlySeries(records: TransactionRecord[]): MonthlyCashFlowPoint[] {
  const bucket = new Map<string, { income: number; expenses: number }>();

  for (const tx of records) {
    const month = tx.transactionDate.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) continue;
    const entry = bucket.get(month) ?? { income: 0, expenses: 0 };
    if (tx.transactionType === 'Income') {
      entry.income += tx.amount;
    } else {
      entry.expenses += tx.amount;
    }
    bucket.set(month, entry);
  }

  return Array.from(bucket.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, vals]) => ({
      month,
      label: formatShortMonth(month),
      income: vals.income,
      expenses: vals.expenses,
      netSavings: vals.income - vals.expenses,
    }));
}

export function computeCategoryTotals(records: TransactionRecord[]): CategoryTotalPoint[] {
  const expenses = records.filter((tx) => tx.transactionType === 'Expense');
  const totalExpenses = expenses.reduce((sum, tx) => sum + tx.amount, 0);

  const grouped = new Map<string, { amount: number; count: number }>();
  for (const tx of expenses) {
    const cat = tx.category || 'Uncategorized';
    const current = grouped.get(cat) ?? { amount: 0, count: 0 };
    current.amount += tx.amount;
    current.count += 1;
    grouped.set(cat, current);
  }

  return Array.from(grouped.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      sharePercent: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function computeTransactionTimeline(records: TransactionRecord[]): TimelinePoint[] {
  const grouped = new Map<string, { income: number; expenses: number; count: number }>();

  for (const tx of records) {
    const current = grouped.get(tx.transactionDate) ?? { income: 0, expenses: 0, count: 0 };
    if (tx.transactionType === 'Income') {
      current.income += tx.amount;
    } else {
      current.expenses += tx.amount;
    }
    current.count += 1;
    grouped.set(tx.transactionDate, current);
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date,
      ...vals,
    }));
}

export function computeMonthOverMonth(monthlySeries: MonthlyCashFlowPoint[]): MonthComparison {
  if (monthlySeries.length < 2) {
    return {
      available: false,
      reason: 'Month-over-month comparison requires records across at least two distinct calendar months.',
    };
  }

  const prev = monthlySeries[monthlySeries.length - 2];
  const curr = monthlySeries[monthlySeries.length - 1];

  const expenseDeltaPercent =
    prev.expenses > 0 ? ((curr.expenses - prev.expenses) / prev.expenses) * 100 : undefined;
  const incomeDeltaPercent =
    prev.income > 0 ? ((curr.income - prev.income) / prev.income) * 100 : undefined;

  return {
    available: true,
    currentMonthLabel: curr.label,
    previousMonthLabel: prev.label,
    expenseDeltaPercent,
    incomeDeltaPercent,
  };
}

/**
 * Evaluates strictly user-scoped personal activity signals:
 * 1. Possible duplicate entries (excluding entries marked reviewedDuplicate)
 * 2. Daily frequency above user's configured review threshold
 * 3. Unusual spending relative to PRIOR expenses in the same category (excluding self)
 */
export function evaluatePersonalRiskSignals(
  userTransactions: TransactionRecord[],
  userId: string,
  options: { dailyFrequencyThreshold?: number; unusualSpendMultiplier?: number } = {}
): PersonalRiskReport {
  const scoped = userTransactions.filter((tx) => tx.userId === userId);
  const dailyThreshold = options.dailyFrequencyThreshold ?? 5;
  const multiplier = options.unusualSpendMultiplier ?? 2.0;

  // 1. Duplicate detection: normalized description + amount + type + date + paymentMethod
  const dupGroups = new Map<string, TransactionRecord[]>();
  for (const tx of scoped) {
    if (tx.reviewedDuplicate) continue;
    const normDesc = tx.description.trim().toLowerCase().replace(/\s+/g, ' ');
    const key = `${tx.transactionDate}|${normDesc}|${tx.amount.toFixed(2)}|${tx.transactionType}|${tx.paymentMethod}`;
    const list = dupGroups.get(key) ?? [];
    list.push(tx);
    dupGroups.set(key, list);
  }

  const duplicates: DuplicateCluster[] = [];
  for (const [key, list] of dupGroups.entries()) {
    if (list.length > 1) {
      duplicates.push({
        key,
        transactionIds: list.map((item) => item.id),
        transactions: list,
        reason: 'A similar transaction was recorded. Please review both entries.',
      });
    }
  }

  // 2. Daily frequency count
  const byDate = new Map<string, TransactionRecord[]>();
  for (const tx of scoped) {
    const list = byDate.get(tx.transactionDate) ?? [];
    list.push(tx);
    byDate.set(tx.transactionDate, list);
  }

  const highFrequencyDays: DailyFrequencyAlert[] = [];
  for (const [date, list] of byDate.entries()) {
    if (list.length >= dailyThreshold) {
      highFrequencyDays.push({
        date,
        count: list.length,
        threshold: dailyThreshold,
        transactions: list,
        reason: `You recorded ${list.length} transactions on ${date}, meeting your configured daily review threshold (${dailyThreshold}).`,
      });
    }
  }
  highFrequencyDays.sort((a, b) => b.date.localeCompare(a.date));

  // 3. Unusual spending: sort ascending chronologically, compare each Expense ONLY to prior expenses in same category
  const chronologicalExpenses = scoped
    .filter((tx) => tx.transactionType === 'Expense')
    .slice()
    .sort((a, b) => {
      const dateCmp = a.transactionDate.localeCompare(b.transactionDate);
      if (dateCmp !== 0) return dateCmp;
      return a.createdAtMs - b.createdAtMs;
    });

  const priorByCategory = new Map<string, number[]>();
  const unusualExpenses: UnusualSpendingAlert[] = [];

  for (const tx of chronologicalExpenses) {
    const cat = tx.category || 'Uncategorized';
    const history = priorByCategory.get(cat) ?? [];

    if (history.length >= 2) {
      const sum = history.reduce((acc, v) => acc + v, 0);
      const avg = sum / history.length;
      if (avg > 0 && tx.amount >= avg * multiplier) {
        unusualExpenses.push({
          transaction: tx,
          priorCount: history.length,
          priorAverage: avg,
          ratio: tx.amount / avg,
          reason: 'This expense is above your recent typical amount in this category.',
        });
      }
    }

    // Append AFTER checking so the transaction is excluded from its own baseline
    history.push(tx.amount);
    priorByCategory.set(cat, history);
  }

  unusualExpenses.sort((a, b) => b.transaction.transactionDate.localeCompare(a.transaction.transactionDate));

  return {
    duplicates,
    highFrequencyDays,
    unusualExpenses,
  };
}
