import QRCode from 'qrcode';

export interface ScannedCodeResult {
  raw: string;
  type: 'PRODUCT' | 'INVOICE' | 'ORDER' | 'CUSTOMER' | 'UNKNOWN';
  identifier: string; // SKU or Invoice # or Order #
  metadata?: Record<string, string>;
}

/**
 * Generate a base64 Data URL for a given string payload using qrcode library
 */
export async function generateQrDataUrl(
  text: string,
  options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 256,
      margin: options?.margin ?? 2,
      color: {
        dark: options?.color?.dark || '#0f172a', // Slate 900
        light: options?.color?.light || '#ffffff',
      },
      errorCorrectionLevel: 'M',
      ...options,
    });
  } catch (err) {
    console.error('Error generating QR code data URL:', err);
    return '';
  }
}

/**
 * Standard QR Code Payload formats
 */
export function encodeProductQr(sku: string): string {
  return `TC-ITEM:${sku.trim()}`;
}

export function encodeInvoiceQr(invoiceNumber: string): string {
  return `TC-INV:${invoiceNumber.trim()}`;
}

export function encodeOrderQr(orderNumber: string): string {
  return `TC-ORD:${orderNumber.trim()}`;
}

export function encodeCustomerQr(phone: string): string {
  return `TC-CUST:${phone.trim()}`;
}

/**
 * Parse any scanned string (handles structured QR prefixes, JSON payloads, or raw Barcode / SKU text)
 */
export function parseScannedCode(rawText: string): ScannedCodeResult {
  const text = (rawText || '').trim();

  // 1. JSON payload support
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.sku || parsed.type === 'product' || parsed.type === 'item') {
        return {
          raw: text,
          type: 'PRODUCT',
          identifier: parsed.sku || parsed.id || '',
          metadata: parsed,
        };
      }
      if (parsed.inv || parsed.invoiceNumber || parsed.type === 'inv') {
        return {
          raw: text,
          type: 'INVOICE',
          identifier: parsed.inv || parsed.invoiceNumber || '',
          metadata: parsed,
        };
      }
      if (parsed.ord || parsed.orderNumber || parsed.type === 'order') {
        return {
          raw: text,
          type: 'ORDER',
          identifier: parsed.ord || parsed.orderNumber || '',
          metadata: parsed,
        };
      }
    } catch {
      // ignore json parse error and proceed
    }
  }

  // 2. Structured prefix TC-ITEM:
  if (text.startsWith('TC-ITEM:')) {
    return {
      raw: text,
      type: 'PRODUCT',
      identifier: text.replace('TC-ITEM:', '').trim(),
    };
  }

  // 3. Structured prefix TC-INV:
  if (text.startsWith('TC-INV:')) {
    return {
      raw: text,
      type: 'INVOICE',
      identifier: text.replace('TC-INV:', '').trim(),
    };
  }

  // 4. Structured prefix TC-ORD:
  if (text.startsWith('TC-ORD:')) {
    return {
      raw: text,
      type: 'ORDER',
      identifier: text.replace('TC-ORD:', '').trim(),
    };
  }

  // 5. Structured prefix TC-CUST:
  if (text.startsWith('TC-CUST:')) {
    return {
      raw: text,
      type: 'CUSTOMER',
      identifier: text.replace('TC-CUST:', '').trim(),
    };
  }

  // 6. Direct heuristic match on common patterns
  if (text.startsWith('INV-')) {
    return {
      raw: text,
      type: 'INVOICE',
      identifier: text,
    };
  }

  if (text.startsWith('ORD-')) {
    return {
      raw: text,
      type: 'ORDER',
      identifier: text,
    };
  }

  // 7. Fallback: Treat raw scan as Product SKU / Barcode
  return {
    raw: text,
    type: 'PRODUCT',
    identifier: text,
  };
}

/**
 * Mobile-friendly Audio Beep using Web Audio API on successful scan
 */
export function playScanSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz (A5 note)
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08); // Jump to 1760 Hz (cheerful beep)

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch (err) {
    console.debug('Audio beep not permitted or failed:', err);
  }
}

/**
 * Mobile Haptic Vibration feedback on scan
 */
export function triggerScanHaptic() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([80, 40, 80]);
    } catch {
      // ignore
    }
  }
}

