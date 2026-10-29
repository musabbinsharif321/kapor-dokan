'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  X,
  Wallet,
  Printer,
  Download,
  Sparkles,
  Save,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  DollarSign,
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  CreditCard,
  Package,
  Users,
  Truck,
  AlertCircle,
  FileText,
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

  const filtered = expenses.filter(
    (e) => catFilter === 'All' || e.category === catFilter
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

      {/* Category Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setCatFilter('All')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 ${
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
            onClick={() => setCatFilter(c)}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 ${
              catFilter === c
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <Wallet className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-900">No Expenses Logged</p>
          <button
            onClick={openAdd}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Log First Expense
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exp) => (
            <div
              key={exp.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-bold text-sm text-slate-900 truncate">{exp.title}</p>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <span className="font-medium text-slate-700">{exp.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{exp.expenseDate}</span>
                  <span aria-hidden="true">·</span>
                  <span>{exp.paymentMethod}</span>
                  {exp.notes && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{exp.notes}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono tabular-nums font-bold text-sm text-slate-900">
                  {formatBDT(exp.amount, sym)}
                </span>
                <button
                  onClick={() => openEdit(exp)}
                  className="min-h-[38px] px-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteExpense(exp.id)}
                  className="min-h-[38px] min-w-[38px] rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
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
   2. REPORT VIEW (Advanced Date Filtered Profit & Loss, Sales, Purchases, Stock)
   ============================================================================ */
type DatePreset = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'all' | 'custom';
type ReportTab = 'overview' | 'sales' | 'expenses' | 'purchases' | 'stock' | 'dues';

export function ReportView() {
  const {
    products,
    allCategories,
    salesInvoices,
    purchaseInvoices,
    expenses,
    customers,
    suppliers,
    storeSettings,
    returns,
  } = useErp();

  const sym = storeSettings.currencySymbol || '৳';

  // Date filters
  const [preset, setPreset] = useState<DatePreset>('thisMonth');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [salesSearch, setSalesSearch] = useState<string>('');

  // Compute active date range based on preset
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (preset === 'today') {
      return { startDate: todayStr, endDate: todayStr, periodLabel: "Today's Report" };
    }
    if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().slice(0, 10);
      return { startDate: yStr, endDate: yStr, periodLabel: "Yesterday's Report" };
    }
    if (preset === 'thisWeek') {
      const w = new Date(today);
      w.setDate(w.getDate() - 6);
      const wStr = w.toISOString().slice(0, 10);
      return { startDate: wStr, endDate: todayStr, periodLabel: 'Last 7 Days (This Week)' };
    }
    if (preset === 'thisMonth') {
      const mStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      return { startDate: mStart, endDate: todayStr, periodLabel: 'This Month' };
    }
    if (preset === 'lastMonth') {
      const lmStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 10);
      const lmEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().slice(0, 10);
      return { startDate: lmStart, endDate: lmEnd, periodLabel: 'Last Month' };
    }
    if (preset === 'custom') {
      return {
        startDate: customStart,
        endDate: customEnd,
        periodLabel: `${customStart || 'Start'} to ${customEnd || 'Today'}`,
      };
    }
    return { startDate: '', endDate: '', periodLabel: 'All-Time Financial Statement' };
  }, [preset, customStart, customEnd]);

  // Helper date checker
  const isDateInRange = (recordDate?: string) => {
    if (!recordDate) return false;
    const d = recordDate.slice(0, 10);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  };

  // Filtered Datasets
  const filteredSales = useMemo(
    () => salesInvoices.filter((i) => isDateInRange(i.invoiceDate)),
    [salesInvoices, startDate, endDate]
  );

  const filteredExpenses = useMemo(
    () => expenses.filter((e) => isDateInRange(e.expenseDate)),
    [expenses, startDate, endDate]
  );

  const filteredPurchases = useMemo(
    () => purchaseInvoices.filter((p) => isDateInRange(p.purchaseDate)),
    [purchaseInvoices, startDate, endDate]
  );

  const filteredReturns = useMemo(
    () => returns.filter((r) => isDateInRange(r.date)),
    [returns, startDate, endDate]
  );

  // Financial Metrics for the Filtered Period
  const grossSales = filteredSales.reduce((acc, i) => acc + i.grandTotal, 0);
  const totalCollectedSales = filteredSales.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalCOGS = filteredSales.reduce((acc, i) => acc + (i.totalCost || 0), 0);
  const grossProfit = grossSales - totalCOGS;
  const grossMarginPct = grossSales > 0 ? ((grossProfit / grossSales) * 100).toFixed(1) : '0.0';

  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const netMarginPct = grossSales > 0 ? ((netProfit / grossSales) * 100).toFixed(1) : '0.0';

  const newCustomerDue = filteredSales.reduce((acc, i) => acc + i.dueAmount, 0);
  const totalPurchasesInPeriod = filteredPurchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const paidToSuppliersInPeriod = filteredPurchases.reduce((acc, p) => acc + p.paidAmount, 0);
  const newSupplierDueInPeriod = filteredPurchases.reduce((acc, p) => acc + p.dueAmount, 0);

  // Overall Balances (Real-time liabilities)
  const totalCustomerDueAllTime = customers.reduce((acc, c) => acc + c.totalDue, 0);
  const totalSupplierPayableAllTime = suppliers.reduce((acc, s) => acc + s.totalPayable, 0);
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const totalStockCostVal = products.reduce((acc, p) => acc + p.stock * p.purchasePrice, 0);
  const totalStockRetailVal = products.reduce((acc, p) => acc + p.stock * p.sellingPrice, 0);

  // Payment Breakdown for Filtered Sales
  const paymentBreakdown = useMemo(() => {
    return {
      Cash: filteredSales.filter((i) => i.paymentMethod === 'Cash').reduce((a, i) => a + i.paidAmount, 0),
      bKash: filteredSales.filter((i) => i.paymentMethod === 'bKash').reduce((a, i) => a + i.paidAmount, 0),
      Nagad: filteredSales.filter((i) => i.paymentMethod === 'Nagad').reduce((a, i) => a + i.paidAmount, 0),
      Card: filteredSales.filter((i) => i.paymentMethod === 'Card').reduce((a, i) => a + i.paidAmount, 0),
    };
  }, [filteredSales]);

  // Expenses Breakdown by Category for Filtered Period
  const expenseCategoryBreakdown = useMemo(() => {
    return EXPENSE_CATEGORIES.map((cat) => {
      const matched = filteredExpenses.filter((e) => e.category === cat);
      const total = matched.reduce((a, e) => a + e.amount, 0);
      return { category: cat, total, count: matched.length };
    }).filter((x) => x.total > 0);
  }, [filteredExpenses]);

  // Filtered sales search
  const searchedSales = useMemo(() => {
    if (!salesSearch.trim()) return filteredSales;
    const q = salesSearch.toLowerCase();
    return filteredSales.filter(
      (s) =>
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.customerPhone.includes(q) ||
        s.itemsSummary.toLowerCase().includes(q)
    );
  }, [filteredSales, salesSearch]);

  // CSV Export for filtered data
  const handleExportCSV = () => {
    const summaryRows = [
      ['ThreadCraft Apparel ERP - Financial Statement Report'],
      [`Period: ${periodLabel}`],
      [`Generated At: ${new Date().toLocaleString()}`],
      [''],
      ['FINANCIAL SUMMARY', 'AMOUNT'],
      ['Gross Sales Revenue', String(grossSales)],
      ['Cost of Goods Sold (COGS)', String(totalCOGS)],
      ['Gross Trading Profit', String(grossProfit)],
      ['Gross Profit Margin (%)', `${grossMarginPct}%`],
      ['Total Operating Expenses', String(totalExpenses)],
      ['Net Profit / Loss', String(netProfit)],
      ['Net Profit Margin (%)', `${netMarginPct}%`],
      ['Cash Collected from Sales', String(totalCollectedSales)],
      ['New Customer Due Created', String(newCustomerDue)],
      ['Stock Purchases in Period', String(totalPurchasesInPeriod)],
      ['Paid to Suppliers in Period', String(paidToSuppliersInPeriod)],
      [''],
      ['INVOICE LIST', 'DATE', 'CUSTOMER', 'ITEMS COUNT', 'PAYMENT METHOD', 'GRAND TOTAL', 'PAID', 'DUE', 'ESTIMATED PROFIT'],
      ...filteredSales.map((s) => [
        s.invoiceNumber,
        s.invoiceDate,
        `"${s.customerName}"`,
        String(s.itemsCount),
        s.paymentMethod,
        String(s.grandTotal),
        String(s.paidAmount),
        String(s.dueAmount),
        String(s.grandTotal - (s.totalCost || 0)),
      ]),
    ];

    const csvContent = summaryRows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threadcraft-report-${preset}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Printable Letterhead (Only visible during print) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-3 mb-4">
        <h1 className="text-xl font-bold uppercase tracking-wider text-black">
          {storeSettings.storeName || 'ThreadCraft Apparel'}
        </h1>
        <p className="text-xs text-slate-700">{storeSettings.address}</p>
        <p className="text-xs font-mono text-slate-700">Phone: {storeSettings.phone}</p>
        <div className="mt-2 text-xs font-semibold bg-slate-100 py-1 px-2 inline-block rounded">
          Financial Statement Report | {periodLabel}
        </div>
      </div>

      {/* Header & Filter Controls Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Financial Profit/Loss & Store Performance Report
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter sales, purchases, cost of goods, daily expenses, and net profit
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Export</span> CSV
            </button>
            <button
              onClick={() => window.print()}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Date Presets Row */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Range:</span>
            </span>
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'thisWeek', label: 'This Week' },
                { id: 'thisMonth', label: 'This Month' },
                { id: 'lastMonth', label: 'Last Month' },
                { id: 'all', label: 'All Time' },
                { id: 'custom', label: 'Custom' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  preset === p.id
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="text-xs font-medium text-blue-700 bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-100/80 flex items-center gap-1.5 shrink-0 self-start md:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Active Range: <strong>{periodLabel}</strong></span>
          </div>
        </div>

        {/* Custom Date Pickers (Visible when preset is 'custom') */}
        {preset === 'custom' && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Primary KPI Summary Cards for the Filtered Period */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono tabular-nums">
        {/* 1. Gross Sales */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between font-sans text-xs text-slate-500">
            <span>Gross Sales ({filteredSales.length} bills)</span>
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {formatBDT(grossSales, sym)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] font-sans text-slate-500 border-t border-slate-100 pt-2">
            <span>Collected:</span>
            <span className="font-mono font-bold text-emerald-600">
              {formatBDT(totalCollectedSales, sym)}
            </span>
          </div>
        </div>

        {/* 2. Garment COGS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between font-sans text-xs text-slate-500">
            <span>Cost of Goods (COGS)</span>
            <Package className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-700 mt-2">
            {formatBDT(totalCOGS, sym)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] font-sans text-slate-500 border-t border-slate-100 pt-2">
            <span>Of Total Sales:</span>
            <span className="font-mono text-slate-600">
              {grossSales > 0 ? `${((totalCOGS / grossSales) * 100).toFixed(0)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* 3. Operational Expenses */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between font-sans text-xs text-slate-500">
            <span>Expenses ({filteredExpenses.length} entries)</span>
            <Wallet className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-2">
            {formatBDT(totalExpenses, sym)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] font-sans text-slate-500 border-t border-slate-100 pt-2">
            <span>Rent, Staff, Bills</span>
            <span className="font-mono text-amber-600 font-semibold">OpEx</span>
          </div>
        </div>

        {/* 4. Net Profit */}
        <div
          className={`rounded-2xl border p-4 shadow-xs relative overflow-hidden ${
            netProfit >= 0 ? 'bg-emerald-950/5 border-emerald-300' : 'bg-red-950/5 border-red-300'
          }`}
        >
          <div className="flex items-center justify-between font-sans text-xs">
            <span className="font-semibold text-slate-800">Net Profit</span>
            {netProfit >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
          </div>
          <p
            className={`text-xl sm:text-2xl font-bold mt-2 ${
              netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {formatBDT(netProfit, sym)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] font-sans text-slate-600 border-t border-slate-200/60 pt-2">
            <span>Profit Margin:</span>
            <span
              className={`font-mono font-bold ${
                netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {netMarginPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center border-b border-slate-200 overflow-x-auto print:hidden gap-1 pb-1">
        {(
          [
            { id: 'overview', label: 'Income Statement', icon: FileText },
            { id: 'sales', label: `Sales Ledger (${filteredSales.length})`, icon: ShoppingBag },
            { id: 'expenses', label: `Expenses (${filteredExpenses.length})`, icon: Wallet },
            { id: 'purchases', label: `Purchases (${filteredPurchases.length})`, icon: Truck },
            { id: 'stock', label: 'Stock Valuation', icon: Package },
            { id: 'dues', label: 'Dues & Liabilities', icon: Users },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
                active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & INCOME STATEMENT */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Detailed Step-by-Step Income Statement */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  1. Profit & Loss Income Statement
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statement Period: <strong className="text-slate-700">{periodLabel}</strong>
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                GAAP Standard
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs sm:text-sm font-mono tabular-nums">
              {/* Sales */}
              <div className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-sans font-semibold text-slate-900">
                    (+) Gross Sales Revenue
                  </span>
                  <span className="block font-sans text-[11px] text-slate-400">
                    Total billing across {filteredSales.length} sales invoices
                  </span>
                </div>
                <span className="font-bold text-base text-slate-900">
                  {formatBDT(grossSales, sym)}
                </span>
              </div>

              {/* COGS */}
              <div className="py-3 flex justify-between items-center bg-slate-50/50 -mx-3 px-3 rounded-lg">
                <div>
                  <span className="font-sans font-medium text-slate-700">
                    (-) Cost of Goods Sold (Garment Purchase Cost)
                  </span>
                  <span className="block font-sans text-[11px] text-slate-400">
                    Cost of merchandise sold in this period
                  </span>
                </div>
                <span className="font-bold text-slate-700">
                  -{formatBDT(totalCOGS, sym)}
                </span>
              </div>

              {/* Gross Profit */}
              <div className="py-3.5 flex justify-between items-center bg-blue-50/70 -mx-3 px-3 rounded-lg border border-blue-100">
                <div>
                  <span className="font-sans font-bold text-blue-950 text-sm">
                    (=) Gross Trading Profit
                  </span>
                  <span className="block font-sans text-[11px] text-blue-700">
                    Gross Margin: {grossMarginPct}% (Direct retail profit)
                  </span>
                </div>
                <span className="font-bold text-base text-blue-700">
                  {formatBDT(grossProfit, sym)}
                </span>
              </div>

              {/* Expenses */}
              <div className="py-3 flex justify-between items-center bg-slate-50/50 -mx-3 px-3 rounded-lg">
                <div>
                  <span className="font-sans font-medium text-slate-700">
                    (-) Operating & Daily Expenses
                  </span>
                  <span className="block font-sans text-[11px] text-slate-400">
                    Rent, electricity, staff salary, refreshments, transport ({filteredExpenses.length} entries)
                  </span>
                </div>
                <span className="font-bold text-amber-600">
                  -{formatBDT(totalExpenses, sym)}
                </span>
              </div>

              {/* Net Profit */}
              <div
                className={`py-4 flex justify-between items-center -mx-3 px-3 rounded-xl border-2 ${
                  netProfit >= 0
                    ? 'bg-emerald-50/90 border-emerald-500'
                    : 'bg-red-50/90 border-red-500'
                }`}
              >
                <div>
                  <span className="font-sans font-extrabold text-base text-slate-900 block">
                    (=) Net Showroom Profit
                  </span>
                  <span className="font-sans text-xs text-slate-600">
                    Final bottom-line net profit after all COGS and operational expenses
                  </span>
                </div>
                <span
                  className={`text-xl sm:text-2xl font-black ${
                    netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {formatBDT(netProfit, sym)}
                </span>
              </div>
            </div>
          </div>

          {/* Cash Inflow & Payment Methods Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Method Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Payment Collection Breakdown</span>
              </h4>
              <p className="text-xs text-slate-500">
                Revenue split by payment channel during this period
              </p>

              <div className="space-y-2 pt-1 font-mono text-xs tabular-nums">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50">
                  <span className="font-sans font-medium text-slate-700">Cash in Drawer</span>
                  <span className="font-bold text-slate-900">
                    {formatBDT(paymentBreakdown.Cash, sym)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-pink-50/60 border border-pink-100">
                  <span className="font-sans font-medium text-pink-900">bKash</span>
                  <span className="font-bold text-pink-700">
                    {formatBDT(paymentBreakdown.bKash, sym)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-orange-50/60 border border-orange-100">
                  <span className="font-sans font-medium text-orange-900">Nagad</span>
                  <span className="font-bold text-orange-700">
                    {formatBDT(paymentBreakdown.Nagad, sym)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
                  <span className="font-sans font-medium text-blue-900">Card / POS</span>
                  <span className="font-bold text-blue-700">
                    {formatBDT(paymentBreakdown.Card, sym)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="font-sans font-semibold text-amber-900">
                    New Customer Receivables (Due Created)
                  </span>
                  <span className="font-bold text-amber-700">
                    {formatBDT(newCustomerDue, sym)}
                  </span>
                </div>
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-600" />
                <span>Expense Category Breakdown</span>
              </h4>
              <p className="text-xs text-slate-500">
                Operating expenditures categorized for this period
              </p>

              {expenseCategoryBreakdown.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No expenses logged during this period
                </div>
              ) : (
                <div className="space-y-2 pt-1 font-mono text-xs tabular-nums">
                  {expenseCategoryBreakdown.map((item) => (
                    <div
                      key={item.category}
                      className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50"
                    >
                      <span className="font-sans font-medium text-slate-700">
                        {item.category} ({item.count})
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatBDT(item.total, sym)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900 text-white font-bold">
                    <span className="font-sans">Total Operating Expenses</span>
                    <span>{formatBDT(totalExpenses, sym)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED SALES LEDGER */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                2. Sales Invoices Register ({filteredSales.length} bills)
              </h3>
              <p className="text-xs text-slate-500">
                Itemized bills, collection status, and estimated profit per invoice
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                placeholder="Search invoice or customer..."
                className="w-full min-h-[40px] pl-3 pr-8 rounded-xl border border-slate-200 text-xs"
              />
              {salesSearch && (
                <button
                  onClick={() => setSalesSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {searchedSales.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
              No sales records found for this range
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50/50">
                    <th className="py-2.5 px-3">Invoice & Date</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Items Summary</th>
                    <th className="py-2.5 px-3 text-right">Method</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3 text-right">Due</th>
                    <th className="py-2.5 px-3 text-right">Est. Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  {searchedSales.map((inv) => {
                    const profit = inv.grandTotal - (inv.totalCost || 0);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{inv.invoiceNumber}</span>
                          <span className="text-[11px] text-slate-400">{inv.invoiceDate}</span>
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <span className="font-semibold text-slate-800 block truncate max-w-[140px]">
                            {inv.customerName}
                          </span>
                          <span className="text-[11px] text-slate-400">{inv.customerPhone}</span>
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <span className="text-slate-700 block truncate max-w-[180px]" title={inv.itemsSummary}>
                            {inv.itemsSummary}
                          </span>
                          <span className="text-[10px] text-slate-400">{inv.itemsCount} pcs</span>
                        </td>
                        <td className="py-3 px-3 text-right font-sans">
                          <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 font-medium">
                            {inv.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {formatBDT(inv.grandTotal, sym)}
                        </td>
                        <td className="py-3 px-3 text-right text-emerald-600 font-semibold">
                          {formatBDT(inv.paidAmount, sym)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {inv.dueAmount > 0 ? (
                            <span className="text-amber-600 font-bold">{formatBDT(inv.dueAmount, sym)}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-blue-600">
                          {formatBDT(profit, sym)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXPENSES & PURCHASES */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                3. Daily Expenses Log ({filteredExpenses.length} entries)
              </h3>
              <p className="text-xs text-slate-500">
                Detailed vouchers of operational expenditures during this period
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Total Expenses:</span>
              <p className="text-base font-bold text-amber-600 font-mono">
                {formatBDT(totalExpenses, sym)}
              </p>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
              No expenses recorded for this period
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50/50">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Expense Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Payment Method</th>
                    <th className="py-2.5 px-3">Notes</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 text-slate-600">{exp.expenseDate}</td>
                      <td className="py-3 px-3 font-sans font-semibold text-slate-900">{exp.title}</td>
                      <td className="py-3 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 font-medium text-slate-700">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-600">{exp.paymentMethod}</td>
                      <td className="py-3 px-3 font-sans text-slate-500">{exp.notes || '-'}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatBDT(exp.amount, sym)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PURCHASES */}
      {activeTab === 'purchases' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                4. Supplier Purchases ({filteredPurchases.length} invoices)
              </h3>
              <p className="text-xs text-slate-500">
                Restock orders and wholesale garment purchase records
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Total Purchases:</span>
              <p className="text-base font-bold text-slate-900 font-mono">
                {formatBDT(totalPurchasesInPeriod, sym)}
              </p>
            </div>
          </div>

          {filteredPurchases.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
              No purchase orders recorded for this period
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50/50">
                    <th className="py-2.5 px-3">Invoice & Date</th>
                    <th className="py-2.5 px-3">Supplier Name</th>
                    <th className="py-2.5 px-3">Items Summary</th>
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3 text-right">Due Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  {filteredPurchases.map((pur) => (
                    <tr key={pur.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{pur.invoiceNumber}</span>
                        <span className="text-[11px] text-slate-400">{pur.purchaseDate}</span>
                      </td>
                      <td className="py-3 px-3 font-sans font-semibold text-slate-900">
                        {pur.supplierName}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-600 truncate max-w-[200px]">
                        {pur.itemsSummary}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatBDT(pur.totalAmount, sym)}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-600 font-semibold">
                        {formatBDT(pur.paidAmount, sym)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {pur.dueAmount > 0 ? (
                          <span className="text-red-600 font-bold">{formatBDT(pur.dueAmount, sym)}</span>
                        ) : (
                          <span className="text-slate-400">Paid in Full</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: STOCK & CATEGORY VALUATION */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                5. Garment Categories Inventory & Stock Valuation
              </h3>
              <p className="text-xs text-slate-500">
                Real-time stock quantities and expected retail assets across categories
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
              <div>
                <span className="text-slate-500 block font-sans">Total Units:</span>
                <span className="font-bold text-slate-900">{totalStockUnits} pcs</span>
              </div>
              <div>
                <span className="text-slate-500 block font-sans">Cost Valuation:</span>
                <span className="font-bold text-slate-900">{formatBDT(totalStockCostVal, sym)}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-sans">Expected Retail:</span>
                <span className="font-bold text-emerald-600">{formatBDT(totalStockRetailVal, sym)}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50/50">
                  <th className="py-2.5 px-3">Garment Category</th>
                  <th className="py-2.5 px-3 text-right">SKUs</th>
                  <th className="py-2.5 px-3 text-right">Units in Stock</th>
                  <th className="py-2.5 px-3 text-right">Cost Value</th>
                  <th className="py-2.5 px-3 text-right">Retail Value</th>
                  <th className="py-2.5 px-3 text-right">Potential Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {allCategories.map((c) => {
                  const items = products.filter((p) => p.category === c.value);
                  const units = items.reduce((a, p) => a + p.stock, 0);
                  const costVal = items.reduce((a, p) => a + p.stock * p.purchasePrice, 0);
                  const retailVal = items.reduce((a, p) => a + p.stock * p.sellingPrice, 0);
                  const potentialProfit = retailVal - costVal;

                  return (
                    <tr key={c.value} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-sans font-semibold text-slate-900">
                        {c.label}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">{items.length}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {units} pcs
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        {formatBDT(costVal, sym)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-700">
                        {formatBDT(retailVal, sym)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-blue-600">
                        {formatBDT(potentialProfit, sym)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: DUES & LIABILITIES */}
      {activeTab === 'dues' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Dues */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>Customer Due Ledger</span>
                </h4>
                <p className="text-xs text-slate-500">Receivables owed by customers to the store</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500">Total Due:</span>
                <p className="text-sm font-bold text-amber-600 font-mono">
                  {formatBDT(totalCustomerDueAllTime, sym)}
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {customers.filter((c) => c.totalDue > 0).length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No outstanding customer dues
                </div>
              ) : (
                customers
                  .filter((c) => c.totalDue > 0)
                  .map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-slate-50 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{c.name}</p>
                        <p className="text-[11px] font-mono text-slate-500">{c.phone}</p>
                      </div>
                      <span className="font-mono font-bold text-sm text-amber-600">
                        {formatBDT(c.totalDue, sym)}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Supplier Payables */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-red-600" />
                  <span>Supplier Payables Ledger</span>
                </h4>
                <p className="text-xs text-slate-500">Wholesale amounts payable to suppliers</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500">Total Payable:</span>
                <p className="text-sm font-bold text-red-600 font-mono">
                  {formatBDT(totalSupplierPayableAllTime, sym)}
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {suppliers.filter((s) => s.totalPayable > 0).length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No outstanding supplier payables
                </div>
              ) : (
                suppliers
                  .filter((s) => s.totalPayable > 0)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl bg-slate-50 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{s.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {s.companyName ? `${s.companyName} · ` : ''}{s.phone}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-sm text-red-600">
                        {formatBDT(s.totalPayable, sym)}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
