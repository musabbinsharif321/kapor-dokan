import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { PwaRegistrar } from '@/components/erp/pwa-registrar';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0F172A',
};

export const metadata: Metadata = {
  title: 'NEXT FIT - Menswear & Apparel ERP',
  description:
    'Mobile-first PWA ERP & POS system for NEXT FIT menswear showroom with variant inventory, sales billing, purchase ledgers, daily expenses, and financial reports.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '64x64', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NEXT FIT ERP',
  },
  openGraph: {
    title: 'NEXT FIT - Menswear & Apparel ERP',
    description:
      'Mobile-first PWA ERP & POS system for NEXT FIT menswear showroom with variant inventory, sales billing, purchase ledgers, daily expenses, and financial reports.',
    type: 'website',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Next Fit Logo' }],
  },
  twitter: {
    card: 'summary',
    title: 'NEXT FIT - Menswear & Apparel ERP',
    description:
      'Mobile-first PWA ERP & POS system for NEXT FIT menswear showroom with variant inventory, sales billing, purchase ledgers, daily expenses, and financial reports.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white"
      >
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
