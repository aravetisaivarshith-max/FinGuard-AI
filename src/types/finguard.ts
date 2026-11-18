export const TRANSACTION_TYPES = ['Expense', 'Income'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_CATEGORIES = [
  'Uncategorized',
  'Food',
  'Bills',
  'Education',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Transportation',
  'Investment',
  'Other',
] as const;
export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const PAYMENT_METHODS = [
  'UPI',
  'Cash',
  'Card',
  'Bank transfer',
  'Other',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYSIM_TYPES = [
  'TRANSFER',
  'CASH_OUT',
  'PAYMENT',
  'CASH_IN',
  'DEBIT',
] as const;
export type PaySimType = (typeof PAYSIM_TYPES)[number];

export const VALIDATION_LIMITS = {
  UID_MAX: 128,
  DISPLAY_NAME_MAX: 120,
  EMAIL_MAX: 160,
  PHOTO_URL_MAX: 500,
  DESCRIPTION_MAX: 200,
  NOTES_MAX: 400,
  AMOUNT_MAX: 1000000000,
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  DATE_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
} as const;

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  createdAt?: unknown;
  lastLoginAt?: unknown;
}

export interface TransactionInput {
  transactionDate: string;
  description: string;
  amount: number;
  transactionType: TransactionType;
  category: TransactionCategory;
  paymentMethod: PaymentMethod;
  notes: string;
}

export interface TransactionRecord extends TransactionInput {
  id: string;
  userId: string;
  reviewedDuplicate: boolean;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface PaySimInput {
  step: number;
  transactionType: PaySimType;
  amount: number;
  oldbalanceOrg: number;
  newbalanceOrig: number;
  oldbalanceDest: number;
  newbalanceDest: number;
}

export interface FraudAssessmentRecord extends PaySimInput {
  id: string;
  userId: string;
  logisticScore: number;
  randomForestScore: number;
  fraudThreshold: number;
  fraudFlagged: boolean;
  isolationScore: number;
  anomalyThreshold: number;
  anomalyFlagged: boolean;
  createdAtMs: number;
}

export interface RiskPreferences {
  userId: string;
  dailyFrequencyThreshold: number;
  unusualSpendMultiplier: number;
}

export type AppRoute =
  | 'overview'
  | 'transactions'
  | 'analytics'
  | 'risk-monitor'
  | 'scam-awareness'
  | 'models-report'
  | 'account-privacy';
