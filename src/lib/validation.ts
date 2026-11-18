import {
  PAYMENT_METHODS,
  TRANSACTION_CATEGORIES,
  TRANSACTION_TYPES,
  TransactionInput,
  VALIDATION_LIMITS,
} from '../types/finguard.ts';

export function validateTransactionInput(input: TransactionInput): TransactionInput {
  const description = input.description.trim();
  const notes = (input.notes ?? '').trim();
  const amount = Number(input.amount);

  if (!VALIDATION_LIMITS.DATE_PATTERN.test(input.transactionDate)) {
    throw new Error('Transaction date must be in YYYY-MM-DD format.');
  }
  if (!description || description.length > VALIDATION_LIMITS.DESCRIPTION_MAX) {
    throw new Error('Description is required and must be 200 characters or fewer.');
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > VALIDATION_LIMITS.AMOUNT_MAX) {
    throw new Error('Amount must be a positive finite number.');
  }
  if (!TRANSACTION_TYPES.includes(input.transactionType)) {
    throw new Error('Invalid transaction type.');
  }
  if (!TRANSACTION_CATEGORIES.includes(input.category)) {
    throw new Error('Invalid transaction category.');
  }
  if (!PAYMENT_METHODS.includes(input.paymentMethod)) {
    throw new Error('Invalid payment method.');
  }
  if (notes.length > VALIDATION_LIMITS.NOTES_MAX) {
    throw new Error('Notes must be 400 characters or fewer.');
  }

  return {
    transactionDate: input.transactionDate,
    description,
    amount: Number(amount.toFixed(2)),
    transactionType: input.transactionType,
    category: input.category,
    paymentMethod: input.paymentMethod,
    notes,
  };
}
