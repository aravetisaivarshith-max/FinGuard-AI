import React, { useMemo, useState } from 'react';
import {
  Check,
  Download,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  PAYMENT_METHODS,
  PaymentMethod,
  TRANSACTION_CATEGORIES,
  TRANSACTION_TYPES,
  TransactionCategory,
  TransactionInput,
  TransactionRecord,
  TransactionType,
} from '../types/finguard';
import { predictExpenseCategory } from '../lib/expenseClassifier';
import {
  buildUserScopedCsv,
  CsvPreviewResult,
  parseAndValidateTransactionsCsv,
} from '../lib/csvUtils';
import { formatINR } from '../lib/riskMonitor';

interface TransactionsViewProps {
  userId: string;
  transactions: TransactionRecord[];
  onAdd: (input: TransactionInput) => Promise<void>;
  onUpdate: (txId: string, input: TransactionInput) => Promise<void>;
  onDelete: (txId: string) => Promise<void>;
  onBatchImport: (rows: TransactionInput[]) => Promise<number>;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  userId,
  transactions,
  onAdd,
  onUpdate,
  onDelete,
  onBatchImport,
}) => {
  // Add form state
  const [txDate, setTxDate] = useState(todayIso());
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState<TransactionType>('Expense');
  const [category, setCategory] = useState<TransactionCategory>('Uncategorized');
  const [categoryManuallyEdited, setCategoryManuallyEdited] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(
    null
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Edit / Delete inline states
  const [editingTx, setEditingTx] = useState<TransactionRecord | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<TransactionType>('Expense');
  const [editCategory, setEditCategory] = useState<TransactionCategory>('Uncategorized');
  const [editMethod, setEditMethod] = useState<PaymentMethod>('UPI');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // CSV Import state
  const [csvPreview, setCsvPreview] = useState<CsvPreviewResult | null>(null);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [importingCsv, setImportingCsv] = useState(false);

  // Live AI category suggestion
  const aiPrediction = useMemo(
    () => predictExpenseCategory(description, txType),
    [description, txType]
  );

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    if (!categoryManuallyEdited) {
      const pred = predictExpenseCategory(val, txType);
      setCategory(pred.category);
    }
  };

  const handleTypeChange = (nextType: TransactionType) => {
    setTxType(nextType);
    if (!categoryManuallyEdited) {
      const pred = predictExpenseCategory(description, nextType);
      setCategory(pred.category);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFeedback({ kind: 'error', text: 'Amount must be a positive finite number.' });
      return;
    }
    if (!description.trim()) {
      setFeedback({ kind: 'error', text: 'Description is required.' });
      return;
    }

    setSubmitting(true);
    try {
      await onAdd({
        transactionDate: txDate,
        description: description.trim(),
        amount: parsedAmount,
        transactionType: txType,
        category,
        paymentMethod,
        notes: notes.trim(),
      });
      setDescription('');
      setAmount('');
      setNotes('');
      setCategory('Uncategorized');
      setCategoryManuallyEdited(false);
      setFeedback({ kind: 'success', text: 'Transaction saved to your isolated ledger.' });
    } catch (err) {
      setFeedback({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Unable to save transaction.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (q && !tx.description.toLowerCase().includes(q)) return false;
      if (filterType !== 'All' && tx.transactionType !== filterType) return false;
      if (filterCategory !== 'All' && tx.category !== filterCategory) return false;
      if (startDate && tx.transactionDate < startDate) return false;
      if (endDate && tx.transactionDate > endDate) return false;
      return true;
    });
  }, [transactions, searchQuery, filterType, filterCategory, startDate, endDate]);

  const openEditModal = (tx: TransactionRecord) => {
    setEditingTx(tx);
    setEditDate(tx.transactionDate);
    setEditDesc(tx.description);
    setEditAmount(String(tx.amount));
    setEditType(tx.transactionType);
    setEditCategory(tx.category);
    setEditMethod(tx.paymentMethod);
    setEditNotes(tx.notes);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    const parsedAmount = Number(editAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFeedback({ kind: 'error', text: 'Updated amount must be positive.' });
      return;
    }

    setSavingEdit(true);
    try {
      await onUpdate(editingTx.id, {
        transactionDate: editDate,
        description: editDesc.trim(),
        amount: parsedAmount,
        transactionType: editType,
        category: editCategory,
        paymentMethod: editMethod,
        notes: editNotes.trim(),
      });
      setEditingTx(null);
      setFeedback({ kind: 'success', text: 'Transaction updated.' });
    } catch (err) {
      setFeedback({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Record not found or not available.',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async (txId: string) => {
    setDeletingId(txId);
    try {
      await onDelete(txId);
      setConfirmDeleteId(null);
      setFeedback({ kind: 'success', text: 'Transaction deleted from your ledger.' });
    } catch (err) {
      setFeedback({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Record not found or not available.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCsvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const text = await file.text();
    const preview = parseAndValidateTransactionsCsv(text);
    setCsvPreview(preview);
    e.target.value = '';
  };

  const handleCommitCsvImport = async () => {
    if (!csvPreview || csvPreview.accepted.length === 0) return;
    setImportingCsv(true);
    try {
      const count = await onBatchImport(csvPreview.accepted);
      setFeedback({
        kind: 'success',
        text: `Imported ${count} rows into your ledger (${csvPreview.rejected.length} invalid rows skipped).`,
      });
      setCsvPreview(null);
      setCsvFileName('');
    } catch (err) {
      setFeedback({
        kind: 'error',
        text: err instanceof Error ? err.message : 'CSV import failed.',
      });
    } finally {
      setImportingCsv(false);
    }
  };

  const handleExportCsv = () => {
    const csv = buildUserScopedCsv(filteredTransactions, userId);
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#0D9488] mb-1">Phase 4 · Transaction Manager</p>
          <h1 className="text-2xl lg:text-3xl font-bold font-display text-[#0F172A] tracking-tight">
            Transactions &amp; CSV Pipeline
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Add, search, filter, edit, delete, import, and export records belonging exclusively to
            your account.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={filteredTransactions.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download My Transactions ({filteredTransactions.length})</span>
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          className={`px-4 py-3 rounded-lg border text-sm flex items-center justify-between ${
            feedback.kind === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-70"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Grid: Add Form + CSV Import */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleAddSubmit}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold font-display text-[#0F172A]">
              Add New Transaction
            </h2>
            <span className="text-xs text-slate-500">INR (₹)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tx-date" className="block text-xs font-medium text-slate-700 mb-1">
                Transaction Date
              </label>
              <input
                id="tx-date"
                type="date"
                required
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>

            <div>
              <label htmlFor="tx-type" className="block text-xs font-medium text-slate-700 mb-1">
                Type
              </label>
              <select
                id="tx-type"
                value={txType}
                onChange={(e) => handleTypeChange(e.target.value as TransactionType)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              >
                {TRANSACTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="tx-desc" className="block text-xs font-medium text-slate-700 mb-1">
                Description
              </label>
              <input
                id="tx-desc"
                type="text"
                required
                maxLength={200}
                placeholder="e.g., Swiggy lunch, BESCOM electricity bill, Uber ride"
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>

            <div>
              <label htmlFor="tx-amount" className="block text-xs font-medium text-slate-700 mb-1">
                Amount (INR)
              </label>
              <input
                id="tx-amount"
                type="number"
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>
          </div>

          {/* Live AI Suggestion Banner */}
          {description.trim().length > 0 && (
            <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                <span>
                  AI Category Suggestion: <strong className="text-[#0F172A]">{aiPrediction.category}</strong>
                  {aiPrediction.confidence > 0 && (
                    <span className="text-slate-500">
                      {' '}
                      · Confidence {(aiPrediction.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </span>
              </div>
              {category !== aiPrediction.category && (
                <button
                  type="button"
                  onClick={() => {
                    setCategory(aiPrediction.category);
                    setCategoryManuallyEdited(false);
                  }}
                  className="font-semibold text-[#0D9488] hover:underline cursor-pointer"
                >
                  Apply suggestion
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tx-category" className="block text-xs font-medium text-slate-700 mb-1">
                Category (editable override)
              </label>
              <select
                id="tx-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as TransactionCategory);
                  setCategoryManuallyEdited(true);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              >
                {TRANSACTION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tx-method" className="block text-xs font-medium text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                id="tx-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="tx-notes" className="block text-xs font-medium text-slate-700 mb-1">
              Notes (optional)
            </label>
            <input
              id="tx-notes"
              type="text"
              maxLength={400}
              placeholder="Optional reference memo"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Save Transaction'}</span>
            </button>
          </div>
        </form>

        {/* CSV Import Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-semibold font-display text-[#0F172A] border-b border-slate-100 pb-3 mb-4">
              CSV Statement Import
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Required columns: <code className="font-mono text-[#0F172A]">transaction_date</code>,{' '}
              <code className="font-mono text-[#0F172A]">description</code>,{' '}
              <code className="font-mono text-[#0F172A]">amount</code>,{' '}
              <code className="font-mono text-[#0F172A]">transaction_type</code>. Optional:{' '}
              <code className="font-mono text-[#0F172A]">category</code>,{' '}
              <code className="font-mono text-[#0F172A]">payment_method</code>,{' '}
              <code className="font-mono text-[#0F172A]">notes</code>.
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Imported rows are strictly attached to your user account and never mixed into shared
              ML training files.
            </p>

            <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 hover:border-[#0D9488] rounded-lg p-5 text-center cursor-pointer transition-colors bg-slate-50/50">
              <Upload className="w-5 h-5 text-[#0D9488] mb-2" />
              <span className="text-xs font-semibold text-[#0F172A]">
                {csvFileName ? csvFileName : 'Select a CSV file to validate'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">Preview before committing</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvFileUpload}
                className="sr-only"
              />
            </label>
          </div>

          {csvPreview && (
            <div className="border-t border-slate-200 pt-4 space-y-3">
              {csvPreview.missingColumns.length > 0 ? (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  Missing required columns: {csvPreview.missingColumns.join(', ')}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-semibold">
                      Accepted rows: {csvPreview.accepted.length}
                    </span>
                    <span className="text-amber-700 font-semibold">
                      Rejected rows: {csvPreview.rejected.length}
                    </span>
                  </div>

                  {csvPreview.accepted.length > 0 && (
                    <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="py-1.5 px-2.5">Date</th>
                            <th className="py-1.5 px-2.5">Description</th>
                            <th className="py-1.5 px-2.5 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {csvPreview.accepted.slice(0, 10).map((row, idx) => (
                            <tr key={idx}>
                              <td className="py-1.5 px-2.5 font-mono">{row.transactionDate}</td>
                              <td className="py-1.5 px-2.5 truncate max-w-[140px]">
                                {row.description}
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-mono tabular-nums">
                                {formatINR(row.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCsvPreview(null);
                        setCsvFileName('');
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={csvPreview.accepted.length === 0 || importingCsv}
                      onClick={handleCommitCsvImport}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 rounded-lg cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {importingCsv
                          ? 'Importing...'
                          : `Import ${csvPreview.accepted.length} Accepted Rows`}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar & Scoped Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-base font-semibold font-display text-[#0F172A]">
              Your Recorded Ledger ({filteredTransactions.length})
            </h2>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label htmlFor="filter-type" className="block text-xs text-slate-500 mb-1">
                Filter Type
              </label>
              <select
                id="filter-type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="All">All Types</option>
                {TRANSACTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-cat" className="block text-xs text-slate-500 mb-1">
                Filter Category
              </label>
              <select
                id="filter-cat"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="All">All Categories</option>
                {TRANSACTION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-start" className="block text-xs text-slate-500 mb-1">
                From Date
              </label>
              <input
                id="filter-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="filter-end" className="block text-xs text-slate-500 mb-1">
                To Date
              </label>
              <input
                id="filter-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No transactions match your current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-2.5 px-5">Date</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Category · Method</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {tx.transactionDate}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-[#0F172A] max-w-[260px] truncate">
                        {tx.description}
                      </p>
                      {tx.notes && (
                        <p className="text-xs text-slate-500 max-w-[260px] truncate">{tx.notes}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                      {tx.transactionType}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {tx.category} · {tx.paymentMethod}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${
                        tx.transactionType === 'Income' ? 'text-[#16A34A]' : 'text-[#0F172A]'
                      }`}
                    >
                      {tx.transactionType === 'Income' ? '+' : '-'}
                      {formatINR(tx.amount)}
                    </td>
                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      {confirmDeleteId === tx.id ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            disabled={deletingId === tx.id}
                            onClick={() => handleConfirmDelete(tx.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer"
                          >
                            {deletingId === tx.id ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(tx)}
                            className="p-1.5 text-slate-500 hover:text-[#0F172A] rounded hover:bg-slate-100 cursor-pointer"
                            aria-label={`Edit ${tx.description}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(tx.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
                            aria-label={`Delete ${tx.description}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingTx && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveEdit}
            className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold font-display text-[#0F172A]">
                Edit Transaction
              </h3>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
                aria-label="Close edit dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as TransactionType)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {TRANSACTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Amount (INR)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as TransactionCategory)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {TRANSACTION_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
              <input
                type="text"
                maxLength={400}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg cursor-pointer"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
