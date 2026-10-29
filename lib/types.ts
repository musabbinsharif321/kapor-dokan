export type GarmentCategory = string;

export interface CategoryOption {
  id?: string;
  value: string;
  label: string;
  bengaliLabel?: string;
  defaultSizes: string[];
  isCustom?: boolean;
}

export const GARMENT_CATEGORIES: CategoryOption[] = [
  { value: 'Pant', label: 'Pant', defaultSizes: ['28', '30', '32', '34', '36', '38'] },
  { value: 'Shirt', label: 'Shirt', defaultSizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  { value: 'Polo Shirt', label: 'Polo Shirt', defaultSizes: ['M', 'L', 'XL', 'XXL'] },
  { value: 'T-Shirt', label: 'T-Shirt', defaultSizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  { value: 'Half Pant', label: 'Half Pant', defaultSizes: ['M', 'L', 'XL', '30', '32', '34'] },
  { value: 'Trouser', label: 'Trouser', defaultSizes: ['M', 'L', 'XL', 'XXL'] },
  { value: 'Formal Pant', label: 'Formal Pant', defaultSizes: ['30', '32', '34', '36', '38'] },
  { value: 'Sweatshirt', label: 'Sweatshirt', defaultSizes: ['M', 'L', 'XL', 'XXL'] },
  { value: 'Half Shirt', label: 'Half Shirt', defaultSizes: ['M', 'L', 'XL', 'XXL'] },
];

export const GARMENT_SIZES = [
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '28',
  '30',
  '32',
  '34',
  '36',
  '38',
  'Free',
];

export type PaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Card';
export const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'bKash', 'Nagad', 'Card'];

export type PaymentStatus = 'Paid' | 'Partial' | 'Due';
export type OrderStatus = 'Pending' | 'Confirmed' | 'Invoiced' | 'Cancelled';

export type ExpenseCategory =
  | 'Rent'
  | 'Electricity'
  | 'Salary'
  | 'Transport'
  | 'Packaging'
  | 'Refreshment'
  | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Rent',
  'Electricity',
  'Salary',
  'Transport',
  'Packaging',
  'Refreshment',
  'Other',
];

export type ActiveModule =
  | 'dashboard'
  | 'inventory'
  | 'inventory-history'
  | 'sales-customer'
  | 'sales-order'
  | 'sales-invoice'
  | 'sales-returns'
  | 'purchase-supplier'
  | 'purchase-invoice'
  | 'daily-expenses'
  | 'report'
  | 'setting'
  | 'qr-scanner'
  | 'qr-labels';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: GarmentCategory;
  size: string;
  color: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStockAlert: number;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CustomCategoryDoc {
  id: string;
  name: string;
  bengaliLabel: string;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface InventoryLog {
  id: string;
  action: 'EDIT' | 'DELETE';
  productName: string;
  sku: string;
  category: string;
  details: string;
  timestampStr: string;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalSales: number;
  totalDue: number;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  itemsSummary: string;
  itemsCount: number;
  totalAmount: number;
  status: OrderStatus;
  orderDate: string;
  notes: string;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  itemsSummary: string;
  primaryCategory: string;
  itemsCount: number;
  totalCost: number;
  subtotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  invoiceDate: string;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  address: string;
  totalPurchased: number;
  totalPayable: number;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  itemsSummary: string;
  itemsCount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  purchaseDate: string;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  expenseDate: string;
  notes: string;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  currencySymbol: string;
  invoiceFooterNote: string;
  lowStockDefault: number;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ReturnType = 'RETURN_REFUND' | 'EXCHANGE';

export interface ReturnExchangeRecord {
  id: string;
  returnNumber: string;
  originalInvoiceNumber: string;
  customerName: string;
  customerPhone: string;
  type: ReturnType;
  returnedItemSummary: string;
  returnedQty: number;
  refundAmount: number;
  refundMethod: string;
  exchangeItemSummary?: string;
  exchangeQty?: number;
  exchangeExtraCharge?: number;
  reason: string;
  date: string;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export function formatBDT(amount: number, symbol = '৳'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${symbol}${safe.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function sanitizeDocId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120) || `id_${Date.now()}`;
}
