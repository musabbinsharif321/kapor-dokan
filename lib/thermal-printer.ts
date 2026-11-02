/**
 * Web Bluetooth (BLE) ESC/POS Thermal Printer Driver
 * Specially designed for 58mm portable Bluetooth thermal receipt printers (e.g. MP-58T, PT-210, MTP-II, Xprinter)
 * Works out-of-the-box on:
 *   - Android (Chrome, Edge, Opera)
 *   - Windows / Mac / Linux (Chrome, Edge)
 *   - iOS / iPhone / iPad (via free "Bluefy – Web BLE Browser" on App Store)
 */

export interface ThermalLabelData {
  brandName: string;
  productName: string;
  sku: string;
  category: string;
  size: string;
  color: string;
  price: number;
}

export interface ThermalReceiptData {
  storeName: string;
  tagline?: string;
  address?: string;
  phone?: string;
  invoiceNumber: string;
  date: string;
  partyName: string;
  partyPhone?: string;
  itemsSummary: string; // "2x Polo Shirt (L) [৳1,200] · 1x Pant (32) [৳950]"
  itemsCount: number;
  subtotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  footerNote?: string;
}

// Common BLE Service & Characteristic UUIDs used by 58mm thermal printers
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard ESC/POS Service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Common Chinese OEM Service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent Service
  '0000ff00-0000-1000-8000-00805f9b34fb', // Generic POS Service
  '0000ae00-0000-1000-8000-00805f9b34fb', // MP-58 / PT-210 Service
  '0000fee7-0000-1000-8000-00805f9b34fb', // Tencent / OEM Service
];

const WRITE_CHARACTERISTICS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '0000ae01-0000-1000-8000-00805f9b34fb',
  '0000fee8-0000-1000-8000-00805f9b34fb',
];

class BluetoothPrinterService {
  private device: any = null;
  private characteristic: any = null;
  private connectedName: string | null = null;

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return typeof (navigator as any).bluetooth !== 'undefined';
  }

  public isConnected(): boolean {
    return Boolean(this.device && this.device.gatt && this.device.gatt.connected && this.characteristic);
  }

  public getConnectedDeviceName(): string | null {
    return this.connectedName;
  }

  /**
   * Request user to pair & connect bluetooth printer
   */
  public async connect(): Promise<string> {
    if (!this.isSupported()) {
      throw new Error(
        'Web Bluetooth is not supported on this browser.\n' +
        '• For iPhone/iPad (iOS): Please open this app inside "Bluefy - Web BLE Browser" (free on App Store).\n' +
        '• For Android / PC: Please use Google Chrome or Microsoft Edge.'
      );
    }

    try {
      const navBt = (navigator as any).bluetooth;

      // Request device with all common thermal printer service filters or acceptAll
      const device = await navBt.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICES,
      });

      if (!device) {
        throw new Error('No device selected.');
      }

      this.device = device;
      this.connectedName = device.name || 'MP-58T Printer';

      device.addEventListener('gattserverdisconnected', () => {
        this.characteristic = null;
        this.connectedName = null;
      });

      const server = await device.gatt.connect();

      // Find the writable characteristic
      let writableChar: any = null;

      for (const serviceUuid of PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          if (service) {
            for (const charUuid of WRITE_CHARACTERISTICS) {
              try {
                const char = await service.getCharacteristic(charUuid);
                if (char && (char.properties.write || char.properties.writeWithoutResponse)) {
                  writableChar = char;
                  break;
                }
              } catch {
                // Continue searching
              }
            }
            if (!writableChar) {
              // Try listing all characteristics of this service
              const chars = await service.getCharacteristics();
              for (const c of chars) {
                if (c.properties.write || c.properties.writeWithoutResponse) {
                  writableChar = c;
                  break;
                }
              }
            }
          }
        } catch {
          // Try next service UUID
        }
        if (writableChar) break;
      }

      if (!writableChar) {
        // Fallback: search all available services on the GATT server
        try {
          const services = await server.getPrimaryServices();
          for (const s of services) {
            const chars = await s.getCharacteristics();
            for (const c of chars) {
              if (c.properties.write || c.properties.writeWithoutResponse) {
                writableChar = c;
                break;
              }
            }
            if (writableChar) break;
          }
        } catch (e) {
          console.warn('Fallback primary services inspection error:', e);
        }
      }

      if (!writableChar) {
        throw new Error('Connected to Bluetooth device, but could not find a writable ESC/POS channel.');
      }

      this.characteristic = writableChar;
      return this.connectedName || 'Thermal Printer';
    } catch (err: any) {
      this.characteristic = null;
      this.connectedName = null;
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      await this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
    this.connectedName = null;
  }

  /**
   * Send ESC/POS commands chunk by chunk (safe chunk size 20-100 bytes for BLE)
   */
  private async writeRawBytes(bytes: Uint8Array): Promise<void> {
    if (!this.isConnected() || !this.characteristic) {
      throw new Error('Bluetooth printer is not connected. Please tap "Connect Printer" first.');
    }

    const CHUNK_SIZE = 64; // Safe BLE MTU write size
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.slice(i, i + CHUNK_SIZE);
      if (this.characteristic.properties.writeWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      // Small pause to avoid buffer overflow on portable 58mm thermal printers
      await new Promise((r) => setTimeout(r, 25));
    }
  }

  /**
   * Format receipt into ESC/POS binary buffer for 58mm printer (32 characters per line)
   */
  public async printReceipt(data: ThermalReceiptData): Promise<void> {
    const LINE_WIDTH = 32; // 58mm thermal printers standard width is 32 chars in Font A
    const encoder = new TextEncoder();
    const parts: number[] = [];

    const push = (...bytes: number[]) => {
      parts.push(...bytes);
    };

    const pushText = (str: string) => {
      // Basic ASCII / sanitization for ESC/POS hardware font
      const sanitized = str
        .replace(/৳/g, 'Tk ')
        .replace(/[^\x00-\x7F]/g, (ch) => {
          // Replace unsupported non-ascii with closest equivalents or space
          return ch;
        });
      const encoded = encoder.encode(sanitized);
      for (let i = 0; i < encoded.length; i++) {
        parts.push(encoded[i]);
      }
    };

    const pushLine = (str: string) => {
      pushText(str + '\n');
    };

    const formatTwoColumns = (left: string, right: string): string => {
      const l = left.trim();
      const r = right.trim();
      const spaceNeeded = LINE_WIDTH - (l.length + r.length);
      if (spaceNeeded <= 0) {
        return l + ' ' + r;
      }
      return l + ' '.repeat(spaceNeeded) + r;
    };

    const centerText = (str: string): string => {
      const s = str.trim();
      if (s.length >= LINE_WIDTH) return s;
      const leftPad = Math.floor((LINE_WIDTH - s.length) / 2);
      return ' '.repeat(leftPad) + s;
    };

    const separator = '-'.repeat(LINE_WIDTH);
    const doubleSeparator = '='.repeat(LINE_WIDTH);

    // 1. Initialize Printer (ESC @)
    push(0x1b, 0x40);

    // 2. Header (Centered, Bold)
    push(0x1b, 0x61, 0x01); // Center align
    push(0x1b, 0x45, 0x01); // Bold on
    push(0x1d, 0x21, 0x11); // Double width & height for Store Name
    pushLine(data.storeName.toUpperCase());
    push(0x1d, 0x21, 0x00); // Normal text
    push(0x1b, 0x45, 0x00); // Bold off

    if (data.tagline) {
      pushLine(data.tagline);
    }
    if (data.address) {
      pushLine(data.address);
    }
    if (data.phone) {
      pushLine('Phone: ' + data.phone);
    }

    pushLine(doubleSeparator);

    // 3. Invoice Meta (Left aligned)
    push(0x1b, 0x61, 0x00); // Left align
    pushLine(formatTwoColumns('Invoice: ' + data.invoiceNumber, data.date));
    pushLine(formatTwoColumns('Customer: ' + data.partyName, data.paymentMethod));
    if (data.partyPhone) {
      pushLine('Contact: ' + data.partyPhone);
    }
    pushLine(separator);

    // 4. Line Items
    push(0x1b, 0x45, 0x01); // Bold on
    pushLine(formatTwoColumns('ITEM / QTY', 'AMOUNT'));
    push(0x1b, 0x45, 0x00); // Bold off
    pushLine(separator);

    const lines = data.itemsSummary.split(' · ');
    for (const line of lines) {
      // Try to parse format: "2x Polo Shirt (L) [৳1,200]" or plain string
      const match = line.match(/^(.+?)(?:\s+\[(?:৳|Tk\s*)?([0-9,]+)\])?$/);
      if (match) {
        const itemTitle = match[1].trim();
        const itemPrice = match[2] ? 'Tk ' + match[2] : '';
        if (itemPrice) {
          pushLine(formatTwoColumns(itemTitle, itemPrice));
        } else {
          pushLine(itemTitle);
        }
      } else {
        pushLine(line);
      }
    }
    pushLine(separator);

    // 5. Totals
    if (data.discount > 0) {
      pushLine(formatTwoColumns('Subtotal:', 'Tk ' + data.subtotal.toLocaleString()));
      pushLine(formatTwoColumns('Discount:', '-Tk ' + data.discount.toLocaleString()));
    }
    push(0x1b, 0x45, 0x01); // Bold on
    pushLine(formatTwoColumns('GRAND TOTAL:', 'Tk ' + data.grandTotal.toLocaleString()));
    push(0x1b, 0x45, 0x00); // Bold off

    pushLine(formatTwoColumns('Paid (' + data.paymentMethod + '):', 'Tk ' + data.paidAmount.toLocaleString()));
    if (data.dueAmount > 0) {
      push(0x1b, 0x45, 0x01); // Bold on
      pushLine(formatTwoColumns('BALANCE DUE:', 'Tk ' + data.dueAmount.toLocaleString()));
      push(0x1b, 0x45, 0x00); // Bold off
    } else {
      pushLine(formatTwoColumns('Payment Status:', 'PAID IN FULL'));
    }

    pushLine(doubleSeparator);

    // 6. Footer Note
    push(0x1b, 0x61, 0x01); // Center align
    if (data.footerNote) {
      pushLine(data.footerNote);
    }
    pushLine('Thank You For Shopping With Us!');
    pushLine('Software by NEXT FIT ERP');

    // 7. Feed and Partial Cut (Feed 4 lines so paper comes out of the tear bar)
    push(0x1b, 0x64, 0x04); // Feed 4 lines
    push(0x1d, 0x56, 0x41, 0x00); // GS V A 0 (Cut paper if supported)

    const rawBuffer = new Uint8Array(parts);
    await this.writeRawBytes(rawBuffer);
  }

  /**
   * Print 50x30mm or 58mm garment barcode/price sticker label directly via Bluetooth ESC/POS or TSPL
   */
  public async printGarmentLabel(label: ThermalLabelData, copies: number = 1): Promise<void> {
    const encoder = new TextEncoder();
    const parts: number[] = [];

    const push = (...bytes: number[]) => {
      parts.push(...bytes);
    };

    const pushText = (str: string) => {
      const sanitized = str.replace(/৳/g, 'Tk ').replace(/[^\x00-\x7F]/g, ' ');
      const encoded = encoder.encode(sanitized);
      for (let i = 0; i < encoded.length; i++) {
        parts.push(encoded[i]);
      }
    };

    const pushLine = (str: string) => {
      pushText(str + '\n');
    };

    for (let c = 0; c < copies; c++) {
      // 1. Initialize
      push(0x1b, 0x40);

      // 2. Brand Name (Center, Bold, Large)
      push(0x1b, 0x61, 0x01); // Center
      push(0x1b, 0x45, 0x01); // Bold on
      push(0x1d, 0x21, 0x01); // Double height
      pushLine(label.brandName.toUpperCase());
      push(0x1d, 0x21, 0x00); // Normal
      push(0x1b, 0x45, 0x00); // Bold off

      // 3. Product Name & Category
      push(0x1b, 0x45, 0x01); // Bold on
      pushLine(label.productName);
      push(0x1b, 0x45, 0x00); // Bold off
      pushLine(`${label.category} · ${label.color}`);

      // 4. Print Native ESC/POS QR Code (Model 2)
      const qrData = encoder.encode(label.sku);
      const storeLen = qrData.length + 3;
      const pL = storeLen % 256;
      const pH = Math.floor(storeLen / 256);

      // Function 165: QR Model 2
      push(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
      // Function 167: QR Module Size (4 dots)
      push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x05);
      // Function 169: Error Correction Level (Level M)
      push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);
      // Function 180: Store data in symbol storage area
      push(0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
      for (let i = 0; i < qrData.length; i++) {
        push(qrData[i]);
      }
      // Function 181: Print symbol data in symbol storage area
      push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);

      // 5. SKU & Size
      pushLine(`Size: ${label.size.toUpperCase()}`);
      pushLine(`SKU: ${label.sku}`);

      // 6. MRP / Price (Bold, Double Size)
      push(0x1b, 0x45, 0x01); // Bold on
      push(0x1d, 0x21, 0x11); // Double width & height
      pushLine(`Tk ${label.price.toLocaleString()}`);
      push(0x1d, 0x21, 0x00); // Normal
      push(0x1b, 0x45, 0x00); // Bold off

      // 7. Feed 3 lines
      push(0x1b, 0x64, 0x03);
    }

    const rawBuffer = new Uint8Array(parts);
    await this.writeRawBytes(rawBuffer);
  }
}

// Singleton instance
export const bluetoothPrinter = new BluetoothPrinterService();

