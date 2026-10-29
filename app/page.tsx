'use client';

import React from 'react';
import { ErpProvider, useErp } from '@/context/erp-context';
import { NavigationShell } from '@/components/erp/navigation-shell';
import { DashboardView } from '@/components/erp/dashboard-view';
import { InventoryView, InventoryHistoryView } from '@/components/erp/inventory-view';
import {
  CustomerView,
  SalesOrderView,
  SalesInvoiceView,
} from '@/components/erp/sales-views';
import {
  SupplierView,
  PurchaseInvoiceView,
} from '@/components/erp/purchase-views';
import {
  DailyExpensesView,
  ReportView,
  SettingView,
} from '@/components/erp/expenses-report-setting-views';
import { QrScannerView, QrLabelsPrintView } from '@/components/erp/qr-views';
import { GARMENT_CATEGORIES } from '@/lib/types';
import { ShieldCheck, Smartphone, ArrowRight } from 'lucide-react';

function ErpWorkspaceRouter() {
  const { user, authLoading, activeModule, signInWithGoogle } = useErp();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="NEXT FIT"
          className="w-16 h-16 rounded-full border border-slate-800 bg-black object-cover mb-4 animate-pulse"
        />
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-300">
          Loading NEXT FIT Apparel ERP...
        </p>
      </div>
    );
  }

  // Mobile-First Sign-In Screen for Store Owners
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12">
        <header className="max-w-5xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="NEXT FIT"
              className="w-10 h-10 rounded-full border border-slate-700 bg-black object-cover shrink-0"
            />
            <span className="text-lg font-bold tracking-tight text-white">
              NEXT FIT ERP
            </span>
          </div>
          <span className="text-xs text-slate-400">
            PWA Mobile POS & Inventory
          </span>
        </header>

        <main className="max-w-xl w-full mx-auto my-auto py-10 space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-blue-400 tracking-wide uppercase">
              Menswear Showroom Management
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Run NEXT FIT from your smartphone or showroom counter.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Manage variant stock across Pant, Shirt, Polo Shirt, T-Shirt, Half Pant,
              Trouser, Formal Pant, Sweatshirt, and Half Shirt—complete with Sales Orders,
              POS Invoices, Customer Due Ledgers, Supplier Purchases, and Daily Expenses.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-400">
              Pre-Configured for All 9 Garment Categories:
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              {GARMENT_CATEGORIES.map((c, idx) => (
                <React.Fragment key={c.value}>
                  <span>{c.label}</span>
                  {idx < GARMENT_CATEGORIES.length - 1 && (
                    <span className="text-slate-600">·</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <button
              onClick={signInWithGoogle}
              className="w-full min-h-[52px] px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer"
            >
              <span>Sign In with Google to Open Store ERP</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-slate-400 pt-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Installable PWA App on iOS & Android</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Secured by Firebase Cloud Firestore</span>
            </div>
          </div>
        </main>

        <footer className="max-w-5xl w-full mx-auto text-xs text-slate-500 flex items-center justify-between">
          <span>NEXT FIT Apparel ERP</span>
          <span>BDT (৳) Accounting & Inventory</span>
        </footer>
      </div>
    );
  }

  return (
    <NavigationShell>
      {activeModule === 'dashboard' && <DashboardView />}
      {activeModule === 'inventory' && <InventoryView />}
      {activeModule === 'inventory-history' && <InventoryHistoryView />}
      {activeModule === 'sales-customer' && <CustomerView />}
      {activeModule === 'sales-order' && <SalesOrderView />}
      {activeModule === 'sales-invoice' && <SalesInvoiceView />}
      {activeModule === 'purchase-supplier' && <SupplierView />}
      {activeModule === 'purchase-invoice' && <PurchaseInvoiceView />}
      {activeModule === 'daily-expenses' && <DailyExpensesView />}
      {activeModule === 'report' && <ReportView />}
      {activeModule === 'setting' && <SettingView />}
      {activeModule === 'qr-scanner' && <QrScannerView />}
      {activeModule === 'qr-labels' && <QrLabelsPrintView />}
    </NavigationShell>
  );
}

export default function HomePage() {
  return (
    <ErpProvider>
      <ErpWorkspaceRouter />
    </ErpProvider>
  );
}
