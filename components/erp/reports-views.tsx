'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Wallet,
  Printer,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Search,
  ShoppingBag,
  CreditCard,
  Package,
  Users,
  Truck,
  ArrowLeft,
  Scale,
  Landmark,
  Clock,
  ArrowRight,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { useErp } from '@/context/erp-context';
import { formatBDT } from '@/lib/types';

/* ============================================================================
   REPORT VIEW (Interactive Report Hub with Individual Detailed Reports)
   ============================================================================ */
export type ReportModuleView =
  | 'hub'
  | 'daily'
  | 'balance-sheet'
  | 'profit-loss'
  | 'bank-accounts'
  | 'dues'
  | 'stock';

type DatePreset = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'all' | 'custom';

export function ReportView() {
  const [activeReport, setActiveReport] = useState<ReportModuleView>('hub');

  const {
    products,
    allCategories,
    salesInvoices,
    purchaseInvoices,
    expenses,
    customers,
    suppliers,
    storeSettings,
    ledgerTransactions,
  } = useErp();

  const sym = storeSettings.currencySymbol || '৳';

  // Quick Today Statistics for Hub Preview & Daily Report
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todaySalesInvoices = useMemo(
    () => salesInvoices.filter((i) => i.invoiceDate && i.invoiceDate.slice(0, 10) === todayStr),
    [salesInvoices, todayStr]
  );
  const todayGrossSales = useMemo(
    () => todaySalesInvoices.reduce((acc, i) => acc + i.grandTotal, 0),
    [todaySalesInvoices]
  );
  const todayCollectedSales = useMemo(
    () => todaySalesInvoices.reduce((acc, i) => acc + i.paidAmount, 0),
    [todaySalesInvoices]
  );
  const todayExpensesList = useMemo(
    () => expenses.filter((e) => e.expenseDate && e.expenseDate.slice(0, 10) === todayStr),
    [expenses, todayStr]
  );
  const todayTotalExpenses = useMemo(
    () => todayExpensesList.reduce((acc, e) => acc + e.amount, 0),
    [todayExpensesList]
  );

  // Real-time Overall Balances
  const totalCustomerDueAllTime = useMemo(
    () => customers.reduce((acc, c) => acc + c.totalDue, 0),
    [customers]
  );
  const totalSupplierPayableAllTime = useMemo(
    () => suppliers.reduce((acc, s) => acc + s.totalPayable, 0),
    [suppliers]
  );
  const totalStockUnits = useMemo(
    () => products.reduce((acc, p) => acc + p.stock, 0),
    [products]
  );
  const totalStockCostVal = useMemo(
    () => products.reduce((acc, p) => acc + p.stock * p.purchasePrice, 0),
    [products]
  );
  const totalStockRetailVal = useMemo(
    () => products.reduce((acc, p) => acc + p.stock * p.sellingPrice, 0),
    [products]
  );

  // Cash and Payment Channel Totals (All Time)
  const allTimePaymentBreakdown = useMemo(() => {
    const cashSales = salesInvoices.filter((i) => i.paymentMethod === 'Cash').reduce((a, i) => a + i.paidAmount, 0);
    const bkashSales = salesInvoices.filter((i) => i.paymentMethod === 'bKash').reduce((a, i) => a + i.paidAmount, 0);
    const nagadSales = salesInvoices.filter((i) => i.paymentMethod === 'Nagad').reduce((a, i) => a + i.paidAmount, 0);
    const cardSales = salesInvoices.filter((i) => i.paymentMethod === 'Card').reduce((a, i) => a + i.paidAmount, 0);

    const cashExpenses = expenses.filter((e) => e.paymentMethod === 'Cash').reduce((a, e) => a + e.amount, 0);

    const cashCustomerCollections = ledgerTransactions
      .filter((t) => t.type === 'CUSTOMER_DUE_COLLECTION' && t.paymentMethod === 'Cash')
      .reduce((a, t) => a + t.amount, 0);

    const netCashInRegister = Math.max(
      0,
      cashSales + cashCustomerCollections - cashExpenses
    );

    return {
      Cash: cashSales,
      bKash: bkashSales,
      Nagad: nagadSales,
      Card: cardSales,
      netCashInRegister,
    };
  }, [salesInvoices, expenses, purchaseInvoices, ledgerTransactions]);

  // Balance Sheet Equation Values
  const totalAssets = useMemo(() => {
    return (
      allTimePaymentBreakdown.netCashInRegister +
      allTimePaymentBreakdown.bKash +
      allTimePaymentBreakdown.Nagad +
      allTimePaymentBreakdown.Card +
      totalCustomerDueAllTime +
      totalStockCostVal
    );
  }, [allTimePaymentBreakdown, totalCustomerDueAllTime, totalStockCostVal]);

  const totalLiabilities = totalSupplierPayableAllTime;
  const netBusinessEquity = totalAssets - totalLiabilities;

  return (
    <div className="space-y-5">
      {/* Printable Letterhead (Only visible during print) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-3 mb-4">
        <h1 className="text-xl font-bold uppercase tracking-wider text-black">
          {storeSettings.storeName || 'ThreadCraft Apparel ERP'}
        </h1>
        <p className="text-xs text-slate-700">{storeSettings.address}</p>
        <p className="text-xs font-mono text-slate-700">Phone: {storeSettings.phone}</p>
        <div className="mt-2 text-xs font-semibold bg-slate-100 py-1 px-3 inline-block rounded">
          {activeReport === 'daily' && 'Daily Sales & Day Closing Report'}
          {activeReport === 'balance-sheet' && 'Balance Sheet Statement of Financial Position'}
          {activeReport === 'profit-loss' && 'Profit & Loss Statement (Income Statement)'}
          {activeReport === 'bank-accounts' && 'Bank & Payment Accounts Statement'}
          {activeReport === 'dues' && 'Dues & Liabilities Statement'}
          {activeReport === 'stock' && 'Merchandise Stock Valuation Report'}
          {activeReport === 'hub' && 'Complete Business Performance Summary'}
        </div>
      </div>

      {/* Top Header Bar when INSIDE a sub-report */}
      {activeReport !== 'hub' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveReport('hub')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              title="Back to Reports Hub"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All Reports Hub</span>
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {activeReport === 'daily' && 'Daily Sales & Day Closing Report'}
              {activeReport === 'balance-sheet' && 'Balance Sheet & Financial Position'}
              {activeReport === 'profit-loss' && 'Profit & Loss Income Statement'}
              {activeReport === 'bank-accounts' && 'Bank & Payment Accounts'}
              {activeReport === 'dues' && 'Dues & Liabilities Ledger'}
              {activeReport === 'stock' && 'Stock Valuation & Inventory Assets'}
            </h2>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {/* Quick Switch Dropdown for Mobile Convenience */}
            <select
              value={activeReport}
              onChange={(e) => setActiveReport(e.target.value as ReportModuleView)}
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="hub">← Reports Hub</option>
              <option value="daily">Daily Report</option>
              <option value="balance-sheet">Balance Sheet</option>
              <option value="profit-loss">Profit & Loss</option>
              <option value="bank-accounts">Bank & Accounts</option>
              <option value="dues">Dues & Liabilities</option>
              <option value="stock">Stock Valuation</option>
            </select>

            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: REPORT HUB (6 SEPARATE, BEAUTIFUL, MOBILE-OPTIMIZED CARDS)
          ========================================================================= */}
      {activeReport === 'hub' && (
        <div className="space-y-5">
          {/* Main Hub Welcome & Store Snapshot Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-indigo-200 mb-2.5 backdrop-blur-xs">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Next Fit Business Intelligence & Reports</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Financial Reports & Analytics Hub
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                  ব্যবসায়িক লাভ-ক্ষতি, ব্যালেন্স শিট, দৈনিক বিক্রি, ক্যাশ ও ব্যাংক হিসাবের পূর্ণাঙ্গ রিপোর্ট। নিচের যেকোনো কার্ডে ট্যাপ করে বিস্তারিত দেখুন।
                </p>
              </div>

              {/* Quick Overall Store Health Badges */}
              <div className="grid grid-cols-2 gap-2.5 shrink-0 font-mono tabular-nums text-xs">
                <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3">
                  <span className="font-sans text-[11px] text-indigo-200 block">Stock Asset Value</span>
                  <span className="font-bold text-sm sm:text-base text-white">
                    {formatBDT(totalStockCostVal, sym)}
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3">
                  <span className="font-sans text-[11px] text-emerald-300 block">Today&apos;s Sales</span>
                  <span className="font-bold text-sm sm:text-base text-emerald-400">
                    {formatBDT(todayGrossSales, sym)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 6 Individual Report Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* CARD 1: DAILY PERFORMANCE & DAY CLOSING REPORT */}
            <div
              onClick={() => setActiveReport('daily')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveReport('daily')}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-5 shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0 shadow-xs">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                    Today&apos;s Closing
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                    Daily Report (দৈনিক প্রতিবেদন)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    আজকের মোট বিক্রি, ক্যাশ ও ডিজিটাল কালেকশন, দোকান খরচ ও দিনের লাভ-ক্ষতি হিসাব।
                  </p>
                </div>

                {/* Card Quick Preview Stats */}
                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 font-mono text-xs tabular-nums border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-500">Today&apos;s Sales:</span>
                    <span className="font-bold text-slate-900">{formatBDT(todayGrossSales, sym)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-500">Collected Cash:</span>
                    <span className="font-bold text-emerald-600">{formatBDT(todayCollectedSales, sym)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-500">Daily Expenses:</span>
                    <span className="font-bold text-amber-600">-{formatBDT(todayTotalExpenses, sym)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                <span>View Daily Closing Report</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* CARD 2: BALANCE SHEET & FINANCIAL POSITION */}
            <div
              onClick={() => setActiveReport('balance-sheet')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveReport('balance-sheet')}
              className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 p-5 shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0 shadow-xs">
                    <Scale className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    GAAP Balanced
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition-colors">
                    Balance Sheet (ব্যালেন্স শিট)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    দোকানের মোট বর্তমান সম্পদ (Assets), দায়-দেনা (Liabilities) এবং নেট মালিকানা স্বত্ব (Equity)।
                  </p>
                </div>

                {/* Card Quick Preview Stats */}
                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 font-mono text-xs tabular-nums border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-500">Total Assets:</span>
                    <span className="font-bold text-slate-900">{formatBDT(totalAssets, sym)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-500">Total Liabilities:</span>
                    <span className="font-bold text-red-600">{formatBDT(totalLiabilities, sym)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-500">Net Business Worth:</span>
                    <span className="font-bold text-emerald-600">{formatBDT(netBusinessEquity, sym)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
                <span>View Full Balance Sheet</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* CARD 3: PROFIT & LOSS INCOME STATEMENT */}
            <div
              onClick={() => setActiveReport('profit-loss')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveReport('profit-loss')}
              className="bg-white rounded-2xl border border-slate-200 hover:border-purple-400 p-5 shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0 shadow-xs">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
                    Income Statement
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-purple-600 transition-colors">
                    Profit & Loss (লাভ-ক্ষতি বিবরণী)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    তারিখ অনুযায়ী বিক্রয় রাজস্ব, কাপড়ের ক্রয়মূল্য (COGS), মোট দোকান খরচ ও নিট মুনাফা মার্জিন।
                  </p>
                </div>

                {/* Card Quick Preview Stats */}
                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 font-mono text-xs tabular-nums border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-500">Gross Sales Revenue:</span>
                    <span className="font-bold text-slate-900">
                      {formatBDT(salesInvoices.reduce((a, i) => a + i.grandTotal, 0), sym)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-500">Total Operating Expenses:</span>
                    <span className="font-bold text-amber-600">
                      -{formatBDT(expenses.reduce((a, e) => a + e.amount, 0), sym)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-500">Report Filter:</span>
                    <span className="font-bold text-purple-700 font-sans">Date Range Filterable</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-semibold text-purple-600 group-hover:text-purple-700">
                <span>View Profit & Loss Report</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* CARD 4: BANK & PAYMENT ACCOUNTS */}
            <div
              onClick={() => setActiveReport('bank-accounts')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveReport('bank-accounts')}
              className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400 p-5 shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shrink-0 shadow-xs">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                    Payment Channels
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition-colors">
                    Bank & Accounts (ব্যাংক ও ক্যাশ তালিকা)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    ক্যাশ কাউন্টার, বিকাশ মার্চেন্ট, নগদ ও ব্যাংক কার্ডের কালেকশন ও ব্যালেন্স বিবরণী।
                  </p>
                </div>

                {/* Card Quick Preview Stats */}
                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 font-mono text-xs tabular-nums border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-500">Cash in Drawer:</span>
                    <span className="font-bold text-slate-900">
                      {formatBDT(allTimePaymentBreakdown.netCashInRegister, sym)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-500">bKash Receipts:</span>
                    <span className="font-bold text-pink-600">
                      {formatBDT(allTimePaymentBreakdown.bKash, sym)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-500">Nagad + Card POS:</span>
                    <span className="font-bold text-orange-600">
                      {formatBDT(allTimePaymentBreakdown.Nagad + allTimePaymentBreakdown.Card, sym)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-semibold text-amber-600 group-hover:text-amber-700">
                <span>View Bank & Payment Accounts</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* CARD 5: DUES & LIABILITIES */}
            <div
              onClick={() => setActiveReport('dues')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveReport('dues')}
              className="bg-white rounded-2xl border border-slate-200 hover:border-rose-400 p-5 shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0 shadow-xs">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
                    Accounts Due
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-rose-600 transition-colors">
                    Dues & Liabilities (বাকি ও দেনা রিপোর্ট)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    কাস্টমারদের কাছে মোট পাওনা বকেয়া এবং কাপড় সাপ্লায়ারদের প্রদেয় দেনার খতিয়ান।
                  </p>
                </div>

                {/* Card Quick Preview Stats */}
                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 font-mono text-xs tabular-nums border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-500">Customer Dues (Receivable):</span>
                    <span className="font-bold text-amber-600">{formatBDT(totalCustomerDueAllTime, sym)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-500">Supplier Dues (Payable):</span>
                    <span className="font-bold text-red-600">{formatBDT(totalSupplierPayableAllTime, sym)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-500">Active Debtors:</span>
                    <span className="font-bold text-slate-900 font-sans">
                      {customers.filter((c) => c.totalDue > 0).length} customers
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-semibold text-rose-600 group-hover:text-rose-700">
                <span>View Dues & Liabilities Statement</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* CARD 6: STOCK VALUATION & INVENTORY ASSETS */}
            <div
              onClick={() => setActiveReport('stock')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveReport('stock')}
              className="bg-white rounded-2xl border border-slate-200 hover:border-cyan-400 p-5 shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors shrink-0 shadow-xs">
                    <Package className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200/60">
                    Stock Assets
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-cyan-600 transition-colors">
                    Stock Valuation (মজুদ পণ্যের মূল্যায়ন)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    পোশাক ক্যাটাগরিভিত্তিক মজুদ পরিমাণ, পাইকারি ক্রয়মূল্য ইনভেস্টমেন্ট ও সম্ভাব্য বিক্রয়মূল্য।
                  </p>
                </div>

                {/* Card Quick Preview Stats */}
                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 font-mono text-xs tabular-nums border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-500">Stock Inventory Units:</span>
                    <span className="font-bold text-slate-900">{totalStockUnits} pcs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-500">Wholesale Cost Value:</span>
                    <span className="font-bold text-slate-900">{formatBDT(totalStockCostVal, sym)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-500">Expected Retail Value:</span>
                    <span className="font-bold text-emerald-600">{formatBDT(totalStockRetailVal, sym)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-semibold text-cyan-600 group-hover:text-cyan-700">
                <span>View Stock Valuation Report</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: DAILY REPORT & DAY CLOSING VIEW
          ========================================================================= */}
      {activeReport === 'daily' && (
        <DailyReportViewInner
          salesInvoices={salesInvoices}
          expenses={expenses}
          sym={sym}
        />
      )}

      {/* =========================================================================
          VIEW 3: BALANCE SHEET STATEMENT
          ========================================================================= */}
      {activeReport === 'balance-sheet' && (
        <BalanceSheetViewInner
          totalAssets={totalAssets}
          totalLiabilities={totalLiabilities}
          netBusinessEquity={netBusinessEquity}
          cashInRegister={allTimePaymentBreakdown.netCashInRegister}
          bKashBalance={allTimePaymentBreakdown.bKash}
          nagadBalance={allTimePaymentBreakdown.Nagad}
          cardBalance={allTimePaymentBreakdown.Card}
          customerReceivables={totalCustomerDueAllTime}
          supplierPayables={totalSupplierPayableAllTime}
          stockCostVal={totalStockCostVal}
          stockRetailVal={totalStockRetailVal}
          sym={sym}
        />
      )}

      {/* =========================================================================
          VIEW 4: PROFIT & LOSS INCOME STATEMENT
          ========================================================================= */}
      {activeReport === 'profit-loss' && (
        <ProfitLossViewInner
          salesInvoices={salesInvoices}
          expenses={expenses}
          sym={sym}
        />
      )}

      {/* =========================================================================
          VIEW 5: BANK & PAYMENT ACCOUNTS VIEW
          ========================================================================= */}
      {activeReport === 'bank-accounts' && (
        <BankAccountsViewInner
          salesInvoices={salesInvoices}
          expenses={expenses}
          ledgerTransactions={ledgerTransactions}
          sym={sym}
        />
      )}

      {/* =========================================================================
          VIEW 6: DUES & LIABILITIES STATEMENT
          ========================================================================= */}
      {activeReport === 'dues' && (
        <DuesLiabilitiesViewInner
          customers={customers}
          suppliers={suppliers}
          totalCustomerDue={totalCustomerDueAllTime}
          totalSupplierPayable={totalSupplierPayableAllTime}
          sym={sym}
        />
      )}

      {/* =========================================================================
          VIEW 7: STOCK VALUATION & INVENTORY ASSETS
          ========================================================================= */}
      {activeReport === 'stock' && (
        <StockValuationViewInner
          products={products}
          allCategories={allCategories}
          totalStockUnits={totalStockUnits}
          totalStockCostVal={totalStockCostVal}
          totalStockRetailVal={totalStockRetailVal}
          sym={sym}
        />
      )}
    </div>
  );
}

/* ============================================================================
   SUB-COMPONENT: DAILY REPORT VIEW INNER
   ============================================================================ */
function DailyReportViewInner({
  salesInvoices,
  expenses,
  sym,
}: {
  salesInvoices: any[];
  expenses: any[];
  sym: string;
}) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [dailyPage, setDailyPage] = useState(1);
  const dailyPageSize = 8;

  const daySales = useMemo(
    () => salesInvoices.filter((i) => i.invoiceDate && i.invoiceDate.slice(0, 10) === selectedDate),
    [salesInvoices, selectedDate]
  );
  const dayExpenses = useMemo(
    () => expenses.filter((e) => e.expenseDate && e.expenseDate.slice(0, 10) === selectedDate),
    [expenses, selectedDate]
  );

  const dayGrossSales = daySales.reduce((a, i) => a + i.grandTotal, 0);
  const dayCollected = daySales.reduce((a, i) => a + i.paidAmount, 0);
  const dayDueCreated = daySales.reduce((a, i) => a + i.dueAmount, 0);
  const dayCOGS = daySales.reduce((a, i) => a + (i.totalCost || 0), 0);
  const dayGrossProfit = dayGrossSales - dayCOGS;
  const dayTotalExpenses = dayExpenses.reduce((a, e) => a + e.amount, 0);
  const dayNetProfit = dayGrossProfit - dayTotalExpenses;

  const dayPaymentMethods = useMemo(() => {
    return {
      Cash: daySales.filter((i) => i.paymentMethod === 'Cash').reduce((a, i) => a + i.paidAmount, 0),
      bKash: daySales.filter((i) => i.paymentMethod === 'bKash').reduce((a, i) => a + i.paidAmount, 0),
      Nagad: daySales.filter((i) => i.paymentMethod === 'Nagad').reduce((a, i) => a + i.paidAmount, 0),
      Card: daySales.filter((i) => i.paymentMethod === 'Card').reduce((a, i) => a + i.paidAmount, 0),
    };
  }, [daySales]);

  const filteredInvoices = useMemo(() => {
    if (!invoiceSearch.trim()) return daySales;
    const q = invoiceSearch.toLowerCase();
    return daySales.filter(
      (i) =>
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.customerName.toLowerCase().includes(q) ||
        (i.customerPhone && i.customerPhone.includes(q))
    );
  }, [daySales, invoiceSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / dailyPageSize));
  const pagedInvoices = filteredInvoices.slice((dailyPage - 1) * dailyPageSize, dailyPage * dailyPageSize);

  return (
    <div className="space-y-4">
      {/* Date Selector Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-base">
            Day Closing Summary ({selectedDate})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select any date to view historical day-closing sales, expenses, and cash breakdown
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setDailyPage(1);
            }}
            className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
          />
          <button
            type="button"
            onClick={() => {
              setSelectedDate(new Date().toISOString().slice(0, 10));
              setDailyPage(1);
            }}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold whitespace-nowrap active:scale-95 transition-all"
          >
            Today
          </button>
        </div>
      </div>

      {/* Daily KPI Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono tabular-nums">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="font-sans text-xs text-slate-500 block">Day Sales ({daySales.length} bills)</span>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {formatBDT(dayGrossSales, sym)}
          </p>
          <p className="text-[11px] font-sans text-emerald-600 font-semibold mt-1">
            Collected: {formatBDT(dayCollected, sym)}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="font-sans text-xs text-slate-500 block">New Customer Due</span>
          <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">
            {formatBDT(dayDueCreated, sym)}
          </p>
          <p className="text-[11px] font-sans text-slate-400 mt-1">
            Billed on credit today
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="font-sans text-xs text-slate-500 block">Day Expenses ({dayExpenses.length} items)</span>
          <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1">
            {formatBDT(dayTotalExpenses, sym)}
          </p>
          <p className="text-[11px] font-sans text-slate-400 mt-1">
            Operational costs paid
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="font-sans text-xs text-slate-500 block">Day Estimated Net Profit</span>
          <p
            className={`text-xl sm:text-2xl font-bold mt-1 ${
              dayNetProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {formatBDT(dayNetProfit, sym)}
          </p>
          <p className="text-[11px] font-sans text-slate-400 mt-1">
            After COGS & expenses
          </p>
        </div>
      </div>

      {/* Payment Channel Breakdown for the Selected Day */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <span>Payment Collection Channels for {selectedDate}</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs tabular-nums">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-sans text-slate-500 block text-[11px]">Cash in Hand</span>
            <span className="font-bold text-slate-900 text-sm">{formatBDT(dayPaymentMethods.Cash, sym)}</span>
          </div>
          <div className="p-3 rounded-xl bg-pink-50/60 border border-pink-100">
            <span className="font-sans text-pink-700 block text-[11px]">bKash Received</span>
            <span className="font-bold text-pink-800 text-sm">{formatBDT(dayPaymentMethods.bKash, sym)}</span>
          </div>
          <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-100">
            <span className="font-sans text-orange-700 block text-[11px]">Nagad Received</span>
            <span className="font-bold text-orange-800 text-sm">{formatBDT(dayPaymentMethods.Nagad, sym)}</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="font-sans text-blue-700 block text-[11px]">Card / POS Received</span>
            <span className="font-bold text-blue-800 text-sm">{formatBDT(dayPaymentMethods.Card, sym)}</span>
          </div>
        </div>
      </div>

      {/* Daily Invoices Register */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-slate-700" />
            <span>Invoices Generated on {selectedDate} ({daySales.length} bills)</span>
          </h4>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={invoiceSearch}
              onChange={(e) => {
                setInvoiceSearch(e.target.value);
                setDailyPage(1);
              }}
              placeholder="Search invoice or customer..."
              className="w-full min-h-[38px] pl-8 pr-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No sales invoices found for {selectedDate}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Mobile Touch Cards */}
            <div className="space-y-2.5 sm:hidden">
              {pagedInvoices.map((inv) => (
                <div key={inv.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1 text-xs">
                  <div className="flex justify-between items-start font-mono font-bold text-slate-900">
                    <span>{inv.invoiceNumber}</span>
                    <span>{formatBDT(inv.grandTotal, sym)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>{inv.customerName}</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px]">
                      {inv.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] pt-1 border-t border-slate-200/60 font-mono">
                    <span className="text-emerald-600 font-semibold">Paid: {formatBDT(inv.paidAmount, sym)}</span>
                    {inv.dueAmount > 0 && (
                      <span className="text-amber-600 font-bold">Due: {formatBDT(inv.dueAmount, sym)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50">
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3 text-right">Grand Total</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3 text-right">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  {pagedInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-800">{inv.customerName}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                          {inv.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatBDT(inv.grandTotal, sym)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">
                        {formatBDT(inv.paidAmount, sym)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {inv.dueAmount > 0 ? (
                          <span className="text-amber-600 font-bold">{formatBDT(inv.dueAmount, sym)}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 font-mono">
                  Page {dailyPage} of {totalPages} ({filteredInvoices.length} invoices)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={dailyPage <= 1}
                    onClick={() => setDailyPage((p) => Math.max(1, p - 1))}
                    className="min-h-[38px] px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Prev</span>
                  </button>
                  <span className="px-2 font-mono font-bold text-slate-800">{dailyPage}/{totalPages}</span>
                  <button
                    type="button"
                    disabled={dailyPage >= totalPages}
                    onClick={() => setDailyPage((p) => Math.min(totalPages, p + 1))}
                    className="min-h-[38px] px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Daily Expenses Breakdown */}
      {dayExpenses.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-600" />
            <span>Expenses Recorded on {selectedDate} ({dayExpenses.length} entries)</span>
          </h4>
          <div className="divide-y divide-slate-100 text-xs">
            {dayExpenses.map((e) => (
              <div key={e.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{e.title}</p>
                  <p className="text-[11px] text-slate-400">
                    Category: {e.category} · Paid via {e.paymentMethod}
                  </p>
                </div>
                <span className="font-mono font-bold text-red-600 text-sm">
                  -{formatBDT(e.amount, sym)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   SUB-COMPONENT: BALANCE SHEET STATEMENT INNER
   ============================================================================ */
function BalanceSheetViewInner({
  totalAssets,
  totalLiabilities,
  netBusinessEquity,
  cashInRegister,
  bKashBalance,
  nagadBalance,
  cardBalance,
  customerReceivables,
  supplierPayables,
  stockCostVal,
  stockRetailVal,
  sym,
}: {
  totalAssets: number;
  totalLiabilities: number;
  netBusinessEquity: number;
  cashInRegister: number;
  bKashBalance: number;
  nagadBalance: number;
  cardBalance: number;
  customerReceivables: number;
  supplierPayables: number;
  stockCostVal: number;
  stockRetailVal: number;
  sym: string;
}) {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* Formal Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              Statement of Financial Position
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Classified Balance Sheet (সার্বিক উদ্বৃত্তপত্র)
            </h3>
            <p className="text-xs text-slate-500">
              As of {currentDate} · Double-Entry Standard Format
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold self-start sm:self-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Accounting Equation Balanced</span>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          Financial Equation: <strong>Assets ({formatBDT(totalAssets, sym)})</strong> = <strong>Liabilities ({formatBDT(totalLiabilities, sym)})</strong> + <strong>Owner&apos;s Equity ({formatBDT(netBusinessEquity, sym)})</strong>
        </p>
      </div>

      {/* Main Double-Column Layout (Assets vs Liabilities & Equity) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT COLUMN: ASSETS (সম্পদসমূহ) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b-2 border-emerald-500 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                A
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">TOTAL ASSETS</h4>
                <p className="text-[11px] text-slate-500">মোট বর্তমান সম্পদসমূহ</p>
              </div>
            </div>
            <span className="font-mono font-black text-lg text-emerald-700">
              {formatBDT(totalAssets, sym)}
            </span>
          </div>

          <div className="divide-y divide-slate-100 font-mono text-xs tabular-nums space-y-2.5 pt-1">
            {/* 1. Cash in Hand */}
            <div className="pt-2 flex justify-between items-center">
              <div>
                <span className="font-sans font-semibold text-slate-900 block">
                  1. Cash in Hand / Drawer Register
                </span>
                <span className="font-sans text-[11px] text-slate-400">
                  Physical currency available in showroom cash counter
                </span>
              </div>
              <span className="font-bold text-slate-900">{formatBDT(cashInRegister, sym)}</span>
            </div>

            {/* 2. Digital Accounts & Bank */}
            <div className="pt-2 flex justify-between items-center">
              <div>
                <span className="font-sans font-semibold text-slate-900 block">
                  2. Digital Payments & Bank Balance
                </span>
                <span className="font-sans text-[11px] text-slate-400">
                  bKash ({formatBDT(bKashBalance, sym)}), Nagad ({formatBDT(nagadBalance, sym)}), Card ({formatBDT(cardBalance, sym)})
                </span>
              </div>
              <span className="font-bold text-slate-900">
                {formatBDT(bKashBalance + nagadBalance + cardBalance, sym)}
              </span>
            </div>

            {/* 3. Accounts Receivable */}
            <div className="pt-2 flex justify-between items-center">
              <div>
                <span className="font-sans font-semibold text-slate-900 block">
                  3. Accounts Receivable (Customer Dues)
                </span>
                <span className="font-sans text-[11px] text-slate-400">
                  Total credit outstanding from customers
                </span>
              </div>
              <span className="font-bold text-amber-600">{formatBDT(customerReceivables, sym)}</span>
            </div>

            {/* 4. Merchandise Stock Inventory */}
            <div className="pt-2 flex justify-between items-center">
              <div>
                <span className="font-sans font-semibold text-slate-900 block">
                  4. Merchandise Inventory Asset
                </span>
                <span className="font-sans text-[11px] text-slate-400">
                  Wholesale purchase cost valuation (Retail: {formatBDT(stockRetailVal, sym)})
                </span>
              </div>
              <span className="font-bold text-blue-700">{formatBDT(stockCostVal, sym)}</span>
            </div>

            {/* Total Assets Summary Box */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex justify-between items-center font-bold text-sm text-emerald-900">
              <span className="font-sans">Sum of All Current Assets:</span>
              <span className="text-base">{formatBDT(totalAssets, sym)}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIABILITIES & OWNER'S EQUITY (দায় ও মালিকানা স্বত্ব) */}
        <div className="space-y-4">
          {/* LIABILITIES */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b-2 border-red-500 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  L
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">TOTAL LIABILITIES</h4>
                  <p className="text-[11px] text-slate-500">মোট বর্তমান দায় ও দেনাসমূহ</p>
                </div>
              </div>
              <span className="font-mono font-black text-lg text-red-600">
                {formatBDT(totalLiabilities, sym)}
              </span>
            </div>

            <div className="divide-y divide-slate-100 font-mono text-xs tabular-nums space-y-2.5 pt-1">
              <div className="pt-2 flex justify-between items-center">
                <div>
                  <span className="font-sans font-semibold text-slate-900 block">
                    1. Accounts Payable (Supplier Dues)
                  </span>
                  <span className="font-sans text-[11px] text-slate-400">
                    Amounts payable to wholesale garment suppliers
                  </span>
                </div>
                <span className="font-bold text-red-600">{formatBDT(supplierPayables, sym)}</span>
              </div>

              <div className="p-3 rounded-xl bg-red-50/70 border border-red-200 flex justify-between items-center font-bold text-sm text-red-900">
                <span className="font-sans">Total Current Liabilities:</span>
                <span className="text-base">{formatBDT(totalLiabilities, sym)}</span>
              </div>
            </div>
          </div>

          {/* OWNER'S EQUITY */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b-2 border-indigo-500 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  E
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">OWNER&apos;S EQUITY</h4>
                  <p className="text-[11px] text-slate-500">মালিকানা স্বত্ব / নিট ব্যবসার মূল্য</p>
                </div>
              </div>
              <span className="font-mono font-black text-lg text-indigo-700">
                {formatBDT(netBusinessEquity, sym)}
              </span>
            </div>

            <div className="divide-y divide-slate-100 font-mono text-xs tabular-nums space-y-2.5 pt-1">
              <div className="pt-2 flex justify-between items-center">
                <div>
                  <span className="font-sans font-semibold text-slate-900 block">
                    Net Capital Worth (Assets - Liabilities)
                  </span>
                  <span className="font-sans text-[11px] text-slate-400">
                    Total tangible value owned by the business
                  </span>
                </div>
                <span className="font-bold text-indigo-700">{formatBDT(netBusinessEquity, sym)}</span>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 flex justify-between items-center font-bold text-sm text-indigo-900">
                <span className="font-sans">Total Liabilities & Equity:</span>
                <span className="text-base">{formatBDT(totalLiabilities + netBusinessEquity, sym)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   SUB-COMPONENT: PROFIT & LOSS INCOME STATEMENT INNER
   ============================================================================ */
function ProfitLossViewInner({
  salesInvoices,
  expenses,
  sym,
}: {
  salesInvoices: any[];
  expenses: any[];
  sym: string;
}) {
  const [preset, setPreset] = useState<DatePreset>('thisMonth');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [pnlPage, setPnlPage] = useState(1);
  const pnlPageSize = 8;

  const { startDate, endDate, periodLabel } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (preset === 'today') {
      return { startDate: todayStr, endDate: todayStr, periodLabel: "Today's Statement" };
    }
    if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().slice(0, 10);
      return { startDate: yStr, endDate: yStr, periodLabel: "Yesterday's Statement" };
    }
    if (preset === 'thisWeek') {
      const w = new Date(today);
      w.setDate(w.getDate() - 6);
      return { startDate: w.toISOString().slice(0, 10), endDate: todayStr, periodLabel: 'Last 7 Days (This Week)' };
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
    return { startDate: '', endDate: '', periodLabel: 'All-Time Cumulative Statement' };
  }, [preset, customStart, customEnd]);

  const isDateInRange = (recordDate?: string) => {
    if (!recordDate) return false;
    const d = recordDate.slice(0, 10);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  };

  const filteredSales = useMemo(
    () => salesInvoices.filter((i) => isDateInRange(i.invoiceDate)),
    [salesInvoices, startDate, endDate]
  );
  const filteredExpenses = useMemo(
    () => expenses.filter((e) => isDateInRange(e.expenseDate)),
    [expenses, startDate, endDate]
  );

  const grossSales = filteredSales.reduce((a, i) => a + i.grandTotal, 0);
  const totalCOGS = filteredSales.reduce((a, i) => a + (i.totalCost || 0), 0);
  const grossProfit = grossSales - totalCOGS;
  const grossMarginPct = grossSales > 0 ? ((grossProfit / grossSales) * 100).toFixed(1) : '0.0';

  const totalExpenses = filteredExpenses.reduce((a, e) => a + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const netMarginPct = grossSales > 0 ? ((netProfit / grossSales) * 100).toFixed(1) : '0.0';

  const searchedSales = useMemo(() => {
    if (!invoiceSearch.trim()) return filteredSales;
    const q = invoiceSearch.toLowerCase();
    return filteredSales.filter(
      (s) =>
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        (s.customerPhone && s.customerPhone.includes(q))
    );
  }, [filteredSales, invoiceSearch]);

  const totalPages = Math.max(1, Math.ceil(searchedSales.length / pnlPageSize));
  const pagedSales = searchedSales.slice((pnlPage - 1) * pnlPageSize, pnlPage * pnlPageSize);

  return (
    <div className="space-y-4">
      {/* Date Presets Row */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Profit & Loss Income Statement
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Active Period: <strong className="text-slate-800">{periodLabel}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
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
                type="button"
                onClick={() => {
                  setPreset(p.id);
                  setPnlPage(1);
                }}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  preset === p.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {preset === 'custom' && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => {
                  setCustomStart(e.target.value);
                  setPnlPage(1);
                }}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => {
                  setCustomEnd(e.target.value);
                  setPnlPage(1);
                }}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Structured Income Statement Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2.5">
          Step-by-Step Income Calculation ({periodLabel})
        </h4>

        <div className="divide-y divide-slate-100 text-xs sm:text-sm font-mono tabular-nums">
          <div className="py-3 flex justify-between items-center">
            <div>
              <span className="font-sans font-semibold text-slate-900">
                (+) Gross Sales Revenue
              </span>
              <span className="block font-sans text-[11px] text-slate-400">
                Total billed sales from {filteredSales.length} invoices
              </span>
            </div>
            <span className="font-bold text-slate-900">{formatBDT(grossSales, sym)}</span>
          </div>

          <div className="py-3 flex justify-between items-center bg-slate-50/50 -mx-3 px-3 rounded-lg">
            <div>
              <span className="font-sans font-medium text-slate-700">
                (-) Cost of Goods Sold (COGS)
              </span>
              <span className="block font-sans text-[11px] text-slate-400">
                Direct wholesale purchase cost of sold garments
              </span>
            </div>
            <span className="font-bold text-red-600">-{formatBDT(totalCOGS, sym)}</span>
          </div>

          <div className="py-3 flex justify-between items-center bg-blue-50/40 -mx-3 px-3 rounded-lg">
            <div>
              <span className="font-sans font-bold text-blue-900">
                (=) Gross Trading Profit
              </span>
              <span className="block font-sans text-[11px] text-blue-700">
                Gross Margin: {grossMarginPct}%
              </span>
            </div>
            <span className="font-bold text-blue-700 text-base">{formatBDT(grossProfit, sym)}</span>
          </div>

          <div className="py-3 flex justify-between items-center bg-slate-50/50 -mx-3 px-3 rounded-lg">
            <div>
              <span className="font-sans font-medium text-slate-700">
                (-) Operational & Daily Expenses
              </span>
              <span className="block font-sans text-[11px] text-slate-400">
                Shop rent, utilities, wages, refreshments ({filteredExpenses.length} entries)
              </span>
            </div>
            <span className="font-bold text-amber-600">-{formatBDT(totalExpenses, sym)}</span>
          </div>

          <div
            className={`py-4 flex justify-between items-center -mx-3 px-3 rounded-xl border-2 ${
              netProfit >= 0 ? 'bg-emerald-50/90 border-emerald-500' : 'bg-red-50/90 border-red-500'
            }`}
          >
            <div>
              <span className="font-sans font-black text-base text-slate-900 block">
                (=) Net Showroom Profit / Loss
              </span>
              <span className="font-sans text-xs text-slate-600">
                Final bottom-line net earnings (Net Margin: {netMarginPct}%)
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

      {/* Filtered Sales Register Table with Search & Pagination */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="font-bold text-slate-900 text-sm">
            Sales Invoices Register ({filteredSales.length} bills)
          </h4>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={invoiceSearch}
              onChange={(e) => {
                setInvoiceSearch(e.target.value);
                setPnlPage(1);
              }}
              placeholder="Search invoice or customer..."
              className="w-full min-h-[38px] pl-8 pr-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        {searchedSales.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No sales invoices found for this period
          </div>
        ) : (
          <div className="space-y-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50">
                    <th className="py-2.5 px-3">Invoice & Date</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3 text-right">Est. Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  {pagedSales.map((inv) => {
                    const profit = inv.grandTotal - (inv.totalCost || 0);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {inv.invoiceNumber}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {inv.invoiceDate}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-800">{inv.customerName}</td>
                        <td className="py-2.5 px-3 font-sans">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                            {inv.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatBDT(inv.grandTotal, sym)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">
                          {formatBDT(inv.paidAmount, sym)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-600">
                          {formatBDT(profit, sym)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 font-mono">
                  Page {pnlPage} of {totalPages} ({searchedSales.length} invoices)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={pnlPage <= 1}
                    onClick={() => setPnlPage((p) => Math.max(1, p - 1))}
                    className="min-h-[38px] px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Prev</span>
                  </button>
                  <span className="px-2 font-mono font-bold text-slate-800">{pnlPage}/{totalPages}</span>
                  <button
                    type="button"
                    disabled={pnlPage >= totalPages}
                    onClick={() => setPnlPage((p) => Math.min(totalPages, p + 1))}
                    className="min-h-[38px] px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   SUB-COMPONENT: BANK & PAYMENT ACCOUNTS INNER
   ============================================================================ */
function BankAccountsViewInner({
  salesInvoices,
  expenses,
  ledgerTransactions,
  sym,
}: {
  salesInvoices: any[];
  expenses: any[];
  ledgerTransactions: any[];
  sym: string;
}) {
  const [selectedChannel, setSelectedChannel] = useState<'ALL' | 'Cash' | 'bKash' | 'Nagad' | 'Card'>('ALL');

  // Breakdown metrics
  const channels = useMemo(() => {
    const list = ['Cash', 'bKash', 'Nagad', 'Card'] as const;
    return list.map((ch) => {
      const salesInflow = salesInvoices
        .filter((i) => i.paymentMethod === ch)
        .reduce((a, i) => a + i.paidAmount, 0);

      const dueInflow = ledgerTransactions
        .filter((t) => t.type === 'CUSTOMER_DUE_COLLECTION' && t.paymentMethod === ch)
        .reduce((a, t) => a + t.amount, 0);

      const totalInflow = salesInflow + dueInflow;

      const expenseOutflow = expenses
        .filter((e) => e.paymentMethod === ch)
        .reduce((a, e) => a + e.amount, 0);

      const supplierOutflow = ledgerTransactions
        .filter((t) => t.type === 'SUPPLIER_PAYMENT' && t.paymentMethod === ch)
        .reduce((a, t) => a + t.amount, 0);

      const totalOutflow = expenseOutflow + supplierOutflow;
      const netBalance = totalInflow - totalOutflow;

      return {
        id: ch,
        label: ch === 'Cash' ? 'Cash Counter Drawer' : ch === 'Card' ? 'Card / Bank POS' : `${ch} Merchant`,
        totalInflow,
        totalOutflow,
        netBalance,
        salesCount: salesInvoices.filter((i) => i.paymentMethod === ch).length,
      };
    });
  }, [salesInvoices, expenses, ledgerTransactions]);

  return (
    <div className="space-y-4">
      {/* 4 Payment Channel Account Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className={`p-4 rounded-2xl border transition-all ${
              ch.id === 'Cash'
                ? 'bg-slate-900 text-white border-slate-800'
                : ch.id === 'bKash'
                ? 'bg-pink-50 border-pink-200 text-pink-950'
                : ch.id === 'Nagad'
                ? 'bg-orange-50 border-orange-200 text-orange-950'
                : 'bg-blue-50 border-blue-200 text-blue-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">{ch.id}</span>
              <Landmark className="w-4 h-4 opacity-70" />
            </div>
            <p className="font-bold text-sm mt-1">{ch.label}</p>
            <div className="mt-2">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block font-sans">
                Net Available Balance
              </span>
              <p className="text-xl font-black font-mono tabular-nums">
                {formatBDT(Math.max(0, ch.netBalance), sym)}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-black/10 dark:border-white/10 text-[11px] font-mono flex justify-between items-center">
              <span>Inflow: <strong>+{formatBDT(ch.totalInflow, sym)}</strong></span>
              <span>Expenses: <strong>-{formatBDT(ch.totalOutflow, sym)}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Channel Details Statement */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-bold text-slate-900 text-base">
              Payment Account Transaction Statements
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter incoming receipts and outgoing expenditures by channel
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {(['ALL', 'Cash', 'bKash', 'Nagad', 'Card'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSelectedChannel(mode)}
                className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedChannel === mode
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mode === 'ALL' ? 'All Channels' : mode}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sales Collections */}
          <div className="space-y-2">
            <h5 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
              <span>Inflow from Sales ({selectedChannel})</span>
            </h5>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {salesInvoices
                .filter((i) => selectedChannel === 'ALL' || i.paymentMethod === selectedChannel)
                .slice(0, 15)
                .map((inv) => (
                  <div key={inv.id} className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="font-bold text-slate-900 block">{inv.invoiceNumber}</span>
                      <span className="text-[10px] font-sans text-slate-500">
                        {inv.customerName} · {inv.paymentMethod}
                      </span>
                    </div>
                    <span className="font-bold text-emerald-600">
                      +{formatBDT(inv.paidAmount, sym)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Expenses Outflows */}
          <div className="space-y-2">
            <h5 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-red-600" />
              <span>Outflow via Expenses ({selectedChannel})</span>
            </h5>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {expenses
                .filter((e) => selectedChannel === 'ALL' || e.paymentMethod === selectedChannel)
                .slice(0, 15)
                .map((exp) => (
                  <div key={exp.id} className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="font-bold text-slate-900 font-sans block truncate max-w-[160px]">
                        {exp.title}
                      </span>
                      <span className="text-[10px] font-sans text-slate-500">
                        {exp.category} · {exp.paymentMethod}
                      </span>
                    </div>
                    <span className="font-bold text-red-600">
                      -{formatBDT(exp.amount, sym)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   SUB-COMPONENT: DUES & LIABILITIES STATEMENT INNER
   ============================================================================ */
function DuesLiabilitiesViewInner({
  customers,
  suppliers,
  totalCustomerDue,
  totalSupplierPayable,
  sym,
}: {
  customers: any[];
  suppliers: any[];
  totalCustomerDue: number;
  totalSupplierPayable: number;
  sym: string;
}) {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const dueCustomers = useMemo(
    () => customers.filter((c) => c.totalDue > 0),
    [customers]
  );
  const payableSuppliers = useMemo(
    () => suppliers.filter((s) => s.totalPayable > 0),
    [suppliers]
  );

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    if (activeTab === 'customers') {
      return dueCustomers.filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q))
      );
    } else {
      return payableSuppliers.filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          (s.companyName && s.companyName.toLowerCase().includes(q)) ||
          (s.phone && s.phone.includes(q))
      );
    }
  }, [activeTab, dueCustomers, payableSuppliers, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4">
      {/* Top Dues KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono tabular-nums">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="font-sans text-xs text-slate-500 block">Total Customer Due (Receivables)</span>
            <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">
              {formatBDT(totalCustomerDue, sym)}
            </p>
            <p className="text-[11px] font-sans text-slate-400 mt-0.5">
              Owed by {dueCustomers.length} customers
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="font-sans text-xs text-slate-500 block">Total Supplier Payable (Liabilities)</span>
            <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1">
              {formatBDT(totalSupplierPayable, sym)}
            </p>
            <p className="text-[11px] font-sans text-slate-400 mt-0.5">
              Owed to {payableSuppliers.length} wholesale suppliers
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs and Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('customers');
                setPage(1);
              }}
              className={`min-h-[38px] px-4 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'customers'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Customer Receivables ({dueCustomers.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('suppliers');
                setPage(1);
              }}
              className={`min-h-[38px] px-4 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'suppliers'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Supplier Payables ({payableSuppliers.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={`Search ${activeTab === 'customers' ? 'customer' : 'supplier'}...`}
              className="w-full min-h-[38px] pl-8 pr-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        {/* List of Debtors / Creditors */}
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No {activeTab === 'customers' ? 'customer' : 'supplier'} dues found
          </div>
        ) : (
          <div className="space-y-2">
            <div className="divide-y divide-slate-100">
              {pagedItems.map((item: any) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">
                      {item.companyName ? `${item.companyName} (${item.name})` : item.name}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">{item.phone}</p>
                  </div>
                  <span
                    className={`font-mono font-bold text-sm ${
                      activeTab === 'customers' ? 'text-amber-600' : 'text-red-600'
                    }`}
                  >
                    {formatBDT(activeTab === 'customers' ? item.totalDue : item.totalPayable, sym)}
                  </span>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 font-mono">
                  Page {page} of {totalPages} ({filteredItems.length} records)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="min-h-[38px] px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Prev</span>
                  </button>
                  <span className="px-2 font-mono font-bold text-slate-800">{page}/{totalPages}</span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="min-h-[38px] px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   SUB-COMPONENT: STOCK VALUATION STATEMENT INNER
   ============================================================================ */
function StockValuationViewInner({
  products,
  allCategories,
  totalStockUnits,
  totalStockCostVal,
  totalStockRetailVal,
  sym,
}: {
  products: any[];
  allCategories: any[];
  totalStockUnits: number;
  totalStockCostVal: number;
  totalStockRetailVal: number;
  sym: string;
}) {
  const potentialProfit = totalStockRetailVal - totalStockCostVal;
  const potentialMarginPct =
    totalStockRetailVal > 0 ? ((potentialProfit / totalStockRetailVal) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-4">
      {/* Stock KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono tabular-nums">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="font-sans text-xs text-slate-500 block">Total Garment Units</span>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {totalStockUnits} pcs
          </p>
          <p className="text-[11px] font-sans text-slate-400 mt-0.5">{products.length} unique SKUs</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="font-sans text-xs text-slate-500 block">Wholesale Cost Value</span>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {formatBDT(totalStockCostVal, sym)}
          </p>
          <p className="text-[11px] font-sans text-slate-400 mt-0.5">Physical investment</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="font-sans text-xs text-slate-500 block">Expected Retail Asset</span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">
            {formatBDT(totalStockRetailVal, sym)}
          </p>
          <p className="text-[11px] font-sans text-slate-400 mt-0.5">If sold at MRP</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="font-sans text-xs text-slate-500 block">Potential Gross Profit</span>
          <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">
            {formatBDT(potentialProfit, sym)}
          </p>
          <p className="text-[11px] font-sans text-blue-600 font-semibold mt-0.5">
            Margin: {potentialMarginPct}%
          </p>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h4 className="font-bold text-slate-900 text-base">
            Category-wise Stock Valuation Breakdown
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Stock quantities, purchase investment, and potential retail profit per garment category
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50">
                <th className="py-2.5 px-3">Garment Category</th>
                <th className="py-2.5 px-3 text-right">SKUs</th>
                <th className="py-2.5 px-3 text-right">Units</th>
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
                const profit = retailVal - costVal;

                return (
                  <tr key={c.value} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-sans font-semibold text-slate-900">
                      {c.label}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">{items.length}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">{units} pcs</td>
                    <td className="py-3 px-3 text-right text-slate-600">{formatBDT(costVal, sym)}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">
                      {formatBDT(retailVal, sym)}
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
      </div>
    </div>
  );
}

