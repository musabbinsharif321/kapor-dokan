import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

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
  title: 'ThreadCraft Apparel ERP',
  description:
    'Mobile-first (iPhone) and desktop ERP & POS system for menswear and clothing stores with Firebase backend, variant inventory, sales & purchase ledgers, daily expenses, and financial reports.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ThreadCraft ERP',
  },
  openGraph: {
    title: 'ThreadCraft Apparel ERP',
    description:
      'Mobile-first (iPhone) and desktop ERP & POS system for menswear and clothing stores with Firebase backend, variant inventory, sales & purchase ledgers, daily expenses, and financial reports.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ThreadCraft Apparel ERP',
    description:
      'Mobile-first (iPhone) and desktop ERP & POS system for menswear and clothing stores with Firebase backend, variant inventory, sales & purchase ledgers, daily expenses, and financial reports.',
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
        {children}
      </body>
    </html>
  );
}
