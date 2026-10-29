'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  Camera,
  RefreshCw,
  Flashlight,
  AlertCircle,
  CheckCircle2,
  Package,
  FileText,
  ClipboardList,
  Sparkles,
  ArrowRight,
  Plus,
  Minus,
  Upload,
  Keyboard,
  Maximize2,
} from 'lucide-react';
import { useErp } from '@/context/erp-context';
import {
  parseScannedCode,
  playScanSound,
  triggerScanHaptic,
  ScannedCodeResult,
  encodeProductQr,
} from '@/lib/qr-utils';
import { Product, SalesInvoice, SalesOrder, formatBDT } from '@/lib/types';

interface QrCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  // If provided, handles item scan directly (e.g. In POS Billing to add item to cart)
  onScanItem?: (product: Product) => void;
  title?: string;
  subtitle?: string;
  continuousMode?: boolean; // If true, doesn't close on single scan
}

export function QrCameraScannerModal({
  isOpen,
  onClose,
  onScanItem,
  title = 'Mobile QR & Barcode Scanner',
  subtitle = 'Point camera at any garment QR sticker or paper receipt',
  continuousMode = false,
}: QrCameraScannerModalProps) {
  const {
    products,
    salesInvoices,
    salesOrders,
    storeSettings,
    setActiveModule,
    adjustProductStock,
    showToast,
    setPendingOrderForInvoice,
    openReturnForInvoice,
  } = useErp();

  const sym = storeSettings.currencySymbol || '৳';

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [scannedResult, setScannedResult] = useState<ScannedCodeResult | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [matchedInvoice, setMatchedInvoice] = useState<SalesInvoice | null>(null);
  const [matchedOrder, setMatchedOrder] = useState<SalesOrder | null>(null);
  const [lastScannedText, setLastScannedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [continuousCount, setContinuousCount] = useState(0);

  const scannerRef = useRef<unknown>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const readerElementId = 'threadcraft-qr-reader';

  // Handle scanned string
  const handleDecodedString = useCallback(
    (decodedText: string) => {
      if (!decodedText || isProcessing) return;

      // Throttle immediate duplicate scan within 1.5 seconds if continuous
      if (decodedText === lastScannedText && Date.now() - (handleDecodedString as unknown as { lastTime?: number }).lastTime! < 1500) {
        return;
      }
      (handleDecodedString as unknown as { lastTime?: number }).lastTime = Date.now();

      playScanSound();
      triggerScanHaptic();

      setIsProcessing(true);
      setLastScannedText(decodedText);

      const parsed = parseScannedCode(decodedText);
      setScannedResult(parsed);

      // Search in Database
      const foundProduct = products.find(
        (p) =>
          p.sku.toLowerCase() === parsed.identifier.toLowerCase() ||
          p.id.toLowerCase() === parsed.identifier.toLowerCase() ||
          decodedText.toLowerCase().includes(p.sku.toLowerCase())
      );

      const foundInvoice = salesInvoices.find(
        (inv) =>
          inv.invoiceNumber.toLowerCase() === parsed.identifier.toLowerCase() ||
          inv.id.toLowerCase() === parsed.identifier.toLowerCase()
      );

      const foundOrder = salesOrders.find(
        (ord) =>
          ord.orderNumber.toLowerCase() === parsed.identifier.toLowerCase() ||
          ord.id.toLowerCase() === parsed.identifier.toLowerCase()
      );

      setMatchedProduct(foundProduct || null);
      setMatchedInvoice(foundInvoice || null);
      setMatchedOrder(foundOrder || null);

      if (onScanItem && foundProduct) {
        onScanItem(foundProduct);
        setContinuousCount((c) => c + 1);
        showToast(`Scanned: ${foundProduct.name} (${foundProduct.size})`, 'success');

        if (!continuousMode) {
          setTimeout(() => {
            setIsProcessing(false);
            onClose();
          }, 400);
          return;
        }
      }

      setTimeout(() => {
        setIsProcessing(false);
      }, 800);
    },
    [
      isProcessing,
      lastScannedText,
      products,
      salesInvoices,
      salesOrders,
      onScanItem,
      continuousMode,
      showToast,
      onClose,
    ]
  );

  // Initialize camera scanner when modal opens
  useEffect(() => {
    if (!isOpen) {
      setScannedResult(null);
      setMatchedProduct(null);
      setMatchedInvoice(null);
      setMatchedOrder(null);
      setLastScannedText('');
      setContinuousCount(0);
      return;
    }

    let isMounted = true;
    let html5QrCodeInstance: any = null;

    async function startScanner() {
      try {
        setCameraError(null);
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

        if (!isMounted) return;

        const container = document.getElementById(readerElementId);
        if (!container) return;

        html5QrCodeInstance = new Html5Qrcode(readerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.UPC_A,
          ],
          verbose: false,
        });
        scannerRef.current = html5QrCodeInstance;

        // Query available cameras
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back / environment camera
          const backCam =
            devices.find(
              (d) =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('rear') ||
                d.label.toLowerCase().includes('environment')
            ) || devices[0];
          setSelectedCameraId(backCam.id);

          await html5QrCodeInstance.start(
            backCam.id,
            {
              fps: 15,
              qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                const edge = Math.floor(minEdge * 0.75);
                return { width: edge, height: edge };
              },
              aspectRatio: 1.0,
            },
            (decodedText: string) => {
              handleDecodedString(decodedText);
            },
            () => {
              // frame scanned without QR, ignore
            }
          );
        } else {
          // Fallback to constraint mode
          await html5QrCodeInstance.start(
            { facingMode: 'environment' },
            {
              fps: 15,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText: string) => {
              handleDecodedString(decodedText);
            },
            () => {}
          );
        }

        if (isMounted) {
          setCameraActive(true);
        }
      } catch (err: any) {
        console.error('Camera QR start error:', err);
        if (isMounted) {
          setCameraError(
            err?.message ||
              'Unable to access mobile camera. Please ensure camera permissions are allowed in your browser settings.'
          );
          setCameraActive(false);
        }
      }
    }

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        try {
          const scanner = scannerRef.current as any;
          if (scanner.isScanning) {
            scanner.stop().then(() => {
              scanner.clear();
            }).catch((e: any) => console.debug('QR stop error:', e));
          } else {
            scanner.clear();
          }
        } catch (e) {
          console.debug('Error clearing scanner:', e);
        }
        scannerRef.current = null;
      }
    };
  }, [isOpen, handleDecodedString]);

  // Switch camera
  const handleSwitchCamera = async () => {
    if (!scannerRef.current || cameras.length < 2) return;
    const scanner = scannerRef.current as any;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCamera = cameras[nextIndex];
      setSelectedCameraId(nextCamera.id);

      await scanner.start(
        nextCamera.id,
        {
          fps: 15,
          qrbox: (w: number, h: number) => {
            const edge = Math.floor(Math.min(w, h) * 0.75);
            return { width: edge, height: edge };
          },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          handleDecodedString(decodedText);
        },
        () => {}
      );
    } catch (err: any) {
      console.error('Failed to switch camera:', err);
    }
  };

  // Image file scan fallback
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const tempScanner = new Html5Qrcode('threadcraft-qr-file-temp');
      const decodedResult = await tempScanner.scanFile(file, true);
      handleDecodedString(decodedResult);
      tempScanner.clear();
    } catch (err: any) {
      showToast('No readable QR code found in the selected image', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Manual code submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDecodedString(manualInput.trim());
    setManualInput('');
    setShowManualInput(false);
  };

  // Stock quick adjustment
  const handleQuickStockChange = async (delta: number) => {
    if (!matchedProduct) return;
    const newStock = Math.max(0, matchedProduct.stock + delta);
    await adjustProductStock(matchedProduct.id, newStock);
    setMatchedProduct({ ...matchedProduct, stock: newStock });
    showToast(`Stock updated to ${newStock} pcs`, 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[94vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* iOS Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                {title}
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[240px] sm:max-w-xs">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden temp div for file scan */}
        <div id="threadcraft-qr-file-temp" className="hidden" />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Continuous Count Pill */}
          {continuousCount > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs text-emerald-800">
              <span className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Items Scanned to Cart:
              </span>
              <span className="font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-lg">
                {continuousCount} pcs
              </span>
            </div>
          )}

          {/* Camera Viewfinder Box */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square max-w-[340px] mx-auto border-2 border-slate-800 shadow-inner flex items-center justify-center">
            {/* HTML5 QR Container */}
            <div id={readerElementId} className="w-full h-full [&>video]:object-cover" />

            {/* Viewfinder Target Reticle Overlay */}
            {cameraActive && !cameraError && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-52 h-52 border-2 border-blue-400/80 rounded-2xl relative shadow-lg">
                  {/* Corner Target Accents */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-blue-500 rounded-tl-md" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-blue-500 rounded-tr-md" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-blue-500 rounded-bl-md" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-blue-500 rounded-br-md" />

                  {/* Animated Laser Scanning Beam */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent absolute top-0 animate-[bounce_2s_infinite]" />
                </div>
              </div>
            )}

            {/* Camera Permission / Error Fallback */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-900 p-6 flex flex-col items-center justify-center text-center text-white space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-400" />
                <p className="text-xs font-semibold text-amber-300">Camera Access Notice</p>
                <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
                <div className="pt-2 flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 min-h-[44px] px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload QR Photo</span>
                  </button>
                  <button
                    onClick={() => setShowManualInput(true)}
                    className="flex-1 min-h-[44px] px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Keyboard className="w-4 h-4" />
                    <span>Type SKU</span>
                  </button>
                </div>
              </div>
            )}

            {/* Camera Controls Overlay (Top Right) */}
            {cameraActive && !cameraError && (
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {cameras.length > 1 && (
                  <button
                    onClick={handleSwitchCamera}
                    className="w-10 h-10 rounded-xl bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center hover:bg-slate-800 transition-colors shadow-md"
                    title="Switch Camera (Front/Rear)"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Action Toolbar Below Viewfinder */}
          <div className="flex items-center justify-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileScan}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Upload / Gallery</span>
            </button>

            <button
              onClick={() => setShowManualInput((prev) => !prev)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2"
            >
              <Keyboard className="w-4 h-4 text-slate-500" />
              <span>Enter Barcode/SKU</span>
            </button>
          </div>

          {/* Manual Input Form */}
          {showManualInput && (
            <form onSubmit={handleManualSubmit} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Type SKU / Barcode / Invoice Number:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g. PNT-32-101 or INV-2026-001"
                  className="flex-1 min-h-[44px] px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 uppercase"
                />
                <button
                  type="submit"
                  className="min-h-[44px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                >
                  Lookup
                </button>
              </div>
            </form>
          )}

          {/* Scanned Result Card */}
          {scannedResult && (
            <div className="border border-blue-200 bg-blue-50/50 rounded-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-600 text-white">
                  {matchedProduct
                    ? 'Garment Item Matched'
                    : matchedInvoice
                    ? 'Sales Invoice Matched'
                    : matchedOrder
                    ? 'Sales Order Matched'
                    : 'Unknown Code'}
                </span>
                <span className="text-xs font-mono text-slate-600">
                  {scannedResult.identifier}
                </span>
              </div>

              {/* 1. Matched Product Details */}
              {matchedProduct && (
                <div className="bg-white rounded-xl border border-blue-100 p-3.5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {matchedProduct.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-blue-700">
                          {matchedProduct.category}
                        </span>
                        <span>·</span>
                        <span>Size: {matchedProduct.size}</span>
                        <span>·</span>
                        <span>Color: {matchedProduct.color}</span>
                        <span>·</span>
                        <span className="font-mono text-slate-700">SKU: {matchedProduct.sku}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-slate-900 text-sm">
                        {formatBDT(matchedProduct.sellingPrice, sym)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Cost: {formatBDT(matchedProduct.purchasePrice, sym)}
                      </p>
                    </div>
                  </div>

                  {/* Stock Indicator & Quick Adjust */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-slate-500">In Stock:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-lg ${
                          matchedProduct.stock <= matchedProduct.minStockAlert
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {matchedProduct.stock} pcs
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuickStockChange(-1)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                        title="Reduce 1 Stock"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleQuickStockChange(1)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                        title="Add 1 Stock"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleQuickStockChange(5)}
                        className="px-2 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs flex items-center justify-center"
                        title="Add 5 Stock"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-1 flex flex-col sm:flex-row gap-2">
                    {onScanItem ? (
                      <button
                        onClick={() => {
                          onScanItem(matchedProduct);
                          setContinuousCount((c) => c + 1);
                          showToast(`Added another ${matchedProduct.name}`, 'success');
                        }}
                        className="flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add +1 to Cart</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setActiveModule('sales-invoice');
                            onClose();
                          }}
                          className="flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Open POS Bill with Item</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveModule('inventory');
                            onClose();
                          }}
                          className="min-h-[44px] px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <Package className="w-4 h-4 text-slate-600" />
                          <span>View in Inventory</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 2. Matched Sales Invoice */}
              {matchedInvoice && (
                <div className="bg-white rounded-xl border border-blue-100 p-3.5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm font-mono">
                        {matchedInvoice.invoiceNumber}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Customer: {matchedInvoice.customerName} ({matchedInvoice.customerPhone})
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
                        Date: {matchedInvoice.invoiceDate} · {matchedInvoice.itemsCount} pcs
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-slate-900 text-sm">
                        {formatBDT(matchedInvoice.grandTotal, sym)}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          matchedInvoice.dueAmount > 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {matchedInvoice.dueAmount > 0
                          ? `Due: ${formatBDT(matchedInvoice.dueAmount, sym)}`
                          : 'Paid Full'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setActiveModule('sales-invoice');
                        onClose();
                      }}
                      className="flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Invoice & Collect Due</span>
                    </button>

                    <button
                      onClick={() => {
                        openReturnForInvoice(matchedInvoice);
                        setActiveModule('sales-invoice');
                        onClose();
                      }}
                      className="min-h-[44px] px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <span>Process Return / Exchange</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Matched Sales Order */}
              {matchedOrder && (
                <div className="bg-white rounded-xl border border-blue-100 p-3.5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm font-mono">
                        {matchedOrder.orderNumber}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Customer: {matchedOrder.customerName}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
                        Status: {matchedOrder.status} · {matchedOrder.itemsCount} pcs
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-slate-900 text-sm">
                        {formatBDT(matchedOrder.totalAmount, sym)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => {
                        setPendingOrderForInvoice(matchedOrder);
                        setActiveModule('sales-invoice');
                        onClose();
                      }}
                      className="flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Convert to Invoice Bill</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 4. Not Found Fallback */}
              {!matchedProduct && !matchedInvoice && !matchedOrder && (
                <div className="bg-white rounded-xl border border-amber-200 p-3.5 text-center space-y-2">
                  <p className="text-xs text-slate-700">
                    No matching item found for code:{' '}
                    <span className="font-mono font-bold text-slate-900">
                      {scannedResult.identifier}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    You can quickly create a new product with this SKU or check the code again.
                  </p>
                  <button
                    onClick={() => {
                      setActiveModule('inventory');
                      onClose();
                    }}
                    className="min-h-[44px] px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Product with this SKU</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Fast Camera Scanner</span>
          </span>
          <button
            onClick={onClose}
            className="min-h-[40px] px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

