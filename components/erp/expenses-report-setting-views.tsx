'use client';

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  X,
  Wallet,
  Save,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { useErp } from '@/context/erp-context';
import {
  Expense,
  ExpenseCategory,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  PaymentMethod,
  formatBDT,
} from '@/lib/types';

/* ============================================================================
   1. DAILY EXPENSES VIEW
   ============================================================================ */
export function DailyExpensesView() {
  const { expenses, storeSettings, saveExpense, deleteExpense } = useErp();

  const [catFilter, setCatFilter] = useState<string>('All');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseDateFilter, setExpenseDateFilter] = useState('');
  const [expensePage, setExpensePage] = useState(1);
  const expensePageSize = 8;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Electricity');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState('');

  const sym = storeSettings.currencySymbol || '৳';
  const today = new Date().toISOString().slice(0, 10);

  const openAdd = () => {
    setEditingExpense(null);
    setTitle('');
    setCategory('Refreshment');
    setAmount('');
    setPaymentMethod('Cash');
    setExpenseDate(today);
    setNotes('');
    setSheetOpen(true);
  };

  const openEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setCategory(exp.category);
    setAmount(String(exp.amount));
    setPaymentMethod(exp.paymentMethod);
    setExpenseDate(exp.expenseDate);
    setNotes(exp.notes);
    setSheetOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveExpense(
      {
        title,
        category,
        amount: Number(amount) || 0,
        paymentMethod,
        expenseDate,
        notes,
      },
      editingExpense?.id
    );
    setSheetOpen(false);
  };

  const filtered = expenses.filter((e) => {
    const matchesCat = catFilter === 'All' || e.category === catFilter;
    const matchesDate = !expenseDateFilter || e.expenseDate === expenseDateFilter;
    const q = expenseSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      e.title.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (e.notes && e.notes.toLowerCase().includes(q)) ||
      e.paymentMethod.toLowerCase().includes(q);
    return matchesCat && matchesDate && matchesSearch;
  });

  const totalExpensePages = Math.max(1, Math.ceil(filtered.length / expensePageSize));
  const pagedExpenses = filtered.slice(
    (expensePage - 1) * expensePageSize,
    expensePage * expensePageSize
  );

  const todayTotal = expenses
    .filter((e) => e.expenseDate === today)
    .reduce((acc, e) => acc + e.amount, 0);
  const filteredTotal = filtered.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Daily Showroom Expenses
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
            Today: {formatBDT(todayTotal, sym)} · Filtered Total:{' '}
            {formatBDT(filteredTotal, sym)}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="min-h-[46px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Log Daily Expense</span>
        </button>
      </div>

      {/* Search & Date Filter Bar (Mobile Optimized) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search expenses by title, note, method..."
            value={expenseSearch}
            onChange={(e) => {
              setExpenseSearch(e.target.value);
              setExpensePage(1);
            }}
            className="w-full min-h-[42px] pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-blue-500 transition-colors"
          />
          {expenseSearch && (
            <button
              type="button"
              onClick={() => {
                setExpenseSearch('');
                setExpensePage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={expenseDateFilter}
            onChange={(e) => {
              setExpenseDateFilter(e.target.value);
              setExpensePage(1);
            }}
            className="min-h-[42px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700"
            title="Filter by date"
          />
          {expenseDateFilter && (
            <button
              type="button"
              onClick={() => {
                setExpenseDateFilter('');
                setExpensePage(1);
              }}
              className="min-h-[42px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 whitespace-nowrap"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => {
            setCatFilter('All');
            setExpensePage(1);
          }}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
            catFilter === 'All'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          All Categories
        </button>
        {EXPENSE_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => {
              setCatFilter(c);
              setExpensePage(1);
            }}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              catFilter === c
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {pagedExpenses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <Wallet className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-900">No Expenses Found</p>
          <p className="text-xs text-slate-400">Try adjusting your category, date, or search keywords</p>
          <button
            onClick={openAdd}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Log First Expense
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {pagedExpenses.map((exp) => (
            <div
              key={exp.id}
              className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-bold text-sm text-slate-900 truncate">{exp.title}</p>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {exp.category}
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="font-mono">{exp.expenseDate}</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-slate-600 font-medium">{exp.paymentMethod}</span>
                  {exp.notes && (
                    <>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="truncate max-w-[180px] sm:max-w-xs">{exp.notes}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <span className="font-mono tabular-nums font-bold text-sm sm:text-base text-slate-900 mr-1">
                  {formatBDT(exp.amount, sym)}
                </span>
                <button
                  onClick={() => openEdit(exp)}
                  className="min-h-[38px] px-2.5 sm:px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteExpense(exp.id)}
                  className="min-h-[38px] min-w-[38px] rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 flex items-center justify-center"
                  title="Delete Expense"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Mobile-Friendly Pagination Controls */}
          {totalExpensePages > 1 && (
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 font-mono">
                Page {expensePage} of {totalExpensePages} ({filtered.length} entries)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={expensePage <= 1}
                  onClick={() => setExpensePage((p) => Math.max(1, p - 1))}
                  className="min-h-[38px] min-w-[38px] px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>
                <div className="px-2 font-mono font-bold text-slate-800">
                  {expensePage} / {totalExpensePages}
                </div>
                <button
                  type="button"
                  disabled={expensePage >= totalExpensePages}
                  onClick={() => setExpensePage((p) => Math.min(totalExpensePages, p + 1))}
                  className="min-h-[38px] min-w-[38px] px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Expense Bottom Sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleSave}
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                {editingExpense ? 'Edit Expense' : 'Log Daily Expense'}
              </h3>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Showroom Electricity Bill"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-base sm:text-sm bg-white"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount ({sym}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="500"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Paid Via
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-base sm:text-sm bg-white"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional note"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex-1 min-h-[46px] rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 min-h-[46px] rounded-xl bg-blue-600 text-white font-semibold text-sm"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   2. REPORT VIEW (Re-exported from dedicated reports-views module)
   ============================================================================ */
export { ReportView } from './reports-views';

/* ============================================================================
   3. SETTING VIEW (Store Configuration & Sample Catalog Loader)
   ============================================================================ */
export function SettingView() {
  const { storeSettings } = useErp();
  return <SettingFormInner key={storeSettings.storeName + storeSettings.phone} />;
}

function SettingFormInner() {
  const { storeSettings, saveStoreSettings, seedSampleData } = useErp();

  const [storeName, setStoreName] = useState(storeSettings.storeName);
  const [tagline, setTagline] = useState(storeSettings.tagline);
  const [phone, setPhone] = useState(storeSettings.phone);
  const [email, setEmail] = useState(storeSettings.email);
  const [address, setAddress] = useState(storeSettings.address);
  const [currencySymbol, setCurrencySymbol] = useState(storeSettings.currencySymbol || '৳');
  const [invoiceFooterNote, setInvoiceFooterNote] = useState(
    storeSettings.invoiceFooterNote
  );
  const [lowStockDefault, setLowStockDefault] = useState(
    String(storeSettings.lowStockDefault || 5)
  );
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveStoreSettings({
        storeName,
        tagline,
        phone,
        email,
        address,
        currencySymbol,
        invoiceFooterNote,
        lowStockDefault: Number(lowStockDefault) || 5,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSample = async () => {
    setSeeding(true);
    try {
      await seedSampleData();
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4"
      >
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Showroom Profile & Invoice Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Changes immediately update your sidebar brand header and printed receipts
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Store / Showroom Name *
            </label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Store Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Phone *
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Store Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Showroom Address *
          </label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Currency Symbol *
            </label>
            <input
              type="text"
              required
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Low Stock Threshold *
            </label>
            <input
              type="number"
              min="0"
              required
              value={lowStockDefault}
              onChange={(e) => setLowStockDefault(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Invoice Footer Note / Exchange Policy
          </label>
          <textarea
            rows={2}
            value={invoiceFooterNote}
            onChange={(e) => setInvoiceFooterNote(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="min-h-[46px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Settings...' : 'Save Showroom Settings'}</span>
        </button>
      </form>

      {/* Sample Store Data Seeder Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Reload Sample 9-Category Garment Store Data
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Populates sample items across Pant, Shirt, Polo Shirt, T-Shirt, Half Pant, Trouser,
            Formal Pant, Sweatshirt, and Half Shirt along with sample customers and invoices.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadSample}
          disabled={seeding}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>{seeding ? 'Seeding...' : 'Load Sample Catalog'}</span>
        </button>
      </div>
    </div>
  );
}
