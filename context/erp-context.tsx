'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '@/lib/firebase';
import {
  ActiveModule,
  Product,
  CustomCategoryDoc,
  CategoryOption,
  GARMENT_CATEGORIES,
  InventoryLog,
  Customer,
  SalesOrder,
  SalesInvoice,
  Supplier,
  PurchaseInvoice,
  Expense,
  StoreSettings,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ReturnExchangeRecord,
  ReturnType,
  sanitizeDocId,
} from '@/lib/types';
import {
  SAMPLE_PRODUCTS,
  SAMPLE_CUSTOMERS,
  SAMPLE_SUPPLIERS,
  getSampleSalesOrders,
  getSampleSalesInvoices,
  getSamplePurchaseInvoices,
  getSampleExpenses,
  DEFAULT_STORE_SETTINGS,
} from '@/lib/sample-data';

export interface CartLineItem {
  productId: string;
  name: string;
  sku: string;
  category: string;
  size: string;
  color: string;
  unitPrice: number;
  unitCost: number;
  quantity: number;
}

export interface PrintableReceiptData {
  type: 'SALES' | 'PURCHASE' | 'RETURN';
  invoiceNumber: string;
  date: string;
  partyName: string;
  partyPhone: string;
  itemsSummary: string;
  itemsCount: number;
  subtotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  status: string;
  returnReason?: string;
  returnTypeLabel?: string;
  originalInvoiceNumber?: string;
}

interface ToastMessage {
  id: string;
  title: string;
  type: 'success' | 'error' | 'info';
}

interface ErpContextValue {
  user: User | null;
  authLoading: boolean;
  dataLoading: boolean;
  activeModule: ActiveModule;
  setActiveModule: (mod: ActiveModule) => void;
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (cat: string) => void;
  products: Product[];
  allCategories: CategoryOption[];
  inventoryLogs: InventoryLog[];
  customers: Customer[];
  salesOrders: SalesOrder[];
  salesInvoices: SalesInvoice[];
  suppliers: Supplier[];
  purchaseInvoices: PurchaseInvoice[];
  expenses: Expense[];
  storeSettings: StoreSettings;
  toast: ToastMessage | null;
  showToast: (title: string, type?: 'success' | 'error' | 'info') => void;
  printableReceipt: PrintableReceiptData | null;
  setPrintableReceipt: (receipt: PrintableReceiptData | null) => void;
  pendingOrderForInvoice: SalesOrder | null;
  setPendingOrderForInvoice: (order: SalesOrder | null) => void;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  seedSampleData: () => Promise<void>;
  addCustomCategory: (name: string, bengaliLabel?: string) => Promise<void>;
  saveProduct: (
    data: Omit<Product, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  adjustProductStock: (productId: string, newStock: number) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  saveCustomer: (
    data: Omit<Customer, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  collectCustomerDue: (customerId: string, amountCollected: number) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  saveSalesOrder: (
    data: Omit<SalesOrder, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  updateSalesOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  deleteSalesOrder: (orderId: string) => Promise<void>;
  createSalesInvoice: (params: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    cartItems: CartLineItem[];
    discount: number;
    paidAmount: number;
    paymentMethod: PaymentMethod;
    invoiceDate: string;
    linkedOrderId?: string;
  }) => Promise<PrintableReceiptData>;
  settleSalesInvoiceDue: (
    invoice: SalesInvoice,
    additionalPaid: number,
    method: PaymentMethod
  ) => Promise<void>;
  deleteSalesInvoice: (invoiceId: string) => Promise<void>;
  saveSupplier: (
    data: Omit<Supplier, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  paySupplierDue: (supplierId: string, amountPaid: number) => Promise<void>;
  deleteSupplier: (supplierId: string) => Promise<void>;
  createPurchaseInvoice: (params: {
    supplierId: string;
    supplierName: string;
    cartItems: CartLineItem[];
    paidAmount: number;
    paymentMethod: PaymentMethod;
    purchaseDate: string;
  }) => Promise<PrintableReceiptData>;
  settlePurchaseInvoiceDue: (
    purchase: PurchaseInvoice,
    additionalPaid: number,
    method: PaymentMethod
  ) => Promise<void>;
  deletePurchaseInvoice: (purchaseId: string) => Promise<void>;
  saveExpense: (
    data: Omit<Expense, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  saveStoreSettings: (
    data: Omit<StoreSettings, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  returns: ReturnExchangeRecord[];
  pendingReturnInvoice: SalesInvoice | null;
  setPendingReturnInvoice: (inv: SalesInvoice | null) => void;
  openReturnForInvoice: (inv: SalesInvoice) => void;
  processReturnExchange: (params: {
    originalInvoiceNumber: string;
    customerId?: string;
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
    returnedProductId?: string;
    returnedReturnStockQty?: number;
    exchangeProductId?: string;
    exchangeDeductStockQty?: number;
  }) => Promise<PrintableReceiptData | undefined>;
}

const ErpContext = createContext<ErpContextValue | null>(null);

function formatLogTimestamp(): string {
  const now = new Date();
  return now.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function ErpProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  const [products, setProducts] = useState<Product[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategoryDoc[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [returns, setReturns] = useState<ReturnExchangeRecord[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    id: 'default',
    ownerId: '',
    ...DEFAULT_STORE_SETTINGS,
  });

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [printableReceipt, setPrintableReceipt] = useState<PrintableReceiptData | null>(null);
  const [pendingOrderForInvoice, setPendingOrderForInvoice] = useState<SalesOrder | null>(null);
  const [pendingReturnInvoice, setPendingReturnInvoice] = useState<SalesInvoice | null>(null);

  const openReturnForInvoice = useCallback((inv: SalesInvoice) => {
    setPendingReturnInvoice(inv);
    setActiveModule('sales-invoice');
  }, []);

  const allCategories = useMemo<CategoryOption[]>(() => {
    const merged: CategoryOption[] = [...GARMENT_CATEGORIES];
    customCategories.forEach((cc) => {
      const exists = merged.some(
        (m) => m.value.toLowerCase() === cc.name.toLowerCase()
      );
      if (!exists) {
        merged.push({
          id: cc.id,
          value: cc.name,
          label: cc.name,
          bengaliLabel: cc.bengaliLabel || cc.name,
          defaultSizes: ['S', 'M', 'L', 'XL', 'XXL', '30', '32', '34'],
          isCustom: true,
        });
      }
    });
    return merged;
  }, [customCategories]);

  const showToast = useCallback(
    (title: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = String(Date.now());
      setToast({ id, title, type });
      setTimeout(() => {
        setToast((prev) => (prev?.id === id ? null : prev));
      }, 3200);
    },
    []
  );

  useEffect(() => {
    testFirestoreConnection();
    const unsub = onAuthStateChanged(auth, (currUser) => {
      setUser(currUser);
      setAuthLoading(false);
      if (!currUser) {
        setProducts([]);
        setCustomCategories([]);
        setInventoryLogs([]);
        setCustomers([]);
        setSalesOrders([]);
        setSalesInvoices([]);
        setSuppliers([]);
        setPurchaseInvoices([]);
        setExpenses([]);
        setReturns([]);
        setDataLoading(false);
      } else {
        setDataLoading(true);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    const uid = user.uid;

    const qProducts = query(collection(db, 'products'), where('ownerId', '==', uid));
    const unsubProducts = onSnapshot(
      qProducts,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }));
        setProducts(list);
        setDataLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'products')
    );

    const qCategories = query(collection(db, 'categories'), where('ownerId', '==', uid));
    const unsubCategories = onSnapshot(
      qCategories,
      (snap) => {
        setCustomCategories(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CustomCategoryDoc, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'categories')
    );

    const qLogs = query(collection(db, 'inventoryLogs'), where('ownerId', '==', uid));
    const unsubLogs = onSnapshot(
      qLogs,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<InventoryLog, 'id'>),
        }));
        list.sort((a, b) => b.id.localeCompare(a.id));
        setInventoryLogs(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'inventoryLogs')
    );

    const qCustomers = query(collection(db, 'customers'), where('ownerId', '==', uid));
    const unsubCustomers = onSnapshot(
      qCustomers,
      (snap) => {
        setCustomers(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Customer, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'customers')
    );

    const qOrders = query(collection(db, 'salesOrders'), where('ownerId', '==', uid));
    const unsubOrders = onSnapshot(
      qOrders,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SalesOrder, 'id'>),
        }));
        list.sort((a, b) => b.orderDate.localeCompare(a.orderDate));
        setSalesOrders(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'salesOrders')
    );

    const qSalesInv = query(collection(db, 'salesInvoices'), where('ownerId', '==', uid));
    const unsubSalesInv = onSnapshot(
      qSalesInv,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SalesInvoice, 'id'>),
        }));
        list.sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));
        setSalesInvoices(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'salesInvoices')
    );

    const qSuppliers = query(collection(db, 'suppliers'), where('ownerId', '==', uid));
    const unsubSuppliers = onSnapshot(
      qSuppliers,
      (snap) => {
        setSuppliers(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Supplier, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'suppliers')
    );

    const qPurInv = query(collection(db, 'purchaseInvoices'), where('ownerId', '==', uid));
    const unsubPurInv = onSnapshot(
      qPurInv,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PurchaseInvoice, 'id'>),
        }));
        list.sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));
        setPurchaseInvoices(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'purchaseInvoices')
    );

    const qExpenses = query(collection(db, 'expenses'), where('ownerId', '==', uid));
    const unsubExpenses = onSnapshot(
      qExpenses,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Expense, 'id'>),
        }));
        list.sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
        setExpenses(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'expenses')
    );

    const qReturns = query(collection(db, 'returns'), where('ownerId', '==', uid));
    const unsubReturns = onSnapshot(
      qReturns,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ReturnExchangeRecord, 'id'>),
        }));
        list.sort((a, b) => b.id.localeCompare(a.id));
        setReturns(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'returns')
    );

    const settingsRef = doc(db, 'storeSettings', uid);
    const unsubSettings = onSnapshot(
      settingsRef,
      (snap) => {
        if (snap.exists()) {
          setStoreSettings({ id: snap.id, ...(snap.data() as Omit<StoreSettings, 'id'>) });
        } else {
          setStoreSettings({
            id: uid,
            ownerId: uid,
            ...DEFAULT_STORE_SETTINGS,
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `storeSettings/${uid}`)
    );

    return () => {
      unsubProducts();
      unsubCategories();
      unsubLogs();
      unsubCustomers();
      unsubOrders();
      unsubSalesInv();
      unsubSuppliers();
      unsubPurInv();
      unsubExpenses();
      unsubSettings();
    };
  }, [user, authLoading]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Signed in successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in cancelled';
      showToast(msg, 'error');
    }
  };

  const logout = async () => {
    await signOut(auth);
    showToast('Signed out of ThreadCraft ERP', 'info');
  };

  const seedSampleData = async () => {
    if (!user) return;
    const uid = user.uid;
    const today = new Date().toISOString().slice(0, 10);
    const batch = writeBatch(db);

    try {
      SAMPLE_PRODUCTS.forEach((p, idx) => {
        const id = sanitizeDocId(`prod_sample_${idx + 1}_${uid.slice(0, 6)}`);
        batch.set(doc(db, 'products', id), {
          ...p,
          ownerId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      SAMPLE_CUSTOMERS.forEach((c, idx) => {
        const id = sanitizeDocId(`cust_sample_${idx + 1}_${uid.slice(0, 6)}`);
        batch.set(doc(db, 'customers', id), {
          ...c,
          ownerId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      SAMPLE_SUPPLIERS.forEach((s, idx) => {
        const id = sanitizeDocId(`sup_sample_${idx + 1}_${uid.slice(0, 6)}`);
        batch.set(doc(db, 'suppliers', id), {
          ...s,
          ownerId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      getSampleSalesOrders(today).forEach((so, idx) => {
        const id = sanitizeDocId(`so_sample_${idx + 1}_${uid.slice(0, 6)}`);
        batch.set(doc(db, 'salesOrders', id), {
          ...so,
          customerId: sanitizeDocId(`${so.customerId}_${uid.slice(0, 6)}`),
          ownerId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      getSampleSalesInvoices(today).forEach((inv, idx) => {
        const id = sanitizeDocId(`inv_sample_${idx + 1}_${uid.slice(0, 6)}`);
        batch.set(doc(db, 'salesInvoices', id), {
          ...inv,
          customerId: sanitizeDocId(`${inv.customerId}_${uid.slice(0, 6)}`),
          ownerId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      getSamplePurchaseInvoices(today).forEach((pur, idx) => {
        const id = sanitizeDocId(`pur_sample_${idx + 1}_${uid.slice(0, 6)}`);
        batch.set(doc(db, 'purchaseInvoices', id), {
          ...pur,
          supplierId: sanitizeDocId(`${pur.supplierId}_${uid.slice(0, 6)}`),
          ownerId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      getSampleExpenses(today).forEach((exp, idx) => {
        const id = sanitizeDocId(`exp_sample_${idx + 1}_${uid.slice(0, 6)}`);
        batch.set(doc(db, 'expenses', id), {
          ...exp,
          ownerId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      // Sample Audit History Log
      const sampleLogId = sanitizeDocId(`log_sample_1_${uid.slice(0, 6)}`);
      batch.set(doc(db, 'inventoryLogs', sampleLogId), {
        action: 'EDIT',
        productName: 'Slim Fit Stretch Denim Pant',
        sku: 'PNT-32-IND',
        category: 'Pant',
        details: 'Stock updated: 20 pcs -> 24 pcs · Selling Price: ৳1350',
        timestampStr: formatLogTimestamp(),
        ownerId: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const settingsRef = doc(db, 'storeSettings', uid);
      batch.set(settingsRef, {
        ...DEFAULT_STORE_SETTINGS,
        ownerId: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      showToast('Loaded sample apparel catalog across all categories!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'batch/seedSampleData');
    }
  };

  // Custom Category Handler
  const addCustomCategory = async (name: string, bengaliLabel = '') => {
    if (!user) return;
    const trimmedName = name.trim().slice(0, 60);
    if (!trimmedName) return;
    const id = sanitizeDocId(`cat_${Date.now()}`);
    try {
      await setDoc(doc(db, 'categories', id), {
        name: trimmedName,
        bengaliLabel: (bengaliLabel || trimmedName).trim().slice(0, 60),
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast(`Category "${trimmedName}" added to Inventory`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `categories/${id}`);
    }
  };

  // Product Handlers (with automatic InventoryLog creation on Edit & Delete)
  const saveProduct = async (
    data: Omit<Product, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    if (!user) return;
    const id = existingId ? sanitizeDocId(existingId) : sanitizeDocId(`prd_${Date.now()}`);
    const payload = {
      name: data.name.trim().slice(0, 120) || 'Unnamed Garment',
      sku: data.sku.trim().slice(0, 40) || `SKU-${Date.now().toString().slice(-4)}`,
      category: data.category.trim().slice(0, 60) || 'Pant',
      size: data.size.trim().slice(0, 20) || 'L',
      color: data.color.trim().slice(0, 40) || 'Standard',
      purchasePrice: Math.max(0, Number(data.purchasePrice) || 0),
      sellingPrice: Math.max(0, Number(data.sellingPrice) || 0),
      stock: Math.max(0, Math.floor(Number(data.stock) || 0)),
      minStockAlert: Math.max(0, Math.floor(Number(data.minStockAlert) || 0)),
    };

    try {
      if (existingId) {
        const prev = products.find((p) => p.id === existingId);
        const changes: string[] = [];
        if (prev) {
          if (prev.stock !== payload.stock) {
            changes.push(`Stock: ${prev.stock} pcs -> ${payload.stock} pcs`);
          }
          if (prev.sellingPrice !== payload.sellingPrice) {
            changes.push(
              `Selling Price: ${storeSettings.currencySymbol}${prev.sellingPrice} -> ${storeSettings.currencySymbol}${payload.sellingPrice}`
            );
          }
          if (prev.purchasePrice !== payload.purchasePrice) {
            changes.push(
              `Cost: ${storeSettings.currencySymbol}${prev.purchasePrice} -> ${storeSettings.currencySymbol}${payload.purchasePrice}`
            );
          }
          if (prev.name !== payload.name) {
            changes.push(`Name: "${prev.name}" -> "${payload.name}"`);
          }
          if (prev.size !== payload.size || prev.color !== payload.color) {
            changes.push(
              `Variant: ${prev.size}/${prev.color} -> ${payload.size}/${payload.color}`
            );
          }
          if (prev.category !== payload.category) {
            changes.push(`Category: ${prev.category} -> ${payload.category}`);
          }
        }
        const detailsStr =
          changes.length > 0
            ? changes.join(' · ').slice(0, 500)
            : `Updated product details (Stock: ${payload.stock} pcs · Price: ${storeSettings.currencySymbol}${payload.sellingPrice})`;

        const batch = writeBatch(db);
        batch.update(doc(db, 'products', id), {
          ...payload,
          updatedAt: serverTimestamp(),
        });

        const logId = sanitizeDocId(`log_${Date.now()}`);
        batch.set(doc(db, 'inventoryLogs', logId), {
          action: 'EDIT',
          productName: payload.name,
          sku: payload.sku,
          category: payload.category,
          details: detailsStr,
          timestampStr: formatLogTimestamp(),
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await batch.commit();
        showToast('Product updated & logged in History');
      } else {
        await setDoc(doc(db, 'products', id), {
          ...payload,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast('New garment added to inventory');
      }
    } catch (err) {
      handleFirestoreError(
        err,
        existingId ? OperationType.UPDATE : OperationType.CREATE,
        `products/${id}`
      );
    }
  };

  const adjustProductStock = async (productId: string, newStock: number) => {
    if (!user) return;
    const safeStock = Math.max(0, Math.floor(Number(newStock) || 0));
    const prev = products.find((p) => p.id === productId);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'products', productId), {
        stock: safeStock,
        updatedAt: serverTimestamp(),
      });

      if (prev) {
        const logId = sanitizeDocId(`log_${Date.now()}`);
        batch.set(doc(db, 'inventoryLogs', logId), {
          action: 'EDIT',
          productName: prev.name,
          sku: prev.sku,
          category: prev.category,
          details: `Stock updated: ${prev.stock} pcs -> ${safeStock} pcs`,
          timestampStr: formatLogTimestamp(),
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
      showToast(`Stock updated to ${safeStock} pcs`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!user) return;
    const target = products.find((p) => p.id === productId);
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'products', productId));

      if (target) {
        const logId = sanitizeDocId(`log_${Date.now()}`);
        batch.set(doc(db, 'inventoryLogs', logId), {
          action: 'DELETE',
          productName: target.name,
          sku: target.sku,
          category: target.category,
          details: `Deleted item · Previous Stock: ${target.stock} pcs · Size ${target.size} (${target.color}) · Selling Price: ${storeSettings.currencySymbol}${target.sellingPrice}`.slice(
            0,
            500
          ),
          timestampStr: formatLogTimestamp(),
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
      showToast('Product deleted & logged in History', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
    }
  };

  const processReturnExchange = async (params: {
    originalInvoiceNumber: string;
    customerId?: string;
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
    returnedProductId?: string;
    returnedReturnStockQty?: number;
    exchangeProductId?: string;
    exchangeDeductStockQty?: number;
  }): Promise<PrintableReceiptData | undefined> => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      const returnId = sanitizeDocId(`ret_${Date.now()}`);
      const returnNumber = `RET-${Math.floor(1000 + Math.random() * 9000)}`;

      batch.set(doc(db, 'returns', returnId), {
        returnNumber,
        originalInvoiceNumber: params.originalInvoiceNumber,
        customerName: params.customerName || 'Walk-in Customer',
        customerPhone: params.customerPhone || 'N/A',
        type: params.type,
        returnedItemSummary: params.returnedItemSummary,
        returnedQty: Math.max(1, Number(params.returnedQty) || 1),
        refundAmount: Math.max(0, Number(params.refundAmount) || 0),
        refundMethod: params.refundMethod || 'Cash',
        exchangeItemSummary: params.exchangeItemSummary || '',
        exchangeQty: params.exchangeQty || 0,
        exchangeExtraCharge: params.exchangeExtraCharge || 0,
        reason: params.reason || 'Customer Request',
        date: new Date().toISOString().slice(0, 10),
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (params.returnedProductId && (params.returnedReturnStockQty || 0) > 0) {
        const prod = products.find((p) => p.id === params.returnedProductId);
        if (prod) {
          const newStock = prod.stock + (params.returnedReturnStockQty || 0);
          batch.update(doc(db, 'products', params.returnedProductId), {
            stock: newStock,
            updatedAt: serverTimestamp(),
          });
        }
      }

      if (params.type === 'EXCHANGE' && params.exchangeProductId && (params.exchangeDeductStockQty || 0) > 0) {
        const prod = products.find((p) => p.id === params.exchangeProductId);
        if (prod) {
          const newStock = Math.max(0, prod.stock - (params.exchangeDeductStockQty || 0));
          batch.update(doc(db, 'products', params.exchangeProductId), {
            stock: newStock,
            updatedAt: serverTimestamp(),
          });
        }
      }

      // If refund is adjusted against Customer Due
      if (params.refundMethod === 'Due Adjustment' && params.customerId && params.refundAmount > 0) {
        const cust = customers.find((c) => c.id === params.customerId);
        if (cust) {
          const newDue = Math.max(0, cust.totalDue - params.refundAmount);
          batch.update(doc(db, 'customers', cust.id), {
            totalDue: newDue,
            updatedAt: serverTimestamp(),
          });
        }
      }

      await batch.commit();
      showToast(`Return / Exchange ${returnNumber} processed successfully!`);

      const receipt: PrintableReceiptData = {
        type: 'RETURN',
        invoiceNumber: returnNumber,
        date: new Date().toISOString().slice(0, 10),
        partyName: params.customerName || 'Walk-in Customer',
        partyPhone: params.customerPhone || '',
        itemsSummary:
          params.type === 'EXCHANGE'
            ? `RETURNED: ${params.returnedQty}x ${params.returnedItemSummary} · REPLACED: ${params.exchangeQty || 1}x ${params.exchangeItemSummary || 'Garment Item'}`
            : `RETURNED: ${params.returnedQty}x ${params.returnedItemSummary}`,
        itemsCount: params.returnedQty,
        subtotal: params.refundAmount,
        discount: 0,
        grandTotal: params.refundAmount,
        paidAmount: params.refundAmount,
        dueAmount: 0,
        paymentMethod: params.refundMethod || 'Cash',
        status: 'Completed',
        returnReason: params.reason,
        returnTypeLabel: params.type === 'EXCHANGE' ? 'Exchange Item' : 'Return & Refund',
        originalInvoiceNumber: params.originalInvoiceNumber,
      };
      setPrintableReceipt(receipt);
      return receipt;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'returns');
    }
  };

  // Customer Handlers
  const saveCustomer = async (
    data: Omit<Customer, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    if (!user) return;
    const id = existingId ? sanitizeDocId(existingId) : sanitizeDocId(`cus_${Date.now()}`);
    const payload = {
      name: data.name.trim().slice(0, 100) || 'Walk-in Customer',
      phone: data.phone.trim().slice(0, 30) || '01700-000000',
      address: data.address.trim().slice(0, 200),
      totalSales: Math.max(0, Number(data.totalSales) || 0),
      totalDue: Math.max(0, Number(data.totalDue) || 0),
    };

    try {
      if (existingId) {
        await updateDoc(doc(db, 'customers', id), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        showToast('Customer record updated');
      } else {
        await setDoc(doc(db, 'customers', id), {
          ...payload,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast('Customer added');
      }
    } catch (err) {
      handleFirestoreError(
        err,
        existingId ? OperationType.UPDATE : OperationType.CREATE,
        `customers/${id}`
      );
    }
  };

  const collectCustomerDue = async (customerId: string, amountCollected: number) => {
    if (!user) return;
    const target = customers.find((c) => c.id === customerId);
    if (!target) return;
    const newDue = Math.max(0, target.totalDue - Math.max(0, Number(amountCollected) || 0));
    try {
      await updateDoc(doc(db, 'customers', customerId), {
        totalDue: newDue,
        updatedAt: serverTimestamp(),
      });
      showToast('Customer due payment recorded');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `customers/${customerId}`);
    }
  };

  const deleteCustomer = async (customerId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'customers', customerId));
      showToast('Customer removed', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `customers/${customerId}`);
    }
  };

  // Sales Order Handlers
  const saveSalesOrder = async (
    data: Omit<SalesOrder, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    if (!user) return;
    const id = existingId ? sanitizeDocId(existingId) : sanitizeDocId(`so_${Date.now()}`);
    const payload = {
      orderNumber: data.orderNumber.trim().slice(0, 40) || `SO-${Date.now().toString().slice(-4)}`,
      customerId: sanitizeDocId(data.customerId || 'WALK_IN'),
      customerName: data.customerName.trim().slice(0, 100) || 'Walk-in Customer',
      itemsSummary: data.itemsSummary.trim().slice(0, 500) || '1x Garment Item',
      itemsCount: Math.max(1, Math.floor(Number(data.itemsCount) || 1)),
      totalAmount: Math.max(0, Number(data.totalAmount) || 0),
      status: data.status,
      orderDate: data.orderDate.trim().slice(0, 30) || new Date().toISOString().slice(0, 10),
      notes: data.notes.trim().slice(0, 300),
    };

    try {
      if (existingId) {
        await updateDoc(doc(db, 'salesOrders', id), {
          customerName: payload.customerName,
          itemsSummary: payload.itemsSummary,
          itemsCount: payload.itemsCount,
          totalAmount: payload.totalAmount,
          status: payload.status,
          notes: payload.notes,
          updatedAt: serverTimestamp(),
        });
        showToast('Sales order updated');
      } else {
        await setDoc(doc(db, 'salesOrders', id), {
          ...payload,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast('Sales order created');
      }
    } catch (err) {
      handleFirestoreError(
        err,
        existingId ? OperationType.UPDATE : OperationType.CREATE,
        `salesOrders/${id}`
      );
    }
  };

  const updateSalesOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'salesOrders', orderId), {
        status,
        updatedAt: serverTimestamp(),
      });
      showToast(`Order marked as ${status}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `salesOrders/${orderId}`);
    }
  };

  const deleteSalesOrder = async (orderId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'salesOrders', orderId));
      showToast('Sales order deleted', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `salesOrders/${orderId}`);
    }
  };

  // Sales Invoice Creation
  const createSalesInvoice = async (params: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    cartItems: CartLineItem[];
    discount: number;
    paidAmount: number;
    paymentMethod: PaymentMethod;
    invoiceDate: string;
    linkedOrderId?: string;
  }): Promise<PrintableReceiptData> => {
    if (!user) throw new Error('Not authenticated');
    const batch = writeBatch(db);
    const invId = sanitizeDocId(`inv_${Date.now()}`);
    const invoiceNumber = `INV-${Date.now().toString().slice(-5)}`;

    const itemsCount = Math.max(
      1,
      params.cartItems.reduce((acc, item) => acc + Math.max(1, item.quantity), 0)
    );
    const subtotal = Math.max(
      0,
      params.cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0)
    );
    const totalCost = Math.max(
      0,
      params.cartItems.reduce((acc, item) => acc + item.unitCost * item.quantity, 0)
    );
    const discount = Math.min(subtotal, Math.max(0, Number(params.discount) || 0));
    const grandTotal = Math.max(0, subtotal - discount);
    const paidAmount = Math.min(grandTotal, Math.max(0, Number(params.paidAmount) || 0));
    const dueAmount = Math.max(0, grandTotal - paidAmount);

    let status: PaymentStatus = 'Paid';
    if (dueAmount > 0 && paidAmount > 0) status = 'Partial';
    else if (dueAmount > 0 && paidAmount === 0) status = 'Due';

    const itemsSummary = params.cartItems
      .map(
        (i) =>
          `${i.quantity}x ${i.name} (${i.size}) @ ${storeSettings.currencySymbol}${i.unitPrice}`
      )
      .join(' · ')
      .slice(0, 1000);

    const primaryCategory = (params.cartItems[0]?.category || 'Pant').slice(0, 60);

    const invoicePayload = {
      invoiceNumber,
      customerId: sanitizeDocId(params.customerId || 'WALK_IN'),
      customerName: params.customerName.trim().slice(0, 100) || 'Walk-in Customer',
      customerPhone: params.customerPhone.trim().slice(0, 30),
      itemsSummary: itemsSummary || '1x Garment Item',
      primaryCategory,
      itemsCount,
      totalCost,
      subtotal,
      discount,
      grandTotal,
      paidAmount,
      dueAmount,
      paymentMethod: params.paymentMethod,
      status,
      invoiceDate: params.invoiceDate.slice(0, 30) || new Date().toISOString().slice(0, 10),
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      batch.set(doc(db, 'salesInvoices', invId), invoicePayload);

      params.cartItems.forEach((cartItem) => {
        const existingProd = products.find((p) => p.id === cartItem.productId);
        if (existingProd) {
          const nextStock = Math.max(0, existingProd.stock - cartItem.quantity);
          batch.update(doc(db, 'products', existingProd.id), {
            stock: nextStock,
            updatedAt: serverTimestamp(),
          });
        }
      });

      if (params.customerId && params.customerId !== 'WALK_IN') {
        const existingCust = customers.find((c) => c.id === params.customerId);
        if (existingCust) {
          batch.update(doc(db, 'customers', existingCust.id), {
            totalSales: Math.max(0, existingCust.totalSales + grandTotal),
            totalDue: Math.max(0, existingCust.totalDue + dueAmount),
            updatedAt: serverTimestamp(),
          });
        }
      }

      if (params.linkedOrderId) {
        const existingOrder = salesOrders.find((o) => o.id === params.linkedOrderId);
        if (
          existingOrder &&
          existingOrder.status !== 'Invoiced' &&
          existingOrder.status !== 'Cancelled'
        ) {
          batch.update(doc(db, 'salesOrders', existingOrder.id), {
            status: 'Invoiced',
            updatedAt: serverTimestamp(),
          });
        }
      }

      await batch.commit();
      showToast(`Invoice ${invoiceNumber} saved & stock updated!`);

      const receipt: PrintableReceiptData = {
        type: 'SALES',
        invoiceNumber,
        date: invoicePayload.invoiceDate,
        partyName: invoicePayload.customerName,
        partyPhone: invoicePayload.customerPhone,
        itemsSummary: invoicePayload.itemsSummary,
        itemsCount,
        subtotal,
        discount,
        grandTotal,
        paidAmount,
        dueAmount,
        paymentMethod: params.paymentMethod,
        status,
      };
      setPrintableReceipt(receipt);
      return receipt;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `salesInvoices/${invId}`);
    }
  };

  const settleSalesInvoiceDue = async (
    invoice: SalesInvoice,
    additionalPaid: number,
    method: PaymentMethod
  ) => {
    if (!user || invoice.status === 'Paid') return;
    const add = Math.min(invoice.dueAmount, Math.max(0, Number(additionalPaid) || 0));
    if (add <= 0) return;

    const newPaid = invoice.paidAmount + add;
    const newDue = Math.max(0, invoice.grandTotal - newPaid);
    const newStatus: PaymentStatus = newDue === 0 ? 'Paid' : 'Partial';

    const batch = writeBatch(db);
    try {
      batch.update(doc(db, 'salesInvoices', invoice.id), {
        paidAmount: newPaid,
        dueAmount: newDue,
        paymentMethod: method,
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      if (invoice.customerId && invoice.customerId !== 'WALK_IN') {
        const cust = customers.find((c) => c.id === invoice.customerId);
        if (cust) {
          batch.update(doc(db, 'customers', cust.id), {
            totalDue: Math.max(0, cust.totalDue - add),
            updatedAt: serverTimestamp(),
          });
        }
      }

      await batch.commit();
      showToast(`Collected due payment on ${invoice.invoiceNumber}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `salesInvoices/${invoice.id}`);
    }
  };

  const deleteSalesInvoice = async (invoiceId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'salesInvoices', invoiceId));
      showToast('Sales invoice deleted', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `salesInvoices/${invoiceId}`);
    }
  };

  // Supplier Handlers
  const saveSupplier = async (
    data: Omit<Supplier, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    if (!user) return;
    const id = existingId ? sanitizeDocId(existingId) : sanitizeDocId(`sup_${Date.now()}`);
    const payload = {
      name: data.name.trim().slice(0, 100) || 'Supplier Contact',
      companyName: data.companyName.trim().slice(0, 120) || 'Garment Supplier',
      phone: data.phone.trim().slice(0, 30) || '01700-000000',
      address: data.address.trim().slice(0, 200),
      totalPurchased: Math.max(0, Number(data.totalPurchased) || 0),
      totalPayable: Math.max(0, Number(data.totalPayable) || 0),
    };

    try {
      if (existingId) {
        await updateDoc(doc(db, 'suppliers', id), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        showToast('Supplier updated');
      } else {
        await setDoc(doc(db, 'suppliers', id), {
          ...payload,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast('Supplier added');
      }
    } catch (err) {
      handleFirestoreError(
        err,
        existingId ? OperationType.UPDATE : OperationType.CREATE,
        `suppliers/${id}`
      );
    }
  };

  const paySupplierDue = async (supplierId: string, amountPaid: number) => {
    if (!user) return;
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) return;
    const nextPayable = Math.max(0, sup.totalPayable - Math.max(0, Number(amountPaid) || 0));
    try {
      await updateDoc(doc(db, 'suppliers', supplierId), {
        totalPayable: nextPayable,
        updatedAt: serverTimestamp(),
      });
      showToast('Supplier payment recorded');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `suppliers/${supplierId}`);
    }
  };

  const deleteSupplier = async (supplierId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'suppliers', supplierId));
      showToast('Supplier removed', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `suppliers/${supplierId}`);
    }
  };

  // Purchase Invoice Creation
  const createPurchaseInvoice = async (params: {
    supplierId: string;
    supplierName: string;
    cartItems: CartLineItem[];
    paidAmount: number;
    paymentMethod: PaymentMethod;
    purchaseDate: string;
  }): Promise<PrintableReceiptData> => {
    if (!user) throw new Error('Not authenticated');
    const batch = writeBatch(db);
    const purId = sanitizeDocId(`pur_${Date.now()}`);
    const invoiceNumber = `PUR-${Date.now().toString().slice(-5)}`;

    const itemsCount = Math.max(
      1,
      params.cartItems.reduce((acc, i) => acc + Math.max(1, i.quantity), 0)
    );
    const totalAmount = Math.max(
      0,
      params.cartItems.reduce((acc, i) => acc + i.unitCost * i.quantity, 0)
    );
    const paidAmount = Math.min(totalAmount, Math.max(0, Number(params.paidAmount) || 0));
    const dueAmount = Math.max(0, totalAmount - paidAmount);

    let status: PaymentStatus = 'Paid';
    if (dueAmount > 0 && paidAmount > 0) status = 'Partial';
    else if (dueAmount > 0 && paidAmount === 0) status = 'Due';

    const itemsSummary = params.cartItems
      .map(
        (i) =>
          `${i.quantity}x ${i.name} (${i.size}) @ ${storeSettings.currencySymbol}${i.unitCost}`
      )
      .join(' · ')
      .slice(0, 1000);

    const payload = {
      invoiceNumber,
      supplierId: sanitizeDocId(params.supplierId || 'GENERAL_SUPPLIER'),
      supplierName: params.supplierName.trim().slice(0, 120) || 'Wholesale Supplier',
      itemsSummary: itemsSummary || '1x Restocked Garment',
      itemsCount,
      totalAmount,
      paidAmount,
      dueAmount,
      paymentMethod: params.paymentMethod,
      status,
      purchaseDate: params.purchaseDate.slice(0, 30) || new Date().toISOString().slice(0, 10),
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      batch.set(doc(db, 'purchaseInvoices', purId), payload);

      params.cartItems.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          batch.update(doc(db, 'products', prod.id), {
            stock: Math.max(0, prod.stock + item.quantity),
            updatedAt: serverTimestamp(),
          });
        }
      });

      const sup = suppliers.find((s) => s.id === params.supplierId);
      if (sup) {
        batch.update(doc(db, 'suppliers', sup.id), {
          totalPurchased: Math.max(0, sup.totalPurchased + totalAmount),
          totalPayable: Math.max(0, sup.totalPayable + dueAmount),
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
      showToast(`Purchase ${invoiceNumber} saved & stock increased!`);

      const receipt: PrintableReceiptData = {
        type: 'PURCHASE',
        invoiceNumber,
        date: payload.purchaseDate,
        partyName: payload.supplierName,
        partyPhone: sup?.phone || '',
        itemsSummary: payload.itemsSummary,
        itemsCount,
        subtotal: totalAmount,
        discount: 0,
        grandTotal: totalAmount,
        paidAmount,
        dueAmount,
        paymentMethod: params.paymentMethod,
        status,
      };
      setPrintableReceipt(receipt);
      return receipt;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `purchaseInvoices/${purId}`);
    }
  };

  const settlePurchaseInvoiceDue = async (
    purchase: PurchaseInvoice,
    additionalPaid: number,
    method: PaymentMethod
  ) => {
    if (!user || purchase.status === 'Paid') return;
    const add = Math.min(purchase.dueAmount, Math.max(0, Number(additionalPaid) || 0));
    if (add <= 0) return;

    const newPaid = purchase.paidAmount + add;
    const newDue = Math.max(0, purchase.totalAmount - newPaid);
    const newStatus: PaymentStatus = newDue === 0 ? 'Paid' : 'Partial';

    const batch = writeBatch(db);
    try {
      batch.update(doc(db, 'purchaseInvoices', purchase.id), {
        paidAmount: newPaid,
        dueAmount: newDue,
        paymentMethod: method,
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      const sup = suppliers.find((s) => s.id === purchase.supplierId);
      if (sup) {
        batch.update(doc(db, 'suppliers', sup.id), {
          totalPayable: Math.max(0, sup.totalPayable - add),
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
      showToast(`Paid supplier due on ${purchase.invoiceNumber}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `purchaseInvoices/${purchase.id}`);
    }
  };

  const deletePurchaseInvoice = async (purchaseId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'purchaseInvoices', purchaseId));
      showToast('Purchase invoice removed', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `purchaseInvoices/${purchaseId}`);
    }
  };

  // Expense Handlers
  const saveExpense = async (
    data: Omit<Expense, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    if (!user) return;
    const id = existingId ? sanitizeDocId(existingId) : sanitizeDocId(`exp_${Date.now()}`);
    const payload = {
      title: data.title.trim().slice(0, 120) || 'Store Expense',
      category: data.category,
      amount: Math.max(0, Number(data.amount) || 0),
      paymentMethod: data.paymentMethod,
      expenseDate: data.expenseDate.slice(0, 30) || new Date().toISOString().slice(0, 10),
      notes: data.notes.trim().slice(0, 250),
    };

    try {
      if (existingId) {
        await updateDoc(doc(db, 'expenses', id), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        showToast('Expense updated');
      } else {
        await setDoc(doc(db, 'expenses', id), {
          ...payload,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast('Daily expense logged');
      }
    } catch (err) {
      handleFirestoreError(
        err,
        existingId ? OperationType.UPDATE : OperationType.CREATE,
        `expenses/${id}`
      );
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
      showToast('Expense entry deleted', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `expenses/${expenseId}`);
    }
  };

  // Store Settings Handler
  const saveStoreSettings = async (
    data: Omit<StoreSettings, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) return;
    const uid = user.uid;
    const payload = {
      storeName: data.storeName.trim().slice(0, 100) || 'ThreadCraft Menswear',
      tagline: data.tagline.trim().slice(0, 150),
      phone: data.phone.trim().slice(0, 30) || '+880 1700-000000',
      email: data.email.trim().slice(0, 100),
      address: data.address.trim().slice(0, 200) || 'Dhaka, Bangladesh',
      currencySymbol: data.currencySymbol.trim().slice(0, 10) || '৳',
      invoiceFooterNote: data.invoiceFooterNote.trim().slice(0, 300),
      lowStockDefault: Math.max(0, Math.floor(Number(data.lowStockDefault) || 5)),
    };

    try {
      const ref = doc(db, 'storeSettings', uid);
      if (storeSettings.createdAt) {
        await updateDoc(ref, {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          ...payload,
          ownerId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      showToast('Store settings saved');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `storeSettings/${uid}`);
    }
  };

  return (
    <ErpContext.Provider
      value={{
        user,
        authLoading,
        dataLoading,
        activeModule,
        setActiveModule,
        selectedCategoryFilter,
        setSelectedCategoryFilter,
        products,
        allCategories,
        inventoryLogs,
        customers,
        salesOrders,
        salesInvoices,
        suppliers,
        purchaseInvoices,
        expenses,
        returns,
        storeSettings,
        toast,
        showToast,
        printableReceipt,
        setPrintableReceipt,
        pendingOrderForInvoice,
        setPendingOrderForInvoice,
        signInWithGoogle,
        logout,
        seedSampleData,
        addCustomCategory,
        saveProduct,
        adjustProductStock,
        deleteProduct,
        saveCustomer,
        collectCustomerDue,
        deleteCustomer,
        saveSalesOrder,
        updateSalesOrderStatus,
        deleteSalesOrder,
        createSalesInvoice,
        settleSalesInvoiceDue,
        deleteSalesInvoice,
        saveSupplier,
        paySupplierDue,
        deleteSupplier,
        createPurchaseInvoice,
        settlePurchaseInvoiceDue,
        deletePurchaseInvoice,
        saveExpense,
        deleteExpense,
        saveStoreSettings,
        pendingReturnInvoice,
        setPendingReturnInvoice,
        openReturnForInvoice,
        processReturnExchange,
      }}
    >
      {children}
    </ErpContext.Provider>
  );
}

export function useErp() {
  const ctx = useContext(ErpContext);
  if (!ctx) throw new Error('useErp must be used inside ErpProvider');
  return ctx;
}
