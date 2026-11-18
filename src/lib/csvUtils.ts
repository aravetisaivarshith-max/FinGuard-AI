import {
  PAYMENT_METHODS,
  PaymentMethod,
  TRANSACTION_CATEGORIES,
  TransactionCategory,
  TransactionInput,
  TransactionRecord,
  TransactionType,
  VALIDATION_LIMITS,
} from '../types/finguard';
import { predictExpenseCategory } from './expenseClassifier';

export const REQUIRED_CSV_COLUMNS = [
  'transaction_date',
  'description',
  'amount',
  'transaction_type',
] as const;

export interface CsvRejectedRow {
  rowNumber: number;
  raw: Record<string, string>;
  reason: string;
}

export interface CsvPreviewResult {
  missingColumns: string[];
  accepted: TransactionInput[];
  rejected: CsvRejectedRow[];
  totalRows: number;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function normalizeDateToIso(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (VALIDATION_LIMITS.DATE_PATTERN.test(trimmed)) {
    const parsed = new Date(`${trimmed}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(trimmed)) {
      return trimmed;
    }
    return null;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function normalizeType(raw: string): TransactionType | null {
  const clean = raw.trim().toLowerCase();
  if (clean === 'income') return 'Income';
  if (clean === 'expense') return 'Expense';
  return null;
}

function normalizeCategory(raw: string | undefined, description: string, type: TransactionType): TransactionCategory {
  if (raw && raw.trim()) {
    const match = TRANSACTION_CATEGORIES.find(
      (c) => c.toLowerCase() === raw.trim().toLowerCase()
    );
    if (match) return match;
  }
  return predictExpenseCategory(description, type).category;
}

function normalizePaymentMethod(raw: string | undefined): PaymentMethod {
  if (raw && raw.trim()) {
    const match = PAYMENT_METHODS.find(
      (m) => m.toLowerCase() === raw.trim().toLowerCase()
    );
    if (match) return match;
  }
  return 'Other';
}

/**
 * Validates an uploaded CSV string against Phase 4.6 rules:
 * Requires: transaction_date, description, amount, transaction_type.
 * Optional: category, payment_method, notes.
 */
export function parseAndValidateTransactionsCsv(csvText: string): CsvPreviewResult {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return {
      missingColumns: [...REQUIRED_CSV_COLUMNS],
      accepted: [],
      rejected: [],
      totalRows: 0,
    };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const missingColumns = REQUIRED_CSV_COLUMNS.filter((col) => !headers.includes(col));

  if (missingColumns.length > 0) {
    return {
      missingColumns,
      accepted: [],
      rejected: [],
      totalRows: Math.max(0, lines.length - 1),
    };
  }

  const accepted: TransactionInput[] = [];
  const rejected: CsvRejectedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const raw: Record<string, string> = {};
    headers.forEach((header, idx) => {
      raw[header] = values[idx] ?? '';
    });

    const isoDate = normalizeDateToIso(raw.transaction_date ?? '');
    const amount = Number(raw.amount);
    const txType = normalizeType(raw.transaction_type ?? '');
    const description = (raw.description ?? '').trim();

    if (!isoDate) {
      rejected.push({ rowNumber: i + 1, raw, reason: 'Invalid or missing transaction_date (expected YYYY-MM-DD).' });
      continue;
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > VALIDATION_LIMITS.AMOUNT_MAX) {
      rejected.push({ rowNumber: i + 1, raw, reason: 'Amount must be a positive finite number.' });
      continue;
    }
    if (!txType) {
      rejected.push({ rowNumber: i + 1, raw, reason: 'transaction_type must be Income or Expense.' });
      continue;
    }
    if (!description || description.length > VALIDATION_LIMITS.DESCRIPTION_MAX) {
      rejected.push({ rowNumber: i + 1, raw, reason: 'Description is required (max 200 characters).' });
      continue;
    }

    const category = normalizeCategory(raw.category, description, txType);
    const paymentMethod = normalizePaymentMethod(raw.payment_method);
    const notes = (raw.notes ?? '').trim().slice(0, VALIDATION_LIMITS.NOTES_MAX);

    accepted.push({
      transactionDate: isoDate,
      description,
      amount: Number(amount.toFixed(2)),
      transactionType: txType,
      category,
      paymentMethod,
      notes,
    });
  }

  return {
    missingColumns: [],
    accepted,
    rejected,
    totalRows: lines.length - 1,
  };
}

function escapeCsvCell(value: string | number | boolean): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates a CSV string strictly from the authenticated user's scoped records.
 */
export function buildUserScopedCsv(records: TransactionRecord[], authenticatedUserId: string): string {
  const scoped = records.filter((tx) => tx.userId === authenticatedUserId);
  const header = [
    'id',
    'transaction_date',
    'description',
    'amount',
    'transaction_type',
    'category',
    'payment_method',
    'notes',
  ].join(',');

  const rows = scoped.map((tx) =>
    [
      escapeCsvCell(tx.id),
      escapeCsvCell(tx.transactionDate),
      escapeCsvCell(tx.description),
      escapeCsvCell(tx.amount.toFixed(2)),
      escapeCsvCell(tx.transactionType),
      escapeCsvCell(tx.category),
      escapeCsvCell(tx.paymentMethod),
      escapeCsvCell(tx.notes),
    ].join(',')
  );

  return [header, ...rows].join('\n');
}
