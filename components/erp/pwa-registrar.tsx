'use client';

import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaRegistrar() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Next Fit PWA Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('PWA registration failed:', err);
        });
    }

    // Check if app is already running in standalone PWA mode
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true)
    ) {
      setIsInstalled(true);
      return;
    }

    // Capture beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt banner after 3 seconds on mobile
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // iOS / Fallback instruction
      alert('To install Next Fit on iPhone/iPad: tap the Share button (bottom of Safari) and choose "Add to Home Screen" 📲');
      return;
    }
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-3">
        <img
          src="/logo.png"
          alt="Next Fit"
          className="w-11 h-11 rounded-xl bg-black border border-slate-700 object-cover shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold leading-tight truncate">Install Next Fit ERP</p>
          <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
            Install on your phone for full-screen app access & fast POS billing
          </p>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          className="min-h-[32px] min-w-[32px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex-1 min-h-[38px] px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
        >
          <Smartphone className="w-4 h-4" />
          <span>Install App (Add to Phone)</span>
        </button>
        <button
          type="button"
          onClick={() => setShowBanner(false)}
          className="min-h-[38px] px-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-medium"
        >
          Later
        </button>
      </div>
    </div>
  );
}
