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
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

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

    if (typeof window === 'undefined') return;

    // Check if app is already running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iPhone / iPad / iPod
    const isAppleIos =
      /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

    if (isAppleIos) {
      setIsIos(true);
      // On iOS, trigger the install banner after 2 seconds
      const iosTimer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(iosTimer);
    }

    // Capture beforeinstallprompt event for Android Chrome / Desktop
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const timer = setTimeout(() => setShowBanner(true), 2500);
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
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) {
      setShowIosGuide(true);
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
    <>
      {/* Top Floating PWA Install Banner */}
      <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Next Fit"
            className="w-11 h-11 rounded-xl bg-black border border-slate-700 object-cover shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold leading-tight truncate">
              {isIos ? 'Install NEXT FIT on iPhone' : 'Install NEXT FIT App'}
            </p>
            <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
              {isIos
                ? 'Add to iPhone Home Screen for full-screen showroom app'
                : 'Install on your phone for full-screen app access & POS billing'}
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
            className="flex-1 min-h-[38px] px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>{isIos ? 'How to Install on iPhone' : 'Install App (Add to Phone)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowBanner(false)}
            className="min-h-[38px] px-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
          >
            Later
          </button>
        </div>
      </div>

      {/* iOS Step-by-Step Interactive Visual Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 text-white w-full max-w-sm rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Next Fit" className="w-9 h-9 rounded-xl bg-black border border-slate-700 object-cover" />
                <div>
                  <h3 className="font-bold text-sm text-white">Install on iPhone</h3>
                  <p className="text-[11px] text-slate-400">Apple Safari Browser</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white">Tap Safari&apos;s Share Button</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Look at the bottom toolbar of Safari and tap the square box with arrow pointing up (⎋ / ⬆️).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-white">Select &quot;Add to Home Screen&quot;</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Scroll down a bit in the menu and tap <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div>
                  <p className="font-semibold text-white">Tap &quot;Add&quot; at top right</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    The NEXT FIT app icon will appear on your iPhone home screen!
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowIosGuide(false);
                setShowBanner(false);
              }}
              className="w-full min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}

