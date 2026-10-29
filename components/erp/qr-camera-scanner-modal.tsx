'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  Camera,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Package,
  FileText,
  Sparkles,
  ArrowRight,
  Plus,
  Minus,
  Upload,
  Keyboard,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { useErp } from '@/context/erp-context';
import {
  parseScannedCode,
  playScanSound,
  triggerScanHaptic,
  ScannedCodeResult,
} from '@/lib/qr-utils';
import { Product, SalesInvoice, SalesOrder, formatBDT } from '@/lib/types';

export interface ScannedSessionItem {
  product: Product;
  quantity: number;
}

interface QrCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  // If provided, handles item scan directly (e.g. In POS Billing to add item to cart)
  onScanItem?: (product: Product) => void;
  title?: string;
  subtitle?: string;
  continuousMode?: boolean; // If true, allows scanning multiple garments continuously
}

export function QrCameraScannerModal({
  isOpen,
  onClose,
  onScanItem,
  title = 'Mobile QR & Barcode Scanner',
  subtitle = 'Point camera at any garment QR sticker or paper receipt',
  continuousMode = true,
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
    addPendingCartProduct,
  } = useErp();

  const sym = storeSettings.currencySymbol || '৳';

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scannedResult, setScannedResult] = useState<ScannedCodeResult | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [matchedInvoice, setMatchedInvoice] = useState<SalesInvoice | null>(null);
  const [matchedOrder, setMatchedOrder] = useState<SalesOrder | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Continuous scanning session state
  const [sessionItems, setSessionItems] = useState<ScannedSessionItem[]>([]);
  const [scanSuccessFlash, setScanSuccessFlash] = useState(false);
  const [lastScannedFeedback, setLastScannedFeedback] = useState<string | null>(null);

  const scannerRef = useRef<unknown>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const readerElementId = 'threadcraft-qr-reader';

  // Dedicated throttle ref: stores timestamp and last scanned string
  const lastScanRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });

  // Fresh state refs to avoid breaking the camera effect on re-render
  const productsRef = useRef(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const salesInvoicesRef = useRef(salesInvoices);
  useEffect(() => {
    salesInvoicesRef.current = salesInvoices;
  }, [salesInvoices]);

  const salesOrdersRef = useRef(salesOrders);
  useEffect(() => {
    salesOrdersRef.current = salesOrders;
  }, [salesOrders]);

  const onScanItemRef = useRef(onScanItem);
  useEffect(() => {
    onScanItemRef.current = onScanItem;
  }, [onScanItem]);

  const sessionItemsRef = useRef(sessionItems);
  useEffect(() => {
    sessionItemsRef.current = sessionItems;
  }, [sessionItems]);

  // Handle scanned string
  const handleDecodedString = useCallback(
    (decodedText: string) => {
      if (!decodedText) return;

      const now = Date.now();
      const last = lastScanRef.current;

      // Intelligent throttle:
      // If the exact same code is scanned again, wait 800ms before allowing a second unit.
      // If a different item/code is scanned, wait only 300ms.
      const isSameCode = decodedText === last.text;
      const minInterval = isSameCode ? 800 : 300;
      if (now - last.time < minInterval) {
        return;
      }
      lastScanRef.current = { text: decodedText, time: now };

      // Audio & Haptic Feedback
      playScanSound();
      triggerScanHaptic();

      // Trigger green visual flash on reticle
      setScanSuccessFlash(true);
      setTimeout(() => setScanSuccessFlash(false), 450);

      const parsed = parseScannedCode(decodedText);
      setScannedResult(parsed);

      // Search in Database using fresh refs
      const foundProduct = productsRef.current.find(
        (p) =>
          p.sku.toLowerCase() === parsed.identifier.toLowerCase() ||
          p.id.toLowerCase() === parsed.identifier.toLowerCase() ||
          decodedText.toLowerCase().includes(p.sku.toLowerCase())
      );

      const foundInvoice = salesInvoicesRef.current.find(
        (inv) =>
          inv.invoiceNumber.toLowerCase() === parsed.identifier.toLowerCase() ||
          inv.id.toLowerCase() === parsed.identifier.toLowerCase()
      );

      const foundOrder = salesOrdersRef.current.find(
        (ord) =>
          ord.orderNumber.toLowerCase() === parsed.identifier.toLowerCase() ||
          ord.id.toLowerCase() === parsed.identifier.toLowerCase()
      );

      setMatchedProduct(foundProduct || null);
      setMatchedInvoice(foundInvoice || null);
      setMatchedOrder(foundOrder || null);

      if (foundProduct) {
        if (foundProduct.stock <= 0) {
          setLastScannedFeedback(`Out of stock: ${foundProduct.name} (0 pcs)`);
          showToast(`Out of stock: ${foundProduct.name} has 0 pcs in stock`, 'error');
          return;
        }

        const existingSession = sessionItemsRef.current.find((i) => i.product.id === foundProduct.id);
        if (existingSession && existingSession.quantity >= foundProduct.stock) {
          setLastScannedFeedback(`Max stock reached (${foundProduct.stock} pcs max)`);
          showToast(
            `Cannot add more: Only ${foundProduct.stock} pcs in stock for ${foundProduct.name}`,
            'error'
          );
          return;
        }

        setLastScannedFeedback(`+1 ${foundProduct.name} (${foundProduct.size})`);

        // Update local session items list
        setSessionItems((prev) => {
          const idx = prev.findIndex((i) => i.product.id === foundProduct.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], quantity: Math.min(foundProduct.stock, next[idx].quantity + 1) };
            return next;
          }
          return [{ product: foundProduct, quantity: 1 }, ...prev];
        });

        // Pass to parent or global POS cart
        if (onScanItemRef.current) {
          onScanItemRef.current(foundProduct);
        } else {
          addPendingCartProduct(foundProduct);
        }

        showToast(`Added: ${foundProduct.name} (${foundProduct.size})`, 'success');

        // In single-scan mode, close modal after short delay
        if (!continuousMode) {
          setTimeout(() => {
            onClose();
          }, 450);
          return;
        }
      } else if (!foundInvoice && !foundOrder) {
        setLastScannedFeedback(`Unrecognized code: ${parsed.identifier}`);
      }
    },
    [addPendingCartProduct, continuousMode, onClose, showToast]
  );

  // Keep a stable ref to handleDecodedString so camera listener never breaks
  const handleDecodedStringRef = useRef(handleDecodedString);
  useEffect(() => {
    handleDecodedStringRef.current = handleDecodedString;
  }, [handleDecodedString]);

  // Adjust session item quantity directly from inside the scanner modal
  const handleUpdateSessionQty = (productId: string, delta: number) => {
    setSessionItems((prev) => {
      const idx = prev.findIndex((i) => i.product.id === productId);
      if (idx < 0) return prev;
      const target = prev[idx];
      if (delta > 0 && target.quantity >= target.product.stock) {
        showToast(
          `Cannot add more: Only ${target.product.stock} pcs in stock for ${target.product.name}`,
          'error'
        );
        return prev;
      }
      const newQty = Math.min(target.product.stock, target.quantity + delta);

      if (delta > 0) {
        if (onScanItemRef.current) {
          onScanItemRef.current(target.product);
        } else {
          addPendingCartProduct(target.product);
        }
      }

      if (newQty <= 0) {
        return prev.filter((i) => i.product.id !== productId);
      }
      const next = [...prev];
      next[idx] = { ...target, quantity: newQty };
      return next;
    });
  };

  // Initialize camera scanner when modal opens (ONLY depends on isOpen and selectedCameraId)
  useEffect(() => {
    if (!isOpen) {
      setScannedResult(null);
      setMatchedProduct(null);
      setMatchedInvoice(null);
      setMatchedOrder(null);
      setSessionItems([]);
      setScanSuccessFlash(false);
      setLastScannedFeedback(null);
      lastScanRef.current = { text: '', time: 0 };
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
            selectedCameraId || backCam.id,
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
              handleDecodedStringRef.current(decodedText);
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
              handleDecodedStringRef.current(decodedText);
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
            scanner
              .stop()
              .then(() => {
                scanner.clear();
              })
              .catch((e: any) => console.debug('QR stop error:', e));
          } else {
            scanner.clear();
          }
        } catch (e) {
          console.debug('Error clearing scanner:', e);
        }
        scannerRef.current = null;
      }
    };
  }, [isOpen, selectedCameraId]);

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
      handleDecodedStringRef.current(decodedResult);
      tempScanner.clear();
    } catch {
      showToast('No readable QR code found in the selected image', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Manual code submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDecodedStringRef.current(manualInput.trim());
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

  const totalSessionQty = sessionItems.reduce((acc, i) => acc + i.quantity, 0);
  const totalSessionAmount = sessionItems.reduce(
    (acc, i) => acc + i.quantity * i.product.sellingPrice,
    0
  );

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
          {/* Continuous Live Cart Badge */}
          {totalSessionQty > 0 && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-3 shadow-md flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">
                    {totalSessionQty} {totalSessionQty === 1 ? 'Garment' : 'Garments'} Added to POS Cart
                  </p>
                  <p className="text-[11px] text-emerald-100 font-mono">
                    Session Subtotal: {formatBDT(totalSessionAmount, sym)}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold bg-white text-emerald-800 px-2.5 py-1 rounded-xl shadow-xs">
                Active
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
                <div
                  className={`w-56 h-56 rounded-2xl relative transition-all duration-300 ${
                    scanSuccessFlash
                      ? 'border-4 border-emerald-400 bg-emerald-500/20 shadow-[0_0_30px_rgba(52,211,153,0.6)]'
                      : 'border-2 border-blue-400/80 shadow-lg'
                  }`}
                >
                  {/* Corner Target Accents */}
                  <div
                    className={`absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 rounded-tl-md transition-colors ${
                      scanSuccessFlash ? 'border-emerald-400' : 'border-blue-500'
                    }`}
                  />
                  <div
                    className={`absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 rounded-tr-md transition-colors ${
                      scanSuccessFlash ? 'border-emerald-400' : 'border-blue-500'
                    }`}
                  />
                  <div
                    className={`absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 rounded-bl-md transition-colors ${
                      scanSuccessFlash ? 'border-emerald-400' : 'border-blue-500'
                    }`}
                  />
                  <div
                    className={`absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 rounded-br-md transition-colors ${
                      scanSuccessFlash ? 'border-emerald-400' : 'border-blue-500'
                    }`}
                  />

                  {scanSuccessFlash ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center animate-in zoom-in-75 duration-150">
                      <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <span className="mt-2 text-xs font-bold text-emerald-300 drop-shadow-md">
                        Item Added!
                      </span>
                    </div>
                  ) : (
                    /* Animated Laser Scanning Beam */
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent absolute top-0 animate-[bounce_2s_infinite]" />
                  )}
                </div>
              </div>
            )}

            {/* Last Scanned Quick Flash Toast on Viewfinder */}
            {lastScannedFeedback && (
              <div className="absolute bottom-3 left-3 right-3 pointer-events-none flex justify-center">
                <span className="bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-full border border-slate-700 shadow-md">
                  {lastScannedFeedback}
                </span>
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
                  placeholder="e.g. HSH-L-SKY or TC-ITEM:..."
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

          {/* Live Scanned Items Session Basket */}
          {sessionItems.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Items Scanned This Session ({totalSessionQty} pcs)
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {formatBDT(totalSessionAmount, sym)}
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {sessionItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-white rounded-xl border border-slate-200 p-2.5 flex items-center justify-between gap-2 shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-blue-700 font-medium">{item.product.category}</span>
                        <span>·</span>
                        <span>Size: {item.product.size}</span>
                        <span>·</span>
                        <span className="font-mono">{formatBDT(item.product.sellingPrice, sym)}</span>
                        <span>·</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded ${
                            item.quantity >= item.product.stock
                              ? 'bg-amber-100 text-amber-800 font-bold'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.quantity >= item.product.stock
                            ? `Max ${item.product.stock} in stock`
                            : `Stock: ${item.product.stock}`}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateSessionQty(item.product.id, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                        title="Remove 1"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold text-xs px-2 text-slate-900 min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={item.quantity >= item.product.stock}
                        onClick={() => handleUpdateSessionQty(item.product.id, 1)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          item.quantity >= item.product.stock
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-40'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                        }`}
                        title={
                          item.quantity >= item.product.stock
                            ? `Only ${item.product.stock} pcs in stock`
                            : 'Add 1'
                        }
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Non-Product Results (Invoice / Order / Unknown) */}
          {scannedResult && !matchedProduct && (
            <div className="border border-blue-200 bg-blue-50/50 rounded-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-600 text-white">
                  {matchedInvoice
                    ? 'Sales Invoice Matched'
                    : matchedOrder
                    ? 'Sales Order Matched'
                    : 'Unknown Code'}
                </span>
                <span className="text-xs font-mono text-slate-600">
                  {scannedResult.identifier}
                </span>
              </div>

              {/* Matched Sales Invoice */}
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

              {/* Matched Sales Order */}
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

              {/* Not Found Fallback */}
              {!matchedInvoice && !matchedOrder && (
                <div className="bg-white rounded-xl border border-amber-200 p-3.5 text-center space-y-2">
                  <p className="text-xs text-slate-700">
                    No matching item found for code:{' '}
                    <span className="font-mono font-bold text-slate-900">
                      {scannedResult.identifier}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    You can quickly create a new product with this SKU in inventory.
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

        {/* Action Footer: Prominent Done Scanning & Checkout Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 space-y-2">
          {sessionItems.length > 0 ? (
            <button
              onClick={() => {
                if (!onScanItem) {
                  setActiveModule('sales-invoice');
                }
                onClose();
              }}
              className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                Done Scanning & Go to Checkout ({totalSessionQty} items · {formatBDT(totalSessionAmount, sym)})
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>Continuous Tag Scanner</span>
              </span>
              <button
                onClick={onClose}
                className="min-h-[40px] px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
