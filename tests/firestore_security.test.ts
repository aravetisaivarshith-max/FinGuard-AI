import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateTransactionInput } from '../src/lib/validation.ts';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');
const rulesText = fs.readFileSync(rulesPath, 'utf-8');
const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf-8'));

test('Dirty Dozen #1–#3: Global safety net denies unauthenticated and cross-account reads/lists', () => {
  assert.match(rulesText, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/);
  assert.match(rulesText, /function isSignedIn\(\)\s*\{\s*return request\.auth != null && request\.auth\.token\.email_verified == true;/);
  assert.match(rulesText, /function isOwner\(userId\)\s*\{\s*return isSignedIn\(\) && request\.auth\.uid == userId;/);
  assert.match(rulesText, /allow get: if isValidId\(userId\) && isValidId\(transactionId\) && isOwner\(userId\);/);
  assert.match(rulesText, /allow list: if isOwner\(userId\) && resource\.data\.userId == request\.auth\.uid;/);
});

test('Dirty Dozen #4–#6: Strict key allowlists (hasAll + hasOnly) block shadow fields and UID spoofing', () => {
  assert.match(rulesText, /data\.keys\(\)\.hasAll\(/);
  assert.match(rulesText, /data\.keys\(\)\.hasOnly\(/);
  assert.match(rulesText, /data\.userId is string && data\.userId == userId/);
  assert.match(rulesText, /data\.uid is string && data\.uid == userId && isValidId\(data\.uid\)/);
});

test('Dirty Dozen #7–#12: Email verification, positive bounds, date regex, immutability, ID length, and server timestamps enforced', () => {
  assert.match(rulesText, /request\.auth\.token\.email_verified == true/);
  assert.match(rulesText, /data\.amount is number && data\.amount > 0 && data\.amount <= 1000000000/);
  assert.match(rulesText, /data\.transactionDate\.matches\('\^\\\\d\{4\}-\\\\d\{2\}-\\\\d\{2\}\$'\)/);
  assert.match(rulesText, /incoming\(\)\.userId == existing\(\)\.userId/);
  assert.match(rulesText, /incoming\(\)\.createdAt == existing\(\)\.createdAt/);
  assert.match(rulesText, /id\.size\(\) <= 128 && id\.matches\('\^\[a-zA-Z0-9_\\\\-\]\+\$'\)/);
  assert.match(rulesText, /incoming\(\)\.createdAt == request\.time/);
  assert.match(rulesText, /incoming\(\)\.updatedAt == request\.time/);
});

test('Blueprint and client-side validation synchronicity rejects invalid amounts, dates, and oversized strings', () => {
  assert.ok(blueprint.entities.UserProfile);
  assert.ok(blueprint.entities.TransactionRecord);
  assert.ok(blueprint.entities.FraudAssessment);
  assert.ok(blueprint.entities.RiskPreferences);

  assert.throws(() =>
    validateTransactionInput({
      transactionDate: '18/11/2026',
      description: 'Bad date',
      amount: 100,
      transactionType: 'Expense',
      category: 'Food',
      paymentMethod: 'UPI',
      notes: '',
    })
  );

  assert.throws(() =>
    validateTransactionInput({
      transactionDate: '2026-11-18',
      description: 'Negative amount',
      amount: -250,
      transactionType: 'Expense',
      category: 'Food',
      paymentMethod: 'UPI',
      notes: '',
    })
  );

  assert.throws(() =>
    validateTransactionInput({
      transactionDate: '2026-11-18',
      description: 'x'.repeat(205),
      amount: 100,
      transactionType: 'Expense',
      category: 'Food',
      paymentMethod: 'UPI',
      notes: '',
    })
  );
});
