import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { analyzeScamMessage } from '../src/lib/scamDetector.ts';
import { predictExpenseCategory } from '../src/lib/expenseClassifier.ts';
import {
  buildUserScopedCsv,
  parseAndValidateTransactionsCsv,
} from '../src/lib/csvUtils.ts';
import {
  computeCashFlowMetrics,
  evaluatePersonalRiskSignals,
} from '../src/lib/riskMonitor.ts';
import { evaluatePaySimTransaction } from '../src/lib/paysimModels.ts';
import { TransactionRecord } from '../src/types/finguard.ts';

function makeTx(overrides: Partial<TransactionRecord>): TransactionRecord {
  return {
    id: overrides.id ?? 'tx_1',
    userId: overrides.userId ?? 'userA',
    transactionDate: overrides.transactionDate ?? '2026-11-10',
    description: overrides.description ?? 'Sample entry',
    amount: overrides.amount ?? 500,
    transactionType: overrides.transactionType ?? 'Expense',
    category: overrides.category ?? 'Food',
    paymentMethod: overrides.paymentMethod ?? 'UPI',
    notes: overrides.notes ?? '',
    reviewedDuplicate: overrides.reviewedDuplicate ?? false,
    createdAtMs: overrides.createdAtMs ?? 1000,
    updatedAtMs: overrides.updatedAtMs ?? 1000,
  };
}

test('Two-account isolation: risk monitors and CSV export never leak Account A rows to Account B', () => {
  const mixedRecords: TransactionRecord[] = [
    makeTx({ id: 'a1', userId: 'userA', description: 'Account A Secret Rent', amount: 15000 }),
    makeTx({ id: 'a2', userId: 'userA', description: 'Account A Secret Rent', amount: 15000 }),
    makeTx({ id: 'b1', userId: 'userB', description: 'Account B Coffee', amount: 180 }),
  ];

  const reportB = evaluatePersonalRiskSignals(mixedRecords, 'userB', {
    dailyFrequencyThreshold: 2,
    unusualSpendMultiplier: 2,
  });
  assert.equal(reportB.duplicates.length, 0);
  assert.equal(reportB.highFrequencyDays.length, 0);
  assert.equal(reportB.unusualExpenses.length, 0);

  const csvB = buildUserScopedCsv(mixedRecords, 'userB');
  assert.ok(csvB.includes('Account B Coffee'));
  assert.ok(!csvB.includes('Account A Secret Rent'));
  assert.ok(!csvB.includes('a1'));
});

test('Firestore rules enforce strict owner UID, email verification, and default-deny', () => {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rulesText = fs.readFileSync(rulesPath, 'utf-8');

  assert.match(rulesText, /allow read, write: if false;/);
  assert.match(rulesText, /request\.auth\.token\.email_verified == true/);
  assert.match(rulesText, /request\.auth\.uid == userId/);
  assert.match(rulesText, /allow list: if isOwner\(userId\) && resource\.data\.userId == request\.auth\.uid;/);
  assert.match(rulesText, /isValidTransaction\(incoming\(\), userId\)/);
});

test('CSV import validation accepts valid rows and rejects invalid dates, amounts, and types', () => {
  const csv = [
    'transaction_date,description,amount,transaction_type,category,payment_method,notes',
    '2026-11-01,Swiggy Lunch,450,Expense,Food,UPI,Lunch order',
    'invalid-date,Bad Date Row,100,Expense,Food,UPI,',
    '2026-11-02,Negative Amount,-50,Expense,Food,UPI,',
    '2026-11-03,Unknown Type,200,Transfer,Other,UPI,',
    '2026-11-04,Internship Stipend,30000,Income,Other,Bank transfer,',
  ].join('\n');

  const result = parseAndValidateTransactionsCsv(csv);
  assert.equal(result.missingColumns.length, 0);
  assert.equal(result.accepted.length, 2);
  assert.equal(result.rejected.length, 3);
  assert.equal(result.accepted[0].description, 'Swiggy Lunch');
  assert.equal(result.accepted[1].transactionType, 'Income');

  const missingCols = parseAndValidateTransactionsCsv('date,desc,amt\n2026-11-01,Test,100');
  assert.ok(missingCols.missingColumns.includes('transaction_date'));
});

test('Unusual spending monitor excludes the evaluated transaction from its own baseline', () => {
  const history: TransactionRecord[] = [
    makeTx({ id: 't1', transactionDate: '2026-11-01', category: 'Food', amount: 400, createdAtMs: 1 }),
    makeTx({ id: 't2', transactionDate: '2026-11-02', category: 'Food', amount: 500, createdAtMs: 2 }),
    makeTx({ id: 't3', transactionDate: '2026-11-03', category: 'Food', amount: 1800, createdAtMs: 3 }),
  ];

  const report = evaluatePersonalRiskSignals(history, 'userA', {
    unusualSpendMultiplier: 2.0,
  });

  assert.equal(report.unusualExpenses.length, 1);
  assert.equal(report.unusualExpenses[0].transaction.id, 't3');
  assert.equal(report.unusualExpenses[0].priorAverage, 450);
  assert.equal(report.unusualExpenses[0].ratio, 4);
});

test('Cash-flow metrics calculate income, expenses, net savings, and savings rate accurately', () => {
  const records: TransactionRecord[] = [
    makeTx({ id: 'i1', transactionType: 'Income', amount: 50000 }),
    makeTx({ id: 'e1', transactionType: 'Expense', amount: 15000 }),
    makeTx({ id: 'e2', transactionType: 'Expense', amount: 5000 }),
  ];

  const metrics = computeCashFlowMetrics(records);
  assert.equal(metrics.income, 50000);
  assert.equal(metrics.expenses, 20000);
  assert.equal(metrics.netSavings, 30000);
  assert.equal(metrics.savingsRate, 60);
});

test('Expense category classifier predicts relevant categories for common merchant descriptions', () => {
  assert.equal(predictExpenseCategory('Swiggy lunch biryani', 'Expense').category, 'Food');
  assert.equal(predictExpenseCategory('BESCOM electricity bill', 'Expense').category, 'Bills');
  assert.equal(predictExpenseCategory('Uber metro commute', 'Expense').category, 'Transportation');
  assert.equal(predictExpenseCategory('Coursera course fee', 'Expense').category, 'Education');
});

test('PaySim evaluator flags account-draining TRANSFER and scores normal PAYMENT low', () => {
  const highRisk = evaluatePaySimTransaction({
    step: 500,
    transactionType: 'TRANSFER',
    amount: 200000,
    oldbalanceOrg: 200000,
    newbalanceOrig: 0,
    oldbalanceDest: 0,
    newbalanceDest: 0,
  });
  assert.equal(highRisk.fraudFlagged, true);
  assert.ok(highRisk.randomForestScore >= highRisk.fraudThreshold);

  const normal = evaluatePaySimTransaction({
    step: 120,
    transactionType: 'PAYMENT',
    amount: 1200,
    oldbalanceOrg: 45000,
    newbalanceOrig: 43800,
    oldbalanceDest: 10000,
    newbalanceDest: 11200,
  });
  assert.equal(normal.fraudFlagged, false);
});

test('Scam detector handles empty, harmless, moderate, and high-priority warning messages', () => {
  const empty = analyzeScamMessage('   ');
  assert.equal(empty.riskLevel, 'Unknown');

  const safe = analyzeScamMessage('Your library book reservation is ready for pickup.');
  assert.equal(safe.riskLevel, 'No obvious warning signs detected');
  assert.equal(safe.warnings.length, 0);

  const single = analyzeScamMessage('Visit https://example.com for details.');
  assert.equal(single.riskLevel, 'Review recommended');
  assert.deepEqual(single.warnings, ['Link present']);

  const high = analyzeScamMessage(
    'URGENT: Your account suspended due to KYC expired. Act now and send OTP and UPI PIN to http://phish.example'
  );
  assert.equal(high.riskLevel, 'High review priority');
  assert.ok(high.warnings.includes('OTP request'));
  assert.ok(high.warnings.includes('PIN request'));
  assert.ok(high.warnings.includes('Account threat'));
  assert.ok(high.warnings.includes('Link present'));
});
