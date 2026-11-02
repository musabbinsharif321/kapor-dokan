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
  Bluetooth,
  Printer,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useErp } from '@/context/erp-context';
import { bluetoothPrinter } from '@/lib/thermal-printer';
import {
  Expense,
  ExpenseCategory,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  PaymentMethod,
  formatBDT,
  getTodayBD,
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
  const [expenseDate, setExpenseDate] = useState(getTodayBD());
  const [notes, setNotes] = useState('');

  const sym = storeSettings.currencySymbol || '৳';
  const today = getTodayBD();

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
                  onClick={() => {
                    if (window.confirm(`Delete expense "${exp.title}"?`)) {
                      deleteExpense(exp.id);
                    }
                  }}
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
  return (
    <SettingFormInner
      key={
        storeSettings.storeName +
        storeSettings.phone +
        storeSettings.address +
        storeSettings.email +
        String(storeSettings.openingCash || 0) +
        String(storeSettings.securityPin || '') +
        (storeSettings.updatedAt || '')
      }
    />
  );
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
  const [securityPin, setSecurityPin] = useState(storeSettings.securityPin || '1234');
  const [showPin, setShowPin] = useState(false);
  const [openingCash, setOpeningCash] = useState(
    String(storeSettings.openingCash || 0)
  );
  const [openingBkash, setOpeningBkash] = useState(
    String(storeSettings.openingBkash || 0)
  );
  const [openingNagad, setOpeningNagad] = useState(
    String(storeSettings.openingNagad || 0)
  );
  const [openingCard, setOpeningCard] = useState(
    String(storeSettings.openingCard || 0)
  );
  const [openingBank, setOpeningBank] = useState(
    String(storeSettings.openingBank || 0)
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [btStatus, setBtStatus] = useState<string | null>(
    bluetoothPrinter.getConnectedDeviceName()
  );
  const [btConnecting, setBtConnecting] = useState(false);

  const handleTestBtConnect = async () => {
    setBtConnecting(true);
    try {
      const name = await bluetoothPrinter.connect();
      setBtStatus(name);
      alert(`Successfully connected to ${name}!`);
    } catch (err: any) {
      alert(err.message || 'Could not connect to Bluetooth printer.');
    } finally {
      setBtConnecting(false);
    }
  };

  const handleTestBtPrint = async () => {
    if (!bluetoothPrinter.isConnected()) {
      alert('Please tap "Connect MP-58T Printer" first.');
      return;
    }
    try {
      await bluetoothPrinter.printReceipt({
        storeName: storeSettings.storeName || 'NEXT FIT',
        tagline: storeSettings.tagline,
        address: storeSettings.address,
        phone: storeSettings.phone,
        invoiceNumber: 'TEST-0001',
        date: getTodayBD(),
        partyName: 'Test Customer',
        itemsSummary: '1x Test Garment (L) [৳500]',
        itemsCount: 1,
        subtotal: 500,
        discount: 0,
        grandTotal: 500,
        paidAmount: 500,
        dueAmount: 0,
        paymentMethod: 'Cash',
        footerNote: 'Bluetooth Test Print Successful!',
      });
      alert('Test receipt sent to printer successfully!');
    } catch (err: any) {
      alert(err.message || 'Print error.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
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
        securityPin: securityPin.trim() || '1234',
        openingCash: Math.max(0, Number(openingCash) || 0),
        openingBkash: Math.max(0, Number(openingBkash) || 0),
        openingNagad: Math.max(0, Number(openingNagad) || 0),
        openingCard: Math.max(0, Number(openingCard) || 0),
        openingBank: Math.max(0, Number(openingBank) || 0),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 5000);
    } catch (err: any) {
      console.error('Settings save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSample = async () => {
    if (
      !window.confirm(
        'Load sample 9-category garment catalog and demo transactions? Your existing custom store profile settings will be preserved.'
      )
    ) {
      return;
    }
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

        {/* Security PIN & Opening Account Balances */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Security PIN & Opening Account Balances
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Set the PIN required for inventory stock/item deletion and your starting balances for Cash, bKash, Nagad, Card, and Bank accounts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inventory Security PIN *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value)}
                  placeholder="e.g. 1234"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  name="inventory_pin_code"
                  id="inventory_pin_code"
                  data-lpignore="true"
                  style={{
                    WebkitTextSecurity: showPin ? 'none' : 'disc',
                  } as React.CSSProperties}
                  className="w-full min-h-[42px] px-3.5 pr-10 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  title={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Cash ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Bank ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                value={openingBank}
                onChange={(e) => setOpeningBank(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening bKash ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                value={openingBkash}
                onChange={(e) => setOpeningBkash(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Nagad ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                value={openingNagad}
                onChange={(e) => setOpeningNagad(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Card/POS ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                value={openingCard}
                onChange={(e) => setOpeningCard(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="min-h-[46px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Settings...' : 'Save Showroom Settings'}</span>
          </button>
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Showroom Address & Profile Updated Successfully!</span>
            </span>
          )}
        </div>
      </form>

      {/* Bluetooth Thermal Printer (MP-58T) Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Bluetooth className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Bluetooth Thermal Printer (MP-58T / 58mm)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Connect your portable 58mm Bluetooth printer directly to this ERP for instant receipt printing without wires.
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
              btStatus
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {btStatus ? `Connected: ${btStatus}` : 'Disconnected'}
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-2 text-slate-700 leading-relaxed">
          <p className="font-semibold text-slate-900">
            📱 মোবাইল থেকে কানেক্ট করার নিয়ম:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
            <li>
              <strong>Android ও Computer:</strong> Google Chrome বা Microsoft Edge ব্রাউজারে সাইট ওপেন করে নিচের <em>&quot;Connect MP-58T Printer&quot;</em> বাটনে চাপ দিন।
            </li>
            <li>
              <strong>iPhone / iPad (iOS):</strong> অ্যাপল Safari ব্রাউজারে ব্লুটুথ সাপোর্ট বন্ধ রাখে। তাই App Store থেকে ফ্রি <strong>&quot;Bluefy – Web BLE Browser&quot;</strong> অ্যাপটি নামিয়ে সাইট ওপেন করে কানেক্ট করুন অথবা ইনভয়েস থেকে <strong>&quot;iOS App Share&quot;</strong> ব্যবহার করুন।
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleTestBtConnect}
            disabled={btConnecting}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
          >
            <Bluetooth className={`w-4 h-4 ${btConnecting ? 'animate-spin' : ''}`} />
            <span>
              {btConnecting
                ? 'Searching Bluetooth...'
                : btStatus
                ? 'Reconnect / Change Printer'
                : 'Connect MP-58T Printer'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleTestBtPrint}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Send Test Print</span>
          </button>
        </div>
      </div>

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
