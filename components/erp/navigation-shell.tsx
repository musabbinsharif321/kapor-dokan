'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  ClipboardList,
  FileText,
  Truck,
  Building2,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  LogOut,
  Printer,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Camera,
  QrCode,
} from 'lucide-react';
import { useErp } from '@/context/erp-context';
import { ActiveModule, formatBDT } from '@/lib/types';
import { QrCameraScannerModal } from './qr-camera-scanner-modal';
import { generateQrDataUrl, encodeInvoiceQr } from '@/lib/qr-utils';
import { bluetoothPrinter } from '@/lib/thermal-printer';
import { Bluetooth, Share2, HelpCircle } from 'lucide-react';

const MODULE_TITLES: Record<ActiveModule, { title: string; group: string; ctaLabel?: string }> = {
  dashboard: { title: 'Dashboard', group: 'Overview', ctaLabel: 'New Sale' },
  inventory: { title: 'Inventory', group: 'Catalog & Stock', ctaLabel: 'New Sale' },
  'inventory-history': { title: 'Inventory History Log', group: 'Inventory', ctaLabel: 'New Sale' },
  'sales-customer': { title: 'Customer', group: 'Sales', ctaLabel: 'New Sale' },
  'sales-order': { title: 'Sales Order', group: 'Sales', ctaLabel: 'New Sale' },
  'sales-invoice': { title: 'Sales Invoice', group: 'Sales' },
  'sales-returns': { title: 'Returns & Exchange', group: 'Sales', ctaLabel: 'Process Return' },
  'purchase-supplier': { title: 'Supplier', group: 'Purchase', ctaLabel: 'New Purchase' },
  'purchase-invoice': { title: 'Purchase Invoice', group: 'Purchase' },
  'daily-expenses': { title: 'Daily Expenses', group: 'Finance', ctaLabel: 'New Sale' },
  report: { title: 'Report', group: 'Analytics', ctaLabel: 'Print Report' },
  setting: { title: 'Setting', group: 'System' },
  'qr-scanner': { title: 'Mobile QR Scanner', group: 'Quick Scan', ctaLabel: 'Scan Code' },
  'qr-labels': { title: 'QR Code Labels', group: 'Catalog & Stock', ctaLabel: 'Print Labels' },
};

export function NavigationShell({ children }: { children: React.ReactNode }) {
  const {
    user,
    activeModule,
    setActiveModule,
    storeSettings,
    logout,
    toast,
    printableReceipt,
    setPrintableReceipt,
    products,
  } = useErp();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [salesExpanded, setSalesExpanded] = useState(true);
  const [purchaseExpanded, setPurchaseExpanded] = useState(true);
  const [globalScannerOpen, setGlobalScannerOpen] = useState(false);
  const [receiptQrUrl, setReceiptQrUrl] = useState<string>('');
  const [btPrinting, setBtPrinting] = useState(false);
  const [btPrinterName, setBtPrinterName] = useState<string | null>(null);
  const [iosHelpOpen, setIosHelpOpen] = useState(false);

  useEffect(() => {
    const qrUrlPromise = printableReceipt?.invoiceNumber
      ? generateQrDataUrl(encodeInvoiceQr(printableReceipt.invoiceNumber), { width: 180, margin: 1 })
      : Promise.resolve('');
    qrUrlPromise.then(setReceiptQrUrl);
  }, [printableReceipt]);

  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;
  const currentMeta = MODULE_TITLES[activeModule];
  const sym = storeSettings.currencySymbol || '৳';

  const handleSelectModule = (mod: ActiveModule) => {
    setActiveModule(mod);
    setMobileDrawerOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const escapeHtml = (raw: string | undefined | null) =>
    String(raw ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const handleShareWhatsAppReceipt = () => {
    if (!printableReceipt) return;
    const printSym = storeSettings.currencySymbol || '৳';
    const lines = [
      `*${storeSettings.storeName || 'NEXT FIT'}*`,
      storeSettings.address ? `${storeSettings.address}` : '',
      `Invoice: *${printableReceipt.invoiceNumber}* (${printableReceipt.date})`,
      `Customer: ${printableReceipt.partyName}`,
      `------------------------`,
      ...printableReceipt.itemsSummary.split(' · ').map((l) => `• ${l}`),
      `------------------------`,
      printableReceipt.discount > 0
        ? `Subtotal: ${printSym}${printableReceipt.subtotal.toLocaleString()}\nDiscount: -${printSym}${printableReceipt.discount.toLocaleString()}`
        : '',
      `*Grand Total: ${printSym}${printableReceipt.grandTotal.toLocaleString()}*`,
      `Paid (${printableReceipt.paymentMethod}): ${printSym}${printableReceipt.paidAmount.toLocaleString()}`,
      printableReceipt.dueAmount > 0
        ? `*Balance Due: ${printSym}${printableReceipt.dueAmount.toLocaleString()}*`
        : 'Status: Paid in Full',
      storeSettings.invoiceFooterNote ? `\n_${storeSettings.invoiceFooterNote}_` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const rawPhone = (printableReceipt.partyPhone || '').replace(/[^0-9]/g, '');
    const bdPhone =
      rawPhone.length === 11 && rawPhone.startsWith('01')
        ? `88${rawPhone}`
        : rawPhone.length >= 10
        ? rawPhone
        : '';
    const url = bdPhone
      ? `https://wa.me/${bdPhone}?text=${encodeURIComponent(lines)}`
      : `https://wa.me/?text=${encodeURIComponent(lines)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareToIosPrinterApp = async () => {
    if (!printableReceipt) return;
    const printSym = storeSettings.currencySymbol || '৳';
    const textReceipt = [
      `================================`,
      `       ${(storeSettings.storeName || 'NEXT FIT').toUpperCase()}       `,
      storeSettings.tagline ? `    ${storeSettings.tagline}    ` : '',
      storeSettings.address ? `  ${storeSettings.address}  ` : '',
      storeSettings.phone ? `    Tel: ${storeSettings.phone}    ` : '',
      `================================`,
      `Invoice: ${printableReceipt.invoiceNumber}`,
      `Date: ${printableReceipt.date}`,
      `Customer: ${printableReceipt.partyName}`,
      printableReceipt.partyPhone ? `Phone: ${printableReceipt.partyPhone}` : '',
      `--------------------------------`,
      `ITEM / QTY                AMOUNT`,
      `--------------------------------`,
      ...printableReceipt.itemsSummary.split(' · '),
      `--------------------------------`,
      printableReceipt.discount > 0 ? `Subtotal:      ${printSym}${printableReceipt.subtotal.toLocaleString()}` : '',
      printableReceipt.discount > 0 ? `Discount:     -${printSym}${printableReceipt.discount.toLocaleString()}` : '',
      `GRAND TOTAL:   ${printSym}${printableReceipt.grandTotal.toLocaleString()}`,
      `Paid (${printableReceipt.paymentMethod}):   ${printSym}${printableReceipt.paidAmount.toLocaleString()}`,
      printableReceipt.dueAmount > 0
        ? `BALANCE DUE:   ${printSym}${printableReceipt.dueAmount.toLocaleString()}`
        : `Payment Status: PAID IN FULL`,
      `================================`,
      storeSettings.invoiceFooterNote ? `${storeSettings.invoiceFooterNote}` : '',
      `Thank you for shopping with us!`,
      `================================`,
    ]
      .filter(Boolean)
      .join('\n');

    // Check if Web Share API is available (iOS Safari, Android Chrome)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Receipt ${printableReceipt.invoiceNumber}`,
          text: textReceipt,
        });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Share error:', err);
        }
      }
    }

    // Fallback if Web Share is cancelled or not supported
    try {
      await navigator.clipboard.writeText(textReceipt);
      alert('Receipt copied to clipboard! You can now paste it into your iOS thermal printer app.');
    } catch {
      window.print();
    }
  };

  const handleDirectBluetoothPrint = async () => {
    if (!printableReceipt) return;
    setBtPrinting(true);
    try {
      if (!bluetoothPrinter.isConnected()) {
        const name = await bluetoothPrinter.connect();
        setBtPrinterName(name);
      }

      await bluetoothPrinter.printReceipt({
        storeName: storeSettings.storeName || 'NEXT FIT',
        tagline: storeSettings.tagline,
        address: storeSettings.address,
        phone: storeSettings.phone,
        invoiceNumber: printableReceipt.invoiceNumber,
        date: printableReceipt.date,
        partyName: printableReceipt.partyName,
        partyPhone: printableReceipt.partyPhone,
        itemsSummary: printableReceipt.itemsSummary,
        itemsCount: printableReceipt.itemsCount,
        subtotal: printableReceipt.subtotal,
        discount: printableReceipt.discount,
        grandTotal: printableReceipt.grandTotal,
        paidAmount: printableReceipt.paidAmount,
        dueAmount: printableReceipt.dueAmount,
        paymentMethod: printableReceipt.paymentMethod,
        footerNote: storeSettings.invoiceFooterNote,
      });

      alert('Printed successfully via Bluetooth to MP-58T!');
    } catch (err: any) {
      console.error('Bluetooth print error:', err);
      // If Web Bluetooth is unsupported on iOS Safari, show the helper modal
      if (!bluetoothPrinter.isSupported()) {
        setIosHelpOpen(true);
      } else {
        alert(err.message || 'Could not print via Bluetooth. Ensure printer is turned ON and nearby.');
      }
    } finally {
      setBtPrinting(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!printableReceipt) return;
    const printSym = escapeHtml(storeSettings.currencySymbol || '৳');
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) {
      window.print();
      return;
    }

    const items = printableReceipt.itemsSummary.split(' · ');

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${escapeHtml(printableReceipt.invoiceNumber)} - ${escapeHtml(storeSettings.storeName)}</title>
  <style>
    @page {
      size: 58mm auto;
      margin: 0 !important;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: 58mm;
      max-width: 58mm;
      margin: 0 auto;
      padding: 2mm 2.5mm;
      background: #ffffff;
      color: #000000;
      font-size: 11px;
      line-height: 1.35;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .store-name {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.3px;
      margin-bottom: 2px;
    }
    .store-sub {
      font-size: 9.5px;
      color: #333;
      margin-bottom: 1.5px;
    }
    .dashed-divider {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2.5px;
    }
    .items-box {
      margin: 4px 0;
    }
    .item-line {
      margin-bottom: 3px;
      font-size: 10.5px;
      word-break: break-word;
    }
    .totals-box {
      margin-top: 4px;
    }
    .grand-total {
      font-size: 13px;
      font-weight: 800;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 3px 0;
      margin: 4px 0;
    }
    .qr-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-top: 8px;
    }
    .qr-img {
      width: 84px;
      height: 84px;
      object-fit: contain;
    }
    .qr-text {
      font-size: 8.5px;
      color: #444;
      margin-top: 2px;
    }
    .footer-note {
      font-size: 9px;
      text-align: center;
      color: #444;
      margin-top: 6px;
    }
  </style>
</head>
<body>
  <div class="text-center">
    <div class="store-name">${escapeHtml(storeSettings.storeName || 'NEXT FIT')}</div>
    ${storeSettings.tagline ? `<div class="store-sub">${escapeHtml(storeSettings.tagline)}</div>` : ''}
    ${storeSettings.address ? `<div class="store-sub">${escapeHtml(storeSettings.address)}</div>` : ''}
    <div class="store-sub font-bold">Tel: ${escapeHtml(storeSettings.phone || '')}</div>
  </div>

  <div class="dashed-divider"></div>

  <div class="row">
    <div>
      <div style="font-size: 9px; color: #555;">${printableReceipt.type === 'PURCHASE' ? 'Supplier' : 'Customer'}</div>
      <div class="font-bold">${escapeHtml(printableReceipt.partyName)}</div>
      ${printableReceipt.partyPhone ? `<div>${escapeHtml(printableReceipt.partyPhone)}</div>` : ''}
      ${printableReceipt.originalInvoiceNumber ? `<div style="font-size: 9px;">Ref: ${escapeHtml(printableReceipt.originalInvoiceNumber)}</div>` : ''}
    </div>
    <div class="text-right">
      <div class="font-bold" style="font-size: 11.5px;">${escapeHtml(printableReceipt.invoiceNumber)}</div>
      <div style="font-size: 9.5px;">${escapeHtml(printableReceipt.date)}</div>
      <div style="font-size: 9.5px;">${escapeHtml(printableReceipt.paymentMethod)} · ${escapeHtml(printableReceipt.status)}</div>
    </div>
  </div>

  <div class="dashed-divider"></div>

  <div class="items-box">
    <div class="row" style="font-size: 9px; font-weight: bold; margin-bottom: 4px;">
      <span>ITEMS (${printableReceipt.itemsCount} pcs)</span>
    </div>
    ${items.map((line: string) => `<div class="item-line">• ${escapeHtml(line)}</div>`).join('')}
    ${printableReceipt.returnReason ? `<div style="font-size: 9px; margin-top: 3px;"><b>Reason:</b> ${escapeHtml(printableReceipt.returnReason)}</div>` : ''}
  </div>

  <div class="dashed-divider"></div>

  <div class="totals-box">
    ${printableReceipt.type === 'RETURN' ? `
      <div class="row">
        <span>Adjustment / Refund</span>
        <span class="font-bold">${printSym}${printableReceipt.grandTotal.toLocaleString()}</span>
      </div>
      <div class="row">
        <span>Settlement Mode</span>
        <span>${escapeHtml(printableReceipt.paymentMethod)}</span>
      </div>
    ` : `
      <div class="row">
        <span>Subtotal</span>
        <span>${printSym}${printableReceipt.subtotal.toLocaleString()}</span>
      </div>
      ${printableReceipt.discount > 0 ? `
      <div class="row">
        <span>Discount</span>
        <span>-${printSym}${printableReceipt.discount.toLocaleString()}</span>
      </div>` : ''}
      <div class="row grand-total">
        <span>Grand Total</span>
        <span>${printSym}${printableReceipt.grandTotal.toLocaleString()}</span>
      </div>
      <div class="row">
        <span>Paid Amount (${escapeHtml(printableReceipt.paymentMethod)})</span>
        <span class="font-bold">${printSym}${printableReceipt.paidAmount.toLocaleString()}</span>
      </div>
      <div class="row">
        <span>Balance Due</span>
        <span class="font-bold">${printSym}${printableReceipt.dueAmount.toLocaleString()}</span>
      </div>
    `}
  </div>

  ${receiptQrUrl ? `
  <div class="dashed-divider"></div>
  <div class="qr-container">
    <img src="${receiptQrUrl}" alt="Invoice QR" class="qr-img" />
    <div class="qr-text">Scan QR to Verify & Process Returns</div>
  </div>
  ` : ''}

  ${storeSettings.invoiceFooterNote ? `
  <div class="footer-note">${escapeHtml(storeSettings.invoiceFooterNote)}</div>
  ` : ''}

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 150);
    };
  </script>
</body>
</html>`);

    printWindow.document.close();
  };

  const isSalesActive = activeModule.startsWith('sales-');
  const isPurchaseActive = activeModule.startsWith('purchase-');

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 select-none">
      {/* Store Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800 shrink-0">
        <button
          onClick={() => handleSelectModule('dashboard')}
          className="text-left focus:outline-none group min-h-[44px] flex items-center gap-3"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Next Fit"
            className="w-10 h-10 rounded-full border border-slate-700 bg-black object-cover shrink-0 shadow-sm"
          />
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-extrabold text-base tracking-tight text-white group-hover:text-blue-400 transition-colors truncate max-w-[155px]">
              {storeSettings.storeName || 'NEXT FIT'}
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[155px]">
              {storeSettings.tagline || 'Menswear & Apparel ERP'}
            </span>
          </div>
        </button>
        <button
          onClick={() => setMobileDrawerOpen(false)}
          className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Hierarchical Slidebar Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* 1. Dashboard */}
        <button
          onClick={() => handleSelectModule('dashboard')}
          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeModule === 'dashboard'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Dashboard</span>
        </button>

        {/* 2. Inventory */}
        <button
          onClick={() => handleSelectModule('inventory')}
          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center justify-between text-sm font-medium transition-colors whitespace-nowrap ${
            activeModule === 'inventory'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-3">
            <Package className="w-4 h-4 shrink-0" />
            <span>Inventory</span>
          </span>
          {lowStockCount > 0 && (
            <span className="text-xs font-mono tabular-nums text-amber-400">
              {lowStockCount} low
            </span>
          )}
        </button>

        {/* 3. Sales (Expandable Group: Customer, Sales Order, Sales Invoice) */}
        <div className="pt-1">
          <button
            onClick={() => setSalesExpanded((prev) => !prev)}
            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center justify-between text-sm font-medium transition-colors whitespace-nowrap ${
              isSalesActive ? 'text-white bg-slate-800/60' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Sales</span>
            </span>
            {salesExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {salesExpanded && (
            <div className="mt-1 ml-4 pl-3 border-l border-slate-800 space-y-1">
              <button
                onClick={() => handleSelectModule('sales-customer')}
                className={`w-full min-h-[42px] px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeModule === 'sales-customer'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Customer</span>
              </button>

              <button
                onClick={() => handleSelectModule('sales-order')}
                className={`w-full min-h-[42px] px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeModule === 'sales-order'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                <span>Sales Order</span>
              </button>

              <button
                onClick={() => handleSelectModule('sales-invoice')}
                className={`w-full min-h-[42px] px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeModule === 'sales-invoice'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>Sales Invoice</span>
              </button>

              <button
                onClick={() => handleSelectModule('sales-returns')}
                className={`w-full min-h-[42px] px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeModule === 'sales-returns'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>Returns & Exchange</span>
              </button>
            </div>
          )}
        </div>

        {/* 4. Purchase (Expandable Group: Supplier, Purchase Invoice) */}
        <div className="pt-1">
          <button
            onClick={() => setPurchaseExpanded((prev) => !prev)}
            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center justify-between text-sm font-medium transition-colors whitespace-nowrap ${
              isPurchaseActive
                ? 'text-white bg-slate-800/60'
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-3">
              <Truck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Purchase</span>
            </span>
            {purchaseExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {purchaseExpanded && (
            <div className="mt-1 ml-4 pl-3 border-l border-slate-800 space-y-1">
              <button
                onClick={() => handleSelectModule('purchase-supplier')}
                className={`w-full min-h-[42px] px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeModule === 'purchase-supplier'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span>Supplier</span>
              </button>

              <button
                onClick={() => handleSelectModule('purchase-invoice')}
                className={`w-full min-h-[42px] px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeModule === 'purchase-invoice'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 shrink-0" />
                <span>Purchase Invoice</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. Daily Expenses */}
        <button
          onClick={() => handleSelectModule('daily-expenses')}
          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeModule === 'daily-expenses'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4 shrink-0" />
          <span>Daily Expenses</span>
        </button>

        {/* 6. Report */}
        <button
          onClick={() => handleSelectModule('report')}
          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeModule === 'report'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
          <span>Report</span>
        </button>

        {/* QR & Barcode Mobile Group */}
        <div className="pt-2 pb-1">
          <p className="px-3.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Mobile QR System
          </p>
          <button
            onClick={() => handleSelectModule('qr-scanner')}
            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors whitespace-nowrap ${
              activeModule === 'qr-scanner'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Mobile QR Scanner</span>
          </button>

          <button
            onClick={() => handleSelectModule('qr-labels')}
            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors whitespace-nowrap ${
              activeModule === 'qr-labels'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4 shrink-0 text-blue-400" />
            <span>Garment QR Labels</span>
          </button>
        </div>

        {/* 7. Setting */}
        <button
          onClick={() => handleSelectModule('setting')}
          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeModule === 'setting'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Setting</span>
        </button>
      </nav>

      {/* Signed-in Store Owner Footer */}
      {user && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {user.displayName || 'Store Manager'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Docked Sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 fixed inset-y-0 left-0 z-30 border-r border-slate-800 print:hidden">
        {renderSidebarContent()}
      </aside>

      {/* iPhone / Mobile Slide-Over Sidebar Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex print:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-[280px] max-w-[82vw] h-full z-10 shadow-2xl">
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[260px] print:pl-0 print:m-0">
        {/* Top Bar Contract (Compact 54px Sticky Header for iPhone + 3-Zone Desktop Header) */}
        <header className="sticky top-0 z-30 h-[54px] lg:h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-4 print:hidden">
          {/* Zone 1: Menu Trigger (Mobile) + Breadcrumb Trail */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
              aria-label="Open navigation slidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleSelectModule('dashboard')}
              className="lg:hidden flex items-center shrink-0"
              title="Home"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Next Fit"
                className="w-7 h-7 rounded-full border border-slate-200 bg-black object-cover"
              />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-400 font-medium whitespace-nowrap">
                {currentMeta.group}
              </span>
              <span className="hidden sm:inline text-slate-300" aria-hidden="true">
                /
              </span>
              <h1 className="font-bold text-slate-900 text-base lg:text-lg tracking-tight truncate">
                {currentMeta.title}
              </h1>
            </div>
          </div>

          {/* Zone 2: Desktop Quick Module Links (4 concise single-line links) */}
          <nav className="hidden xl:flex items-center gap-6 text-xs font-medium text-slate-600">
            <button
              onClick={() => handleSelectModule('inventory')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Inventory ({products.length})
            </button>
            <button
              onClick={() => handleSelectModule('sales-invoice')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Sales Billing
            </button>
            <button
              onClick={() => handleSelectModule('purchase-invoice')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Stock Restock
            </button>
            <button
              onClick={() => handleSelectModule('report')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              P&L Report
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action Button + Quick Scan */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setGlobalScannerOpen(true)}
              className="min-h-[40px] px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 border border-slate-200"
              title="Open Mobile Camera QR Scanner"
            >
              <Camera className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>

            {activeModule === 'report' ? (
              <button
                onClick={() => window.print()}
                className="min-h-[40px] px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Report</span>
              </button>
            ) : activeModule === 'purchase-supplier' ? (
              <button
                onClick={() => handleSelectModule('purchase-invoice')}
                className="min-h-[40px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-all whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{currentMeta.ctaLabel || 'New Purchase'}</span>
              </button>
            ) : activeModule !== 'sales-invoice' ? (
              <button
                onClick={() => handleSelectModule('sales-invoice')}
                className="min-h-[40px] px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-all whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>New Sale</span>
              </button>
            ) : (
              <button
                onClick={() => handleSelectModule('inventory')}
                className="min-h-[40px] px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <Package className="w-3.5 h-3.5" />
                <span>View Stock</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Workspace Viewport */}
        <main
          className={`flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-5 pb-32 sm:pb-28 lg:pb-10 max-w-7xl w-full mx-auto ${
            printableReceipt ? 'print:hidden' : ''
          }`}
        >
          {children}
        </main>

        {/* Fixed Bottom Thumb Navigation Bar (iPhone / Mobile Ergonomic Reach Zone) */}
        <nav
          aria-label="Mobile Quick Navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 pb-[env(safe-area-inset-bottom)] print:hidden"
        >
          <div className="grid grid-cols-5 items-center h-[60px] max-w-md mx-auto">
            <button
              onClick={() => handleSelectModule('dashboard')}
              className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors ${
                activeModule === 'dashboard' ? 'text-blue-600 font-semibold' : 'text-slate-500'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap">Home</span>
            </button>

            <button
              onClick={() => handleSelectModule('inventory')}
              className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors ${
                activeModule === 'inventory' ? 'text-blue-600 font-semibold' : 'text-slate-500'
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap">Stock</span>
            </button>

            {/* Center Primary QR Mobile Camera Scanner Trigger */}
            <button
              onClick={() => setGlobalScannerOpen(true)}
              className="min-h-[48px] flex flex-col items-center justify-center -mt-3.5"
              aria-label="Scan QR Code"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 border-2 border-white transition-transform active:scale-95">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-[10px] mt-0.5 font-bold text-blue-600 tracking-tight whitespace-nowrap">
                Scan QR
              </span>
            </button>

            <button
              onClick={() => handleSelectModule('sales-invoice')}
              className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors ${
                activeModule === 'sales-invoice' ? 'text-blue-600 font-semibold' : 'text-slate-500'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap">POS Bill</span>
            </button>

            <button
              onClick={() => setMobileDrawerOpen(true)}
              className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors ${
                mobileDrawerOpen ? 'text-blue-600 font-semibold' : 'text-slate-500'
              }`}
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap">Menu</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Toast Feedback Banner */}
      {toast && (
        <div className="fixed top-16 right-4 left-4 sm:left-auto sm:w-80 z-50 pointer-events-none flex justify-center sm:justify-end print:hidden">
          <div
            className={`px-4 py-3 rounded-2xl shadow-lg border flex items-center gap-2.5 text-xs font-medium backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-red-950/95 text-red-100 border-red-800'
                : toast.type === 'info'
                ? 'bg-slate-900/95 text-slate-100 border-slate-700'
                : 'bg-slate-900/95 text-emerald-300 border-slate-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="text-white">{toast.title}</span>
          </div>
        </div>
      )}

      {/* Printable Receipt / AirPrint Invoice Modal */}
      {printableReceipt && (
        <div id="printable-receipt-modal" className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 print:static print:bg-white print:p-0 print:m-0">
          <div id="printable-receipt-card" className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col print:border-none print:shadow-none print:w-[58mm] print:max-w-[58mm] print:max-h-none print:overflow-visible print:p-0 print:m-0">
            {/* Drag Handle for iPhone */}
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden print:hidden" />

            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between print:hidden">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {printableReceipt.type === 'SALES'
                    ? 'Sales Invoice Receipt'
                    : printableReceipt.type === 'RETURN'
                    ? 'Return & Exchange Voucher'
                    : 'Purchase Voucher'}
                </h3>
                <p className="text-xs text-slate-500">Ready for iPhone AirPrint or Screenshot</p>
              </div>
              <button
                onClick={() => setPrintableReceipt(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-900">
              <div className="text-center border-b border-dashed border-slate-300 pb-4">
                <h2 className="font-bold text-lg tracking-tight text-slate-900">
                  {storeSettings.storeName}
                </h2>
                {storeSettings.tagline && (
                  <p className="text-xs text-slate-500 mt-0.5">{storeSettings.tagline}</p>
                )}
                <p className="text-xs text-slate-600 mt-1">{storeSettings.address}</p>
                <p className="text-xs font-mono tabular-nums text-slate-600 mt-0.5">
                  Tel: {storeSettings.phone}
                </p>
              </div>

              <div className="flex items-start justify-between text-xs gap-4 border-b border-slate-200 pb-3">
                <div>
                  <p className="text-slate-400">
                    {printableReceipt.type === 'PURCHASE' ? 'Supplier' : 'Customer'}
                  </p>
                  <p className="font-semibold text-slate-900 text-sm mt-0.5">
                    {printableReceipt.partyName}
                  </p>
                  {printableReceipt.partyPhone && (
                    <p className="font-mono tabular-nums text-slate-600 mt-0.5">
                      {printableReceipt.partyPhone}
                    </p>
                  )}
                  {printableReceipt.originalInvoiceNumber && (
                    <p className="font-mono text-purple-700 font-semibold text-[11px] mt-1">
                      Ref Invoice: {printableReceipt.originalInvoiceNumber}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-mono tabular-nums font-bold text-slate-900 text-sm">
                    {printableReceipt.invoiceNumber}
                  </p>
                  <p className="font-mono tabular-nums text-slate-500 mt-0.5">
                    Date: {printableReceipt.date}
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    {printableReceipt.type === 'RETURN'
                      ? `${printableReceipt.returnTypeLabel || 'Return'} · ${printableReceipt.paymentMethod}`
                      : `Via ${printableReceipt.paymentMethod} · ${printableReceipt.status}`}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  {printableReceipt.type === 'RETURN'
                    ? 'Return & Exchange Details'
                    : `Garment Line Items (${printableReceipt.itemsCount} pcs)`}
                </p>
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                  {printableReceipt.itemsSummary.split(' · ').map((line, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-2 py-1 border-b border-slate-200/60 last:border-0 font-mono tabular-nums text-slate-800"
                    >
                      <span>{line}</span>
                    </div>
                  ))}
                  {printableReceipt.returnReason && (
                    <div className="pt-1.5 text-[11px] font-sans text-slate-500 border-t border-slate-200">
                      <strong>Reason:</strong> {printableReceipt.returnReason}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 border-t border-slate-200 pt-3 text-xs font-mono tabular-nums">
                {printableReceipt.type === 'RETURN' ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Adjustment / Refund Amount</span>
                      <span className="font-bold text-slate-900">{formatBDT(printableReceipt.grandTotal, sym)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Settlement Mode</span>
                      <span>{printableReceipt.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Status</span>
                      <span className="font-semibold text-emerald-600">Processed</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>{formatBDT(printableReceipt.subtotal, sym)}</span>
                    </div>
                    {printableReceipt.discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount</span>
                        <span>-{formatBDT(printableReceipt.discount, sym)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                      <span>Grand Total</span>
                      <span>{formatBDT(printableReceipt.grandTotal, sym)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Paid Amount ({printableReceipt.paymentMethod})</span>
                      <span>{formatBDT(printableReceipt.paidAmount, sym)}</span>
                    </div>
                    <div
                      className={`flex justify-between font-bold pt-1 ${
                        printableReceipt.dueAmount > 0 ? 'text-red-600' : 'text-slate-500'
                      }`}
                    >
                      <span>Balance Due</span>
                      <span>{formatBDT(printableReceipt.dueAmount, sym)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Receipt Verification QR Code */}
              {receiptQrUrl && (
                <div className="flex flex-col items-center justify-center pt-3 border-t border-dashed border-slate-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={receiptQrUrl}
                    alt="Receipt QR"
                    className="w-24 h-24 object-contain print:w-20 print:h-20"
                  />
                  <p className="text-[10px] font-mono text-slate-500 mt-1">
                    Scan QR to Verify & Process Returns
                  </p>
                </div>
              )}

              {storeSettings.invoiceFooterNote && (
                <p className="text-[11px] text-center text-slate-500 border-t border-dashed border-slate-300 pt-3">
                  {storeSettings.invoiceFooterNote}
                </p>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-2.5 print:hidden">
              {/* Primary Bluetooth Print Row */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDirectBluetoothPrint}
                  disabled={btPrinting}
                  className="flex-1 min-h-[46px] px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Bluetooth className={`w-4 h-4 ${btPrinting ? 'animate-spin' : ''}`} />
                  <span>
                    {btPrinting
                      ? 'Connecting & Printing...'
                      : btPrinterName
                      ? `Print via ${btPrinterName}`
                      : 'Direct Bluetooth Print (MP-58T)'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIosHelpOpen(true)}
                  className="min-h-[46px] px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 shrink-0"
                  title="iOS Printer Setup Guide"
                >
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">iOS Guide</span>
                </button>
              </div>

              {/* Secondary Options: iOS App Share, WhatsApp, Web 58mm Print */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleShareToIosPrinterApp}
                  className="min-h-[42px] px-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  title="Send to iPhone Printer App (DLabel, Thermer, POS-Printer)"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="truncate">iOS App Share</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsAppReceipt}
                  className="min-h-[42px] px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="truncate">WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="min-h-[42px] px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="truncate">AirPrint (58mm)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPrintableReceipt(null)}
                className="w-full min-h-[38px] rounded-xl border border-slate-200 bg-white text-slate-500 font-medium text-xs hover:bg-slate-50"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Camera QR Scanner Modal */}
      <QrCameraScannerModal
        isOpen={globalScannerOpen}
        onClose={() => setGlobalScannerOpen(false)}
        continuousMode={true}
        title="POS Garment Barcode & QR Scanner"
        subtitle="Point camera at tags to continuously add multiple garments to POS"
      />

      {/* iOS Bluetooth Printer (MP-58T) User Setup Guide Modal */}
      {iosHelpOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Bluetooth className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    iPhone-এ MP-58T প্রিন্টার কানেকশন গাইড
                  </h3>
                  <p className="text-[11px] text-slate-500">iOS Bluetooth Thermal Setup</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIosHelpOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80">
                <p className="font-bold text-amber-900 mb-1">
                  💡 অ্যাপল (Apple)-এর ব্লুটুথ নিয়ম:
                </p>
                <p className="text-amber-800 text-[11px]">
                  iPhone-এর সাধারণ Safari ব্রাউজার সরাসরি ব্লুটুথ ডিভাইস ব্লক করে রাখে। তাই নিচের যেকোনো ১টি উপায়ে সহজে প্রিন্ট করতে পারবেন:
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <p className="font-bold text-slate-900 text-xs">
                  পদ্ধতি ১: ১-ক্লিকে ব্লুটুথ প্রিন্ট (Bluefy Browser)
                </p>
                <p className="text-slate-600 text-[11px]">
                  ১. iPhone App Store থেকে সম্পূর্ণ ফ্রি <strong>&quot;Bluefy – Web BLE Browser&quot;</strong> অ্যাপটি নামিয়ে নিন।<br />
                  ২. এই অ্যাপের ভেতর আমাদের ERP ওয়েবসাইটের লিংকে ঢুকুন।<br />
                  ৩. <strong>&quot;Direct Bluetooth Print&quot;</strong> বাটনে চাপলেই MP-58T পেয়ে যাবে এবং সরাসরি প্রিন্ট হবে!
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <p className="font-bold text-slate-900 text-xs">
                  পদ্ধতি ২: সাধারণ Safari ব্রাউজার ব্যবহার করলে (iOS App Share)
                </p>
                <p className="text-slate-600 text-[11px]">
                  ১. আপনি বর্তমানে যে অ্যাপ দিয়ে প্রিন্টারে টেস্ট করেছেন (যেমন: <em>DLabel, Thermer বা WalkPrint</em>) সেটি চালু রাখুন।<br />
                  ২. ইনভয়েসের <strong>&quot;iOS App Share&quot;</strong> বাটনে চাপ দিন।<br />
                  ৩. শেয়ার লিস্ট থেকে আপনার প্রিন্টার অ্যাপটি সিলেক্ট করলেই রসিদ প্রিন্ট হয়ে যাবে।
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIosHelpOpen(false)}
              className="w-full min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
            >
              বুঝেছি, বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
