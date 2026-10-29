'use client';

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Camera,
  Printer,
  Download,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Package,
  Layers,
  ArrowRight,
  Filter,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { useErp } from '@/context/erp-context';
import { Product, formatBDT } from '@/lib/types';
import { generateQrDataUrl, encodeProductQr } from '@/lib/qr-utils';
import { QrCameraScannerModal } from './qr-camera-scanner-modal';

/* ============================================================================
   1. SINGLE PRODUCT QR MODAL (Thermal / Sticker Print)
   ============================================================================ */
interface SingleProductQrModalProps {
  product: Product | null;
  onClose: () => void;
}

export function SingleProductQrModal({ product, onClose }: SingleProductQrModalProps) {
  const { storeSettings } = useErp();
  const [qrUrl, setQrUrl] = useState<string>('');
  const sym = storeSettings.currencySymbol || '৳';

  useEffect(() => {
    if (!product) {
      setQrUrl('');
      return;
    }
    const payload = encodeProductQr(product.sku);
    generateQrDataUrl(payload, { width: 300, margin: 1 }).then(setQrUrl);
  }, [product]);

  if (!product) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Garment QR Label</h3>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Sticker Box (Designed for standard 50x30mm thermal or tag print) */}
        <div className="p-6 flex flex-col items-center justify-center text-center">
          <div
            id="single-qr-sticker"
            className="w-full max-w-[280px] p-4 bg-white border-2 border-slate-900 rounded-xl space-y-2 text-slate-900 shadow-sm print:border-black print:shadow-none print:w-[50mm] print:h-[35mm] print:p-2"
          >
            <div className="border-b border-dashed border-slate-300 pb-1.5 print:pb-1">
              <p className="font-extrabold text-xs uppercase tracking-wider text-slate-900 print:text-[10px]">
                {storeSettings.storeName || 'ThreadCraft'}
              </p>
              <p className="font-bold text-sm text-slate-900 truncate mt-0.5 print:text-xs">
                {product.name}
              </p>
            </div>

            {/* QR Code Graphic */}
            <div className="flex justify-center py-1">
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt={`QR for ${product.sku}`}
                  className="w-36 h-36 object-contain print:w-24 print:h-24"
                />
              ) : (
                <div className="w-36 h-36 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-0.5 text-xs print:text-[9px]">
              <div className="flex items-center justify-between font-medium">
                <span>{product.category}</span>
                <span>Size: <strong className="font-bold">{product.size}</strong></span>
                <span>{product.color}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="font-mono text-[11px] font-semibold text-slate-600 print:text-[8px]">
                  {product.sku}
                </span>
                <span className="font-bold font-mono text-sm text-slate-900 print:text-xs">
                  {formatBDT(product.sellingPrice, sym)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2 print:hidden">
          {qrUrl && (
            <a
              href={qrUrl}
              download={`${product.sku}-qr.png`}
              className="flex-1 min-h-[44px] px-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </a>
          )}
          <button
            onClick={handlePrint}
            className="flex-1 min-h-[44px] px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Label</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   2. QR LABELS BATCH PRINT VIEW (Sticker Sheets & Catalog)
   ============================================================================ */
export function QrLabelsPrintView() {
  const { products, allCategories, storeSettings, setActiveModule } = useErp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [singleModalProduct, setSingleModalProduct] = useState<Product | null>(null);

  const sym = storeSettings.currencySymbol || '৳';

  // Filter products
  const filtered = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.size.toLowerCase().includes(q) ||
      p.color.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  // Pre-generate QR codes for visible products
  useEffect(() => {
    let isMounted = true;
    async function genAll() {
      const entries: Record<string, string> = {};
      for (const p of filtered) {
        if (!qrMap[p.id]) {
          const url = await generateQrDataUrl(encodeProductQr(p.sku), {
            width: 180,
            margin: 1,
          });
          entries[p.id] = url;
        }
      }
      if (isMounted && Object.keys(entries).length > 0) {
        setQrMap((prev) => ({ ...prev, ...entries }));
      }
    }
    genAll();
    return () => {
      isMounted = false;
    };
  }, [filtered, qrMap]);

  // Select all / deselect all
  const handleToggleSelectAll = () => {
    if (selectedProductIds.length === filtered.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filtered.map((p) => p.id));
    }
  };

  const handleToggleItem = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handlePrintSelected = () => {
    window.print();
  };

  const printList =
    selectedProductIds.length > 0
      ? filtered.filter((p) => selectedProductIds.includes(p.id))
      : filtered;

  return (
    <div className="space-y-6">
      {/* Top Banner & Controls (Hidden when printing) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              <span>Garment QR & Barcode Label Center</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Print sticker labels for your garments with scannable QR, Category, Size, Price, and SKU.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModule('qr-scanner')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4 text-blue-600" />
              <span>Open Scanner</span>
            </button>
            <button
              onClick={handlePrintSelected}
              disabled={printList.length === 0}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>
                Print Labels ({printList.length}{' '}
                {selectedProductIds.length > 0 ? 'Selected' : 'All Visible'})
              </span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU, size, or color..."
              className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
            >
              <option value="All">All Categories ({products.length} items)</option>
              {allCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3 flex items-center">
            <button
              onClick={handleToggleSelectAll}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2"
            >
              {selectedProductIds.length === filtered.length && filtered.length > 0 ? (
                <>
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-slate-400" />
                  <span>Select All ({filtered.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Garment QR Labels (Both on-screen and print layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3 print:gap-3">
        {printList.map((product) => {
          const isSelected = selectedProductIds.includes(product.id);
          const qrData = qrMap[product.id];

          return (
            <div
              key={product.id}
              className={`bg-white rounded-2xl border p-4 flex flex-col justify-between transition-all relative ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              } print:border-slate-900 print:shadow-none print:break-inside-avoid print:p-2.5`}
            >
              {/* Checkbox for selection (Hidden when printing) */}
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-dashed border-slate-200 print:pb-1">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 print:text-black">
                    {storeSettings.storeName || 'ThreadCraft'}
                  </p>
                  <h4 className="font-bold text-sm text-slate-900 truncate print:text-xs">
                    {product.name}
                  </h4>
                </div>

                <button
                  onClick={() => handleToggleItem(product.id)}
                  className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 print:hidden"
                  aria-label="Select sticker"
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300" />
                  )}
                </button>
              </div>

              {/* QR Image */}
              <div className="flex items-center justify-center py-2.5 print:py-1">
                {qrData ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrData}
                    alt={product.sku}
                    className="w-28 h-28 object-contain print:w-20 print:h-20"
                  />
                ) : (
                  <div className="w-28 h-28 bg-slate-50 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                    Loading...
                  </div>
                )}
              </div>

              {/* Garment Metadata */}
              <div className="space-y-1 text-xs pt-2 border-t border-slate-100 print:pt-1 print:text-[10px]">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-semibold text-slate-900">{product.category}</span>
                  <span>
                    Size: <strong className="text-slate-900 font-bold">{product.size}</strong>
                  </span>
                  <span>{product.color}</span>
                </div>

                <div className="flex items-center justify-between font-mono pt-1 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 print:text-[8px]">
                    {product.sku}
                  </span>
                  <span className="font-bold text-sm text-slate-900 print:text-xs">
                    {formatBDT(product.sellingPrice, sym)}
                  </span>
                </div>
              </div>

              {/* Single item preview trigger (Hidden on print) */}
              <div className="pt-3 flex gap-2 print:hidden">
                <button
                  onClick={() => setSingleModalProduct(product)}
                  className="w-full min-h-[36px] px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Single Sticker</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {singleModalProduct && (
        <SingleProductQrModal
          product={singleModalProduct}
          onClose={() => setSingleModalProduct(null)}
        />
      )}
    </div>
  );
}

/* ============================================================================
   3. QR SCANNER VIEW (Full Page Mobile Hub)
   ============================================================================ */
export function QrScannerView() {
  const { products, salesInvoices, salesOrders, setActiveModule } = useErp();
  const [scannerModalOpen, setScannerModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Hero Action Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="max-w-xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold backdrop-blur-md border border-blue-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mobile Camera Ready</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Mobile QR & Barcode System
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Scan any garment price tag, cutting bundle, or invoice paper with your phone camera to instantly look up stock, adjust quantities, process sales, or collect customer dues.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setScannerModalOpen(true)}
              className="min-h-[50px] px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all"
            >
              <Camera className="w-5 h-5" />
              <span>Launch Camera Scanner</span>
            </button>

            <button
              onClick={() => setActiveModule('qr-labels')}
              className="min-h-[50px] px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm flex items-center justify-center gap-2 backdrop-blur-md border border-white/15 transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Print QR Stickers</span>
            </button>
          </div>
        </div>

        {/* Decorative Watermark */}
        <QrCode className="absolute -right-8 -bottom-8 w-64 h-64 text-white/5 pointer-events-none" />
      </div>

      {/* Quick Feature Explanation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Garment Stock QR</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every garment has an encoded SKU QR code. Scanning it shows in-stock count, cost, selling price, and lets you add stock (+1, +5) with a single tap.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Instant POS Barcode Billing</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            In the Sales Billing screen, open the camera to scan clothing tags continuously. Items get added to the customer&apos;s cart automatically with sound beeps!
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Invoice Receipt QR</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Printed receipts carry an invoice QR code. When a customer brings a voucher for return or due payment, scan the receipt to open their account instantly.
          </p>
        </div>
      </div>

      {/* Launch Scanner Modal */}
      <QrCameraScannerModal
        isOpen={scannerModalOpen}
        onClose={() => setScannerModalOpen(false)}
      />
    </div>
  );
}

