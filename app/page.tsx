'use client';

import React, { useState } from 'react';
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
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

/* ============================================================================
   1. CLEAN, MODERN & LUXURY NEXT FIT LOGIN SCREEN
   ============================================================================ */
function NextFitAuthScreen() {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPassword,
  } = useErp();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      try {
        await resetPassword(email.trim());
        setSuccessMsg('Password reset link sent to your email.');
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to send reset link.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Login Card */}
      <div className="relative z-10 w-full max-w-[400px] bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Top Store Logo & Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full blur-sm opacity-40 group-hover:opacity-75 transition-opacity" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="NEXT FIT"
              className="relative w-24 h-24 rounded-full border-2 border-white/20 bg-black object-cover shadow-xl"
            />
          </div>

          <h1 className="mt-3 text-2xl font-black tracking-widest text-white uppercase">
            NEXT FIT
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 tracking-wide">
            Apparel & Showroom ERP
          </p>
        </div>

        {/* Mode Selector Tabs (Sign In vs Sign Up) */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 p-1 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Feedback Alert Messages */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login / Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nextfit.com"
                className="w-full min-h-[46px] pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Password Field (Hidden in forgot mode) */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[46px] pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="min-h-[44px] min-w-[40px] absolute right-0 top-0 flex items-center justify-center text-slate-400 hover:text-white"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'signin'
                    ? 'Sign In to Showroom'
                    : mode === 'signup'
                    ? 'Create Showroom Account'
                    : 'Send Reset Link'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Forgot Password Mode Back Button */}
        {mode === 'forgot' && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Sign In
            </button>
          </div>
        )}

        {/* Subtle Divider */}
        {mode !== 'forgot' && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500">
                or continue with
              </span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Quick 1-Click Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950/60 hover:bg-slate-800/80 text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </>
        )}
      </div>

      {/* Subtle Copyright / PWA Footer */}
      <footer className="relative z-10 text-[11px] text-slate-500 mt-6 text-center">
        <span>NEXT FIT ERP · Secure POS & Inventory Access</span>
      </footer>
    </div>
  );
}

/* ============================================================================
   2. ERP WORKSPACE ROUTER
   ============================================================================ */
function ErpWorkspaceRouter() {
  const { user, authLoading, activeModule } = useErp();

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

  // Show clean, focused Next Fit Auth Screen if not signed in
  if (!user) {
    return <NextFitAuthScreen />;
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
