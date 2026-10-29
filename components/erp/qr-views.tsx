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
  const [labelLayout, setLabelLayout] = useState<'landscape' | 'portrait'>('landscape');
  const sym = storeSettings.currencySymbol || '৳';

  useEffect(() => {
    let active = true;
    if (!product) {
      Promise.resolve('').then((val) => {
        if (active) setQrUrl(val);
      });
      return () => {
        active = false;
      };
    }
    const payload = encodeProductQr(product.sku);
    generateQrDataUrl(payload, { width: 300, margin: 1 }).then((url) => {
      if (active) setQrUrl(url);
    });
    return () => {
      active = false;
    };
  }, [product]);

  if (!product) return null;

  const handlePrint = () => {
    const brandName =
      storeSettings.storeName && !storeSettings.storeName.includes('ThreadCraft')
        ? storeSettings.storeName
        : 'NEXT FIT';
    const priceFormatted = `${sym}${Number(product.sellingPrice).toLocaleString()}`;

    // Open clean, isolated print window strictly sized for 58mm / thermal label
    const printWindow = window.open('', '_blank', 'width=380,height=420');
    if (!printWindow) {
      window.print();
      return;
    }

    const isLandscape = labelLayout === 'landscape';

    printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${product.name} - NEXT FIT Label</title>
    <style>
      @page {
        size: 58mm auto;
        margin: 0 !important;
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        width: 58mm;
        max-width: 58mm;
        margin: 0 auto;
        padding: 1.5mm;
        background: #fff;
        color: #000;
        display: flex;
        justify-content: center;
        align-items: center;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        overflow: hidden !important;
      }
      ${
        isLandscape
          ? `
      /* Horizontal 50x30mm Thermal Label */
      .label-card {
        width: 52mm;
        max-width: 52mm;
        height: 28mm;
        max-height: 29mm;
        border: 1.5px solid #000;
        border-radius: 4px;
        padding: 1.5mm;
        display: flex;
        align-items: center;
        gap: 2mm;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .qr-col {
        width: 20mm;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .qr-img {
        width: 20mm;
        height: 20mm;
        object-fit: contain;
        display: block;
      }
      .info-col {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
        text-align: left;
      }
      .brand-title {
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        border-bottom: 1px dashed #555;
        padding-bottom: 1px;
        margin-bottom: 1px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .item-title {
        font-size: 9px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
        margin-bottom: 1px;
      }
      .specs-line {
        font-size: 8px;
        color: #222;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 1px;
      }
      .price-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        border-top: 1px solid #000;
        padding-top: 1px;
        margin-top: 1px;
      }
      .sku-text {
        font-size: 8px;
        font-family: monospace;
        font-weight: 600;
      }
      .price-tag {
        font-size: 11.5px;
        font-weight: 900;
      }
      `
          : `
      /* Vertical 50x32mm Thermal Label */
      .label-card {
        width: 50mm;
        max-width: 50mm;
        height: 31mm;
        max-height: 32mm;
        border: 1.5px solid #000;
        border-radius: 4px;
        padding: 1.5mm;
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .brand-title {
        font-size: 9.5px;
        font-weight: 900;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        border-bottom: 1px dashed #555;
        padding-bottom: 1px;
      }
      .item-title {
        font-size: 8.5px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .qr-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .qr-img {
        width: 16mm;
        height: 16mm;
        object-fit: contain;
        display: block;
      }
      .specs-row {
        display: flex;
        justify-content: space-between;
        font-size: 8px;
        font-weight: 600;
      }
      .price-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 8px;
        font-family: monospace;
        border-top: 1px solid #000;
        padding-top: 1px;
      }
      .price-tag {
        font-size: 11px;
        font-weight: 900;
      }
      `
      }
    </style>
  </head>
  <body>
    ${
      isLandscape
        ? `
    <div class="label-card">
      <div class="qr-col">
        <img src="${qrUrl}" class="qr-img" alt="QR" />
      </div>
      <div class="info-col">
        <div class="brand-title">${brandName}</div>
        <div class="item-title">${product.name}</div>
        <div class="specs-line">${product.category} · Size ${product.size} · ${product.color}</div>
        <div class="price-row">
          <span class="sku-text">${product.sku}</span>
          <span class="price-tag">${priceFormatted}</span>
        </div>
      </div>
    </div>
    `
        : `
    <div class="label-card">
      <div class="brand-title">${brandName}</div>
      <div class="item-title">${product.name}</div>
      <div class="qr-wrapper">
        <img src="${qrUrl}" class="qr-img" alt="QR" />
      </div>
      <div class="specs-row">
        <span>${product.category}</span>
        <span>Size: <strong>${product.size}</strong></span>
        <span>${product.color}</span>
      </div>
      <div class="price-row">
        <span>${product.sku}</span>
        <span class="price-tag">${priceFormatted}</span>
      </div>
    </div>
    `
    }
    <script>
      window.onload = function() {
        window.focus();
        window.print();
        setTimeout(function() { window.close(); }, 600);
      };
    </script>
  </body>
</html>`);
    printWindow.document.close();
  };

  const brandDisplayName =
    storeSettings.storeName && !storeSettings.storeName.includes('ThreadCraft')
      ? storeSettings.storeName
      : 'NEXT FIT';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 print:static print:bg-white print:p-0">
      <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:w-auto print:max-w-none">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">58mm Garment QR Label</h3>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orientation Selector Tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-100 flex gap-2 print:hidden">
          <button
            type="button"
            onClick={() => setLabelLayout('landscape')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
              labelLayout === 'landscape'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            🏷️ Horizontal (50×30mm)
          </button>
          <button
            type="button"
            onClick={() => setLabelLayout('portrait')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
              labelLayout === 'portrait'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            📋 Vertical (50×32mm)
          </button>
        </div>

        {/* Printable Sticker Live Preview */}
        <div className="p-6 flex flex-col items-center justify-center text-center print:p-0">
          {labelLayout === 'landscape' ? (
            /* Horizontal Preview (Side-by-side 50x30mm) */
            <div
              id="single-qr-sticker"
              className="w-full max-w-[280px] p-3 bg-white border-2 border-slate-900 rounded-xl space-x-2.5 text-slate-900 shadow-sm flex items-center text-left"
            >
              <div className="w-20 shrink-0 flex items-center justify-center">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrUrl}
                    alt={`QR for ${product.sku}`}
                    className="w-20 h-20 object-contain"
                  />
                ) : (
                  <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                    Generating...
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 space-y-1">
                <div className="border-b border-dashed border-slate-300 pb-1">
                  <p className="font-black text-[11px] uppercase tracking-wider text-slate-900 truncate">
                    {brandDisplayName}
                  </p>
                  <p className="font-bold text-xs text-slate-900 truncate">
                    {product.name}
                  </p>
                </div>
                <p className="text-[10px] text-slate-600 truncate">
                  {product.category} · Size <strong className="font-bold">{product.size}</strong> · {product.color}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs font-mono">
                  <span className="text-[10px] text-slate-500 font-semibold">{product.sku}</span>
                  <span className="font-extrabold text-slate-900">
                    {formatBDT(product.sellingPrice, sym)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Vertical Preview (Compact 50x32mm) */
            <div
              id="single-qr-sticker"
              className="w-full max-w-[240px] p-3.5 bg-white border-2 border-slate-900 rounded-xl space-y-1.5 text-slate-900 shadow-sm text-center"
            >
              <div className="border-b border-dashed border-slate-300 pb-1">
                <p className="font-black text-xs uppercase tracking-wider text-slate-900">
                  {brandDisplayName}
                </p>
                <p className="font-bold text-xs text-slate-900 truncate mt-0.5">
                  {product.name}
                </p>
              </div>

              <div className="flex justify-center py-0.5">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrUrl}
                    alt={`QR for ${product.sku}`}
                    className="w-24 h-24 object-contain"
                  />
                ) : (
                  <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                    Generating...
                  </div>
                )}
              </div>

              <div className="space-y-0.5 text-xs">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-700">
                  <span>{product.category}</span>
                  <span>Size: <strong>{product.size}</strong></span>
                  <span>{product.color}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-mono">
                  <span className="text-[10px] text-slate-500 font-semibold">{product.sku}</span>
                  <span className="font-black text-sm text-slate-900">
                    {formatBDT(product.sellingPrice, sym)}
                  </span>
                </div>
              </div>
            </div>
          )}
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
            <span>Print 1-Page Label</span>
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

