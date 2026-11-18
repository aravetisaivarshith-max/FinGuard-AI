import React, { useState } from 'react';
import { Download, ShieldCheck, Trash2 } from 'lucide-react';
import { FraudAssessmentRecord, TransactionRecord } from '../types/finguard';
import { buildUserScopedCsv } from '../lib/csvUtils';

interface AccountPrivacyViewProps {
  userId: string;
  userName: string;
  userEmail: string;
  transactions: TransactionRecord[];
  fraudAssessments: FraudAssessmentRecord[];
  onDeleteAllAccountData: () => Promise<void>;
}

export const AccountPrivacyView: React.FC<AccountPrivacyViewProps> = ({
  userId,
  userName,
  userEmail,
  transactions,
  fraudAssessments,
  onDeleteAllAccountData,
}) => {
  const [confirmDeleteStep, setConfirmDeleteStep] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      account: {
        uid: userId,
        displayName: userName,
        email: userEmail,
      },
      transactions: transactions.filter((t) => t.userId === userId),
      fraudAssessments: fraudAssessments.filter((a) => a.userId === userId),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'finguard_personal_export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const csv = buildUserScopedCsv(transactions, userId);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my_finguard_transactions.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteData = async () => {
    setDeletingAccount(true);
    try {
      await onDeleteAllAccountData();
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium text-[#0D9488] mb-1">
          Phase 10 &amp; Phase 11 · Identity, Isolation &amp; Privacy
        </p>
        <h1 className="text-2xl lg:text-3xl font-bold font-display text-[#0F172A] tracking-tight">
          Account Identity &amp; Data Controls
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Review your verified identity binding, export your stored records, or permanently erase
          your personal workspace data.
        </p>
      </div>

      {/* Verified Identity Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-5 h-5 text-[#0D9488]" />
          <h2 className="text-base font-semibold font-display text-[#0F172A]">
            Authenticated Identity Record
          </h2>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Display Name</dt>
            <dd className="font-medium text-[#0F172A] mt-1">{userName}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Verified Email (Profile Only)</dt>
            <dd className="font-medium text-[#0F172A] mt-1">{userEmail}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Stable Internal UID (Isolation Key)</dt>
            <dd className="font-mono text-xs text-[#0F172A] mt-1 break-all">{userId}</dd>
          </div>
        </dl>

        <p className="text-xs text-slate-600 border-t border-slate-100 pt-3">
          Authentication uses Google OpenID Connect identity only. FinGuard AI never requests Gmail,
          Google Drive, bank login credentials, card PINs, UPI PINs, or OTPs.
        </p>
      </div>

      {/* Two-Account Isolation Verification Protocol */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold font-display text-[#0F172A]">
          Two-Account Isolation Verification Checklist
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          To verify strict account boundaries during project evaluation, sign in with Account A,
          create fictional transactions, sign out, and sign in with Account B. Firestore Security
          Rules enforce <code className="font-mono">request.auth.uid == userId</code> on every
          read, write, list, and delete operation so Account B sees zero records from Account A.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-semibold text-[#0F172A] mb-1">Personal Transactions Stored</p>
            <p className="font-mono text-lg font-bold tabular-nums">{transactions.length}</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-semibold text-[#0F172A] mb-1">Saved PaySim Assessments</p>
            <p className="font-mono text-lg font-bold tabular-nums">{fraudAssessments.length}</p>
          </div>
        </div>
      </div>

      {/* Export & Permanent Deletion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold font-display text-[#0F172A]">
            Export Your Stored Data
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Download a full copy of your transactions and PaySim assessment history in CSV or JSON
            format. Only records scoped to your UID are included.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Transactions CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full JSON Archive</span>
            </button>
          </div>
        </div>

        <div className="bg-white border border-red-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold font-display text-red-900">
            Delete Account &amp; Workspace Data
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Permanently delete your profile document, transactions, preferences, and PaySim
            assessments from Firestore and sign out. Other users&apos; accounts remain completely
            unaffected.
          </p>

          {!confirmDeleteStep ? (
            <button
              type="button"
              onClick={() => setConfirmDeleteStep(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete My Data</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={deletingAccount}
                onClick={handleDeleteData}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
              >
                {deletingAccount ? 'Erasing Data...' : 'Confirm Permanent Deletion'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteStep(false)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
