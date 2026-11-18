import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from './lib/firebase';
import {
  addTransactionForUser,
  batchImportTransactionsForUser,
  deleteAllUserData,
  deleteTransactionForUser,
  ensureUserProfile,
  markDuplicateReviewedForUser,
  runAndSavePaySimAssessment,
  savePreferencesForUser,
  subscribeFraudAssessments,
  subscribePreferences,
  subscribeTransactions,
  updateTransactionForUser,
} from './services/firestoreService';
import {
  AppRoute,
  FraudAssessmentRecord,
  PaySimInput,
  RiskPreferences,
  TransactionInput,
  TransactionRecord,
} from './types/finguard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingGate } from './components/LandingGate';
import { WorkspaceShell } from './components/WorkspaceShell';
import { OverviewView } from './components/OverviewView';
import { TransactionsView } from './components/TransactionsView';
import { AnalyticsView } from './components/AnalyticsView';
import { RiskMonitorView } from './components/RiskMonitorView';
import { ScamAwarenessView } from './components/ScamAwarenessView';
import { ModelsReportView } from './components/ModelsReportView';
import { AccountPrivacyView } from './components/AccountPrivacyView';

function FinGuardRoot() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeRoute, setActiveRoute] = useState<AppRoute>('overview');
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [fraudAssessments, setFraudAssessments] = useState<FraudAssessmentRecord[]>([]);
  const [preferences, setPreferences] = useState<RiskPreferences>({
    userId: '',
    dailyFrequencyThreshold: 5,
    unusualSpendMultiplier: 2.0,
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user);
        setAuthReady(true);
      } else {
        setAuthUser(null);
        setTransactions([]);
        setFraudAssessments([]);
        setPreferences({
          userId: '',
          dailyFrequencyThreshold: 5,
          unusualSpendMultiplier: 2.0,
        });
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !authUser) {
      return;
    }

    let active = true;
    let unsubTx: (() => void) | undefined;
    let unsubAssess: (() => void) | undefined;
    let unsubPrefs: (() => void) | undefined;

    const uid = authUser.uid;
    setDataLoading(true);
    setSyncError(null);

    ensureUserProfile(authUser)
      .then(() => {
        if (!active) return;

        unsubTx = subscribeTransactions(
          uid,
          (rows) => {
            if (!active) return;
            setTransactions(rows);
            setDataLoading(false);
          },
          (err) => {
            if (!active) return;
            setSyncError(err.message);
            setDataLoading(false);
          }
        );

        unsubAssess = subscribeFraudAssessments(
          uid,
          (rows) => {
            if (!active) return;
            setFraudAssessments(rows);
          },
          (err) => {
            if (!active) return;
            setSyncError(err.message);
          }
        );

        unsubPrefs = subscribePreferences(
          uid,
          (prefs) => {
            if (!active) return;
            setPreferences(prefs);
          },
          (err) => {
            if (!active) return;
            setSyncError(err.message);
          }
        );
      })
      .catch((err) => {
        if (!active) return;
        setSyncError(err instanceof Error ? err.message : 'Unable to initialize user profile.');
        setDataLoading(false);
      });

    return () => {
      active = false;
      unsubTx?.();
      unsubAssess?.();
      unsubPrefs?.();
    };
  }, [authReady, authUser]);

  const handleSignIn = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In was cancelled or failed.';
      setAuthError(msg.includes('popup-closed') ? 'Sign-in popup was closed before completing.' : msg);
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setTransactions([]);
    setFraudAssessments([]);
    setActiveRoute('overview');
    await signOut(auth);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#0B1220] text-slate-200 flex items-center justify-center">
        <p className="text-sm font-medium">Initializing FinGuard AI...</p>
      </div>
    );
  }

  if (!authUser) {
    return <LandingGate onSignIn={handleSignIn} signingIn={signingIn} authError={authError} />;
  }

  const uid = authUser.uid;
  const displayName = authUser.displayName || 'FinGuard User';
  const email = authUser.email || 'verified-user@finguard.local';
  const photoURL = authUser.photoURL || '';

  return (
    <WorkspaceShell
      activeRoute={activeRoute}
      onNavigate={setActiveRoute}
      userName={displayName}
      userEmail={email}
      userPhoto={photoURL}
      onSignOut={handleSignOut}
    >
      {syncError && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900"
        >
          Unable to synchronize records with Firestore. Please confirm your Google account email is
          verified and reload.
        </div>
      )}

      {activeRoute === 'overview' && (
        <OverviewView
          userId={uid}
          userName={displayName}
          transactions={transactions}
          preferences={preferences}
          loading={dataLoading}
          onNavigate={setActiveRoute}
          onLoadSampleData={async (rows: TransactionInput[]) => {
            await batchImportTransactionsForUser(uid, rows);
          }}
        />
      )}

      {activeRoute === 'transactions' && (
        <TransactionsView
          userId={uid}
          transactions={transactions}
          onAdd={async (input) => {
            await addTransactionForUser(uid, input);
          }}
          onUpdate={async (txId, input) => {
            await updateTransactionForUser(uid, txId, input);
          }}
          onDelete={async (txId) => {
            await deleteTransactionForUser(uid, txId);
          }}
          onBatchImport={(rows) => batchImportTransactionsForUser(uid, rows)}
        />
      )}

      {activeRoute === 'analytics' && (
        <AnalyticsView transactions={transactions} onNavigate={setActiveRoute} />
      )}

      {activeRoute === 'risk-monitor' && (
        <RiskMonitorView
          userId={uid}
          transactions={transactions}
          fraudAssessments={fraudAssessments}
          preferences={preferences}
          onMarkDuplicateReviewed={(txId, reviewed) =>
            markDuplicateReviewedForUser(uid, txId, reviewed)
          }
          onSavePreferences={(prefs) => savePreferencesForUser(uid, prefs)}
          onRunPaySim={(input: PaySimInput) => runAndSavePaySimAssessment(uid, input)}
        />
      )}

      {activeRoute === 'scam-awareness' && <ScamAwarenessView />}

      {activeRoute === 'models-report' && <ModelsReportView />}

      {activeRoute === 'account-privacy' && (
        <AccountPrivacyView
          userId={uid}
          userName={displayName}
          userEmail={email}
          transactions={transactions}
          fraudAssessments={fraudAssessments}
          onDeleteAllAccountData={async () => {
            await deleteAllUserData(uid);
            await handleSignOut();
          }}
        />
      )}
    </WorkspaceShell>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FinGuardRoot />
    </ErrorBoundary>
  );
}
