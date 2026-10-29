'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Sparkles,
  FileText,
  Truck,
  Wallet,
  Users,
  Printer,
  ShoppingBag,
  CreditCard,
  ChevronRight,
  ArrowRight,
  ShieldAlert,
  Layers,
  Calendar,
} from 'lucide-react';
import { useErp } from '@/context/erp-context';
import { GARMENT_CATEGORIES, formatBDT } from '@/lib/types';

export function DashboardView() {
  const {
    products,
    allCategories,
    customers,
    salesInvoices,
    suppliers,
    expenses,
    purchaseInvoices,
    ledgerTransactions,
    storeSettings,
    setActiveModule,
    setSelectedCategoryFilter,
    seedSampleData,
    setPrintableReceipt,
  } = useErp();

  const [seeding, setSeeding] = useState(false);
  const sym = storeSettings.currencySymbol || '৳';
  const today = new Date().toISOString().slice(0, 10);

  // Key Financial & Operational Metrics
  const todaySalesInvoices = salesInvoices.filter((inv) => inv.invoiceDate === today);
  const todaySales = todaySalesInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const todayCollected = todaySalesInvoices.reduce((acc, inv) => acc + inv.paidAmount, 0);

  // Cash in Counter Drawer calculation
  // (Cash Sales + Cash Due Collections - Cash Daily Expenses)
  const cashSales = salesInvoices.filter((i) => i.paymentMethod === 'Cash').reduce((a, i) => a + i.paidAmount, 0);
  const cashExpenses = expenses.filter((e) => e.paymentMethod === 'Cash').reduce((a, e) => a + e.amount, 0);
  const cashCustomerCollections = ledgerTransactions
    .filter((t) => t.type === 'CUSTOMER_DUE_COLLECTION' && t.paymentMethod === 'Cash')
    .reduce((a, t) => a + t.amount, 0);
  const cashInDrawer = Math.max(
    0,
    cashSales + cashCustomerCollections - cashExpenses
  );

  const todayCashSales = todaySalesInvoices
    .filter((inv) => inv.paymentMethod === 'Cash')
    .reduce((acc, inv) => acc + inv.paidAmount, 0);

  const totalSalesRevenue = salesInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const totalCOGS = salesInvoices.reduce((acc, inv) => acc + (inv.totalCost || 0), 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const todayExpenses = expenses
    .filter((exp) => exp.expenseDate === today)
    .reduce((acc, exp) => acc + exp.amount, 0);

  const netProfit = totalSalesRevenue - totalCOGS - totalExpenses;

  const totalCustomerDue = customers.reduce((acc, c) => acc + c.totalDue, 0);
  const totalSupplierPayable = suppliers.reduce((acc, s) => acc + s.totalPayable, 0);

  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const totalInventoryCostValue = products.reduce(
    (acc, p) => acc + p.stock * p.purchasePrice,
    0
  );
  const lowStockItems = products.filter((p) => p.stock <= p.minStockAlert);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedSampleData();
    } finally {
      setSeeding(false);
    }
  };

  const handleCategoryJump = (categoryValue: string) => {
    setSelectedCategoryFilter(categoryValue);
    setActiveModule('inventory');
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Empty Store Onboarding Banner (1-Tap Sample Data Seeding) */}
      {products.length === 0 && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-5 border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Store Setup</span>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">Load Sample Store Catalog</h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Populate your store with pre-configured apparel categories, product variants, customers, and starter invoices with one tap.
            </p>
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{seeding ? 'Loading...' : 'Load Sample Data'}</span>
          </button>
        </div>
      )}

      {/* 1. Mobile-First Quick Thumb Action Bar */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {/* POS Sale */}
        <button
          onClick={() => setActiveModule('sales-invoice')}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-blue-600 text-white active:scale-95 transition-all shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-1.5">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">New Sale</span>
          <span className="text-[9px] text-blue-200 hidden xs:inline sm:inline">POS Bill</span>
        </button>

        {/* Stock / Inventory */}
        <button
          onClick={() => setActiveModule('inventory')}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 active:scale-95 transition-all shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
            <Package className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">Inventory</span>
          <span className="text-[9px] text-slate-400 hidden xs:inline sm:inline">Stock</span>
        </button>

        {/* Purchase */}
        <button
          onClick={() => setActiveModule('purchase-invoice')}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 active:scale-95 transition-all shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5">
            <Truck className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">Purchase</span>
          <span className="text-[9px] text-slate-400 hidden xs:inline sm:inline">Restock</span>
        </button>

        {/* Expense */}
        <button
          onClick={() => setActiveModule('daily-expenses')}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 active:scale-95 transition-all shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">Expenses</span>
          <span className="text-[9px] text-slate-400 hidden xs:inline sm:inline">Finance</span>
        </button>
      </div>

      {/* 2. Hero Business Card (Today's Sales & Financial Overview) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white p-5 sm:p-6 shadow-xl border border-slate-800/80">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Top Row: Store Badge & View Report link */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
                Today&apos;s Business Overview
              </span>
            </div>
            <button
              onClick={() => setActiveModule('report')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl backdrop-blur-xs transition-colors"
            >
              <span>Reports</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Today's Sales Big Display */}
          <div>
            <p className="text-xs text-slate-400">Today&apos;s Gross Sales</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono tabular-nums text-white">
                {formatBDT(todaySales, sym)}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({todaySalesInvoices.length} invoices)
              </span>
            </div>
          </div>

          {/* Sub-Stats Glass Pill Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-xs">
            <div>
              <span className="text-[10px] text-emerald-300 block font-medium">Cash in Drawer (ক্যাশ)</span>
              <span className="font-bold text-emerald-400 font-mono tabular-nums mt-0.5 block truncate text-xs sm:text-sm">
                {formatBDT(cashInDrawer, sym)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-300 block font-medium">Today Collected</span>
              <span className="font-bold text-white font-mono tabular-nums mt-0.5 block truncate text-xs sm:text-sm">
                {formatBDT(todayCollected, sym)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-amber-300 block font-medium">Today Expense</span>
              <span className="font-bold text-amber-300 font-mono tabular-nums mt-0.5 block truncate text-xs sm:text-sm">
                {formatBDT(todayExpenses, sym)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-300 block font-medium">Net Profit</span>
              <span
                className={`font-bold font-mono tabular-nums mt-0.5 block truncate text-xs sm:text-sm ${
                  netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatBDT(netProfit, sym)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Four Core Metric Cards (2x2 Grid) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 font-mono tabular-nums">
        {/* Total Stock */}
        <button
          onClick={() => setActiveModule('inventory')}
          className="bg-white rounded-2xl p-4 border border-slate-200 text-left hover:border-blue-400 active:scale-[0.98] transition-all shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between font-sans">
            <span className="text-xs font-semibold text-slate-600">Total Stock</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              {totalStockUnits.toLocaleString()} <span className="text-xs font-semibold text-slate-500 font-sans">pcs</span>
            </p>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5 truncate">
              Cost: {formatBDT(totalInventoryCostValue, sym)}
            </p>
          </div>
        </button>

        {/* Low Stock Alerts */}
        <button
          onClick={() => setActiveModule('inventory')}
          className="bg-white rounded-2xl p-4 border border-slate-200 text-left hover:border-amber-400 active:scale-[0.98] transition-all shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between font-sans">
            <span className="text-xs font-semibold text-slate-600">Low Stock Alert</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              lowStockItems.length > 0 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className={`text-xl sm:text-2xl font-black ${
              lowStockItems.length > 0 ? 'text-amber-600' : 'text-slate-800'
            }`}>
              {lowStockItems.length} <span className="text-xs font-semibold text-slate-500 font-sans">items</span>
            </p>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5 truncate">
              {lowStockItems.length > 0 ? 'Restock required' : 'Stock healthy'}
            </p>
          </div>
        </button>

        {/* Customer Due */}
        <button
          onClick={() => setActiveModule('sales-customer')}
          className="bg-white rounded-2xl p-4 border border-slate-200 text-left hover:border-amber-400 active:scale-[0.98] transition-all shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between font-sans">
            <span className="text-xs font-semibold text-slate-600">Customer Due</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-xl sm:text-2xl font-black text-amber-600">
              {formatBDT(totalCustomerDue, sym)}
            </p>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5 truncate">
              {customers.filter((c) => c.totalDue > 0).length} due accounts
            </p>
          </div>
        </button>

        {/* Supplier Payable (Dena) */}
        <button
          onClick={() => setActiveModule('purchase-supplier')}
          className="bg-white rounded-2xl p-4 border border-slate-200 text-left hover:border-red-400 active:scale-[0.98] transition-all shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between font-sans">
            <span className="text-xs font-semibold text-slate-600">Supplier Payable</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-xl sm:text-2xl font-black text-red-600">
              {formatBDT(totalSupplierPayable, sym)}
            </p>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5 truncate">
              {suppliers.filter((s) => s.totalPayable > 0).length} suppliers payable
            </p>
          </div>
        </button>
      </div>

      {/* 4. Garment Categories Stock Overview (3-Column Clean Mobile Cards) */}
      <section className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Garment Categories ({allCategories.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Tap any category to filter inventory and manage stock
            </p>
          </div>
          <button
            onClick={() => handleCategoryJump('All')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {allCategories.map((cat) => {
            const catItems = products.filter((p) => p.category === cat.value);
            const catUnits = catItems.reduce((acc, p) => acc + p.stock, 0);
            const hasLow = catItems.some((p) => p.stock <= p.minStockAlert);

            return (
              <button
                key={cat.value}
                onClick={() => handleCategoryJump(cat.value)}
                className={`p-2.5 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between min-h-[76px] ${
                  hasLow
                    ? 'border-amber-200 bg-amber-50/40 hover:bg-amber-50'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-400'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                    {cat.label}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    Category
                  </p>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-1">
                  <span className="text-sm sm:text-base font-extrabold font-mono tabular-nums text-slate-900">
                    {catUnits}
                  </span>
                  {hasLow ? (
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.5 rounded">
                      Low
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">pcs</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Recent Sales Invoices List */}
      <section className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Recent Sales Invoices
            </h3>
            <p className="text-[11px] text-slate-500">
              Latest showroom sales bills and payment records
            </p>
          </div>
          <button
            onClick={() => setActiveModule('sales-invoice')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1"
          >
            All Invoices
          </button>
        </div>

        {salesInvoices.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
            No sales invoices created yet
          </div>
        ) : (
          <div className="space-y-2">
            {salesInvoices.slice(0, 4).map((inv) => (
              <div
                key={inv.id}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-semibold text-slate-800 truncate">{inv.customerName}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{inv.itemsSummary}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                    <span>{inv.invoiceDate}</span>
                    <span>·</span>
                    <span>{inv.paymentMethod}</span>
                    <span>·</span>
                    <span
                      className={`font-semibold ${
                        inv.status === 'Paid'
                          ? 'text-emerald-600'
                          : inv.status === 'Partial'
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      {inv.status === 'Paid' ? 'Paid' : `Due ${formatBDT(inv.dueAmount, sym)}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right font-mono tabular-nums">
                    <span className="font-extrabold text-sm text-slate-900 block">
                      {formatBDT(inv.grandTotal, sym)}
                    </span>
                    <span className="text-[10px] text-slate-400">{inv.itemsCount} pcs</span>
                  </div>
                  <button
                    onClick={() =>
                      setPrintableReceipt({
                        type: 'SALES',
                        invoiceNumber: inv.invoiceNumber,
                        date: inv.invoiceDate,
                        partyName: inv.customerName,
                        partyPhone: inv.customerPhone,
                        itemsSummary: inv.itemsSummary,
                        itemsCount: inv.itemsCount,
                        subtotal: inv.subtotal,
                        discount: inv.discount,
                        grandTotal: inv.grandTotal,
                        paidAmount: inv.paidAmount,
                        dueAmount: inv.dueAmount,
                        paymentMethod: inv.paymentMethod,
                        status: inv.status,
                      })
                    }
                    className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-all shadow-2xs"
                    title="Print Receipt"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Low Stock Alerts Panel */}
      {lowStockItems.length > 0 && (
        <section className="bg-white rounded-3xl border border-amber-200/80 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Low Stock Alert ({lowStockItems.length} items)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Garment items below minimum stock threshold
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveModule('purchase-invoice')}
              className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors shrink-0"
            >
              Restock
            </button>
          </div>

          <div className="space-y-2">
            {lowStockItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{item.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {item.sku} · {item.category} · Size {item.size} ({item.color})
                  </p>
                </div>
                <div className="text-right shrink-0 font-mono">
                  <span
                    className={`font-bold block ${
                      item.stock === 0 ? 'text-red-600' : 'text-amber-700'
                    }`}
                  >
                    {item.stock === 0 ? 'Out of Stock (0)' : `${item.stock} pcs left`}
                  </span>
                  <span className="text-[10px] text-slate-400">Min Alert: {item.minStockAlert}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
