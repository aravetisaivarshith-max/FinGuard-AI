import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  FraudAssessmentRecord,
  PAYSIM_TYPES,
  PaySimInput,
  RiskPreferences,
  TransactionInput,
  TransactionRecord,
  VALIDATION_LIMITS,
} from '../types/finguard';
import { evaluatePaySimTransaction } from '../lib/paysimModels';
import { validateTransactionInput } from '../lib/validation';

export { validateTransactionInput };

function toEpochMs(val: unknown): number {
  if (val instanceof Timestamp) {
    return val.toMillis();
  }
  if (val && typeof val === 'object' && 'seconds' in val) {
    const s = (val as { seconds: number }).seconds;
    return s * 1000;
  }
  return Date.now();
}

export async function ensureUserProfile(user: User): Promise<void> {
  if (!VALIDATION_LIMITS.ID_PATTERN.test(user.uid)) {
    throw new Error('Invalid authenticated user identifier.');
  }
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);

  try {
    const snap = await getDoc(userRef);
    const displayName = (user.displayName || 'FinGuard User')
      .trim()
      .slice(0, VALIDATION_LIMITS.DISPLAY_NAME_MAX);
    const email = (user.email || 'verified-user@finguard.local')
      .trim()
      .slice(0, VALIDATION_LIMITS.EMAIL_MAX);
    const photoURL = (user.photoURL || '').trim().slice(0, VALIDATION_LIMITS.PHOTO_URL_MAX);

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: displayName || 'FinGuard User',
        email,
        photoURL,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        displayName: displayName || 'FinGuard User',
        email,
        photoURL,
        lastLoginAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export function subscribeTransactions(
  userId: string,
  onData: (records: TransactionRecord[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/transactions`;
  const q = query(collection(db, 'users', userId, 'transactions'), where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: TransactionRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: String(data.userId),
          transactionDate: String(data.transactionDate),
          description: String(data.description),
          amount: Number(data.amount),
          transactionType: data.transactionType,
          category: data.category,
          paymentMethod: data.paymentMethod,
          notes: String(data.notes ?? ''),
          reviewedDuplicate: Boolean(data.reviewedDuplicate),
          createdAtMs: toEpochMs(data.createdAt),
          updatedAtMs: toEpochMs(data.updatedAt),
        };
      });

      records.sort((a, b) => {
        const dateCmp = b.transactionDate.localeCompare(a.transactionDate);
        if (dateCmp !== 0) return dateCmp;
        return b.createdAtMs - a.createdAtMs;
      });

      onData(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function addTransactionForUser(
  userId: string,
  rawInput: TransactionInput
): Promise<string> {
  const clean = validateTransactionInput(rawInput);
  const path = `users/${userId}/transactions`;
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'transactions'), {
      userId,
      ...clean,
      reviewedDuplicate: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTransactionForUser(
  userId: string,
  transactionId: string,
  rawInput: TransactionInput
): Promise<void> {
  if (!VALIDATION_LIMITS.ID_PATTERN.test(transactionId)) {
    throw new Error('Record not found or not available.');
  }
  const clean = validateTransactionInput(rawInput);
  const path = `users/${userId}/transactions/${transactionId}`;

  try {
    const ref = doc(db, 'users', userId, 'transactions', transactionId);
    await updateDoc(ref, {
      ...clean,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markDuplicateReviewedForUser(
  userId: string,
  transactionId: string,
  reviewedDuplicate: boolean
): Promise<void> {
  if (!VALIDATION_LIMITS.ID_PATTERN.test(transactionId)) {
    throw new Error('Record not found or not available.');
  }
  const path = `users/${userId}/transactions/${transactionId}`;
  try {
    const ref = doc(db, 'users', userId, 'transactions', transactionId);
    await updateDoc(ref, {
      reviewedDuplicate,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTransactionForUser(
  userId: string,
  transactionId: string
): Promise<void> {
  if (!VALIDATION_LIMITS.ID_PATTERN.test(transactionId)) {
    throw new Error('Record not found or not available.');
  }
  const path = `users/${userId}/transactions/${transactionId}`;
  try {
    const ref = doc(db, 'users', userId, 'transactions', transactionId);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function batchImportTransactionsForUser(
  userId: string,
  rows: TransactionInput[]
): Promise<number> {
  if (rows.length === 0) return 0;
  const path = `users/${userId}/transactions`;
  const validated = rows.map(validateTransactionInput);

  try {
    const chunkSize = 400;
    for (let i = 0; i < validated.length; i += chunkSize) {
      const chunk = validated.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const row of chunk) {
        const ref = doc(collection(db, 'users', userId, 'transactions'));
        batch.set(ref, {
          userId,
          ...row,
          reviewedDuplicate: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }
    return validated.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeFraudAssessments(
  userId: string,
  onData: (records: FraudAssessmentRecord[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/fraudAssessments`;
  const q = query(
    collection(db, 'users', userId, 'fraudAssessments'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const records: FraudAssessmentRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: String(data.userId),
          step: Number(data.step),
          transactionType: data.transactionType,
          amount: Number(data.amount),
          oldbalanceOrg: Number(data.oldbalanceOrg),
          newbalanceOrig: Number(data.newbalanceOrig),
          oldbalanceDest: Number(data.oldbalanceDest),
          newbalanceDest: Number(data.newbalanceDest),
          logisticScore: Number(data.logisticScore),
          randomForestScore: Number(data.randomForestScore),
          fraudThreshold: Number(data.fraudThreshold),
          fraudFlagged: Boolean(data.fraudFlagged),
          isolationScore: Number(data.isolationScore),
          anomalyThreshold: Number(data.anomalyThreshold),
          anomalyFlagged: Boolean(data.anomalyFlagged),
          createdAtMs: toEpochMs(data.createdAt),
        };
      });

      records.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function runAndSavePaySimAssessment(
  userId: string,
  input: PaySimInput
): Promise<FraudAssessmentRecord> {
  if (!PAYSIM_TYPES.includes(input.transactionType)) {
    throw new Error('Invalid PaySim transaction type.');
  }
  const evalResult = evaluatePaySimTransaction(input);
  const path = `users/${userId}/fraudAssessments`;

  try {
    const payload = {
      userId,
      step: Math.max(1, Math.min(744, Math.round(input.step))),
      transactionType: input.transactionType,
      amount: Number(input.amount.toFixed(2)),
      oldbalanceOrg: Number(Math.max(0, input.oldbalanceOrg).toFixed(2)),
      newbalanceOrig: Number(Math.max(0, input.newbalanceOrig).toFixed(2)),
      oldbalanceDest: Number(Math.max(0, input.oldbalanceDest).toFixed(2)),
      newbalanceDest: Number(Math.max(0, input.newbalanceDest).toFixed(2)),
      logisticScore: evalResult.logisticScore,
      randomForestScore: evalResult.randomForestScore,
      fraudThreshold: evalResult.fraudThreshold,
      fraudFlagged: evalResult.fraudFlagged,
      isolationScore: evalResult.isolationScore,
      anomalyThreshold: evalResult.anomalyThreshold,
      anomalyFlagged: evalResult.anomalyFlagged,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'users', userId, 'fraudAssessments'), payload);
    return {
      id: docRef.id,
      ...payload,
      createdAtMs: Date.now(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribePreferences(
  userId: string,
  onData: (prefs: RiskPreferences) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/preferences/config`;
  const ref = doc(db, 'users', userId, 'preferences', 'config');

  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData({
          userId,
          dailyFrequencyThreshold: 5,
          unusualSpendMultiplier: 2.0,
        });
      } else {
        const data = snap.data();
        onData({
          userId,
          dailyFrequencyThreshold: Number(data.dailyFrequencyThreshold ?? 5),
          unusualSpendMultiplier: Number(data.unusualSpendMultiplier ?? 2.0),
        });
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function savePreferencesForUser(
  userId: string,
  prefs: Omit<RiskPreferences, 'userId'>
): Promise<void> {
  const path = `users/${userId}/preferences/config`;
  const ref = doc(db, 'users', userId, 'preferences', 'config');
  const dailyFrequencyThreshold = Math.max(1, Math.min(100, Math.round(prefs.dailyFrequencyThreshold)));
  const unusualSpendMultiplier = Number(Math.max(1.2, Math.min(10, prefs.unusualSpendMultiplier)).toFixed(1));

  try {
    await setDoc(ref, {
      userId,
      dailyFrequencyThreshold,
      unusualSpendMultiplier,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAllUserData(userId: string): Promise<void> {
  const basePath = `users/${userId}`;
  try {
    const txSnap = await getDocs(
      query(collection(db, 'users', userId, 'transactions'), where('userId', '==', userId))
    );
    const assessSnap = await getDocs(
      query(collection(db, 'users', userId, 'fraudAssessments'), where('userId', '==', userId))
    );

    const refs = [
      ...txSnap.docs.map((d) => d.ref),
      ...assessSnap.docs.map((d) => d.ref),
      doc(db, 'users', userId, 'preferences', 'config'),
    ];

    const chunkSize = 400;
    for (let i = 0; i < refs.length; i += chunkSize) {
      const batch = writeBatch(db);
      for (const ref of refs.slice(i, i + chunkSize)) {
        batch.delete(ref);
      }
      await batch.commit();
    }

    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, basePath);
  }
}
