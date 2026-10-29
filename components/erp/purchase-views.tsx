'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Phone,
  Edit3,
  Trash2,
  X,
  Printer,
  Building2,
  ClipboardList,
  Minus,
  Camera,
  QrCode,
} from 'lucide-react';
import { useErp, CartLineItem } from '@/context/erp-context';
import { QrCameraScannerModal } from './qr-camera-scanner-modal';
import {
  Supplier,
  PurchaseInvoice,
  PaymentMethod,
  PAYMENT_METHODS,
  GARMENT_CATEGORIES,
  formatBDT,
} from '@/lib/types';

/* ============================================================================
   1. PURCHASE -> SUPPLIER VIEW
   ============================================================================ */
export function SupplierView() {
  const {
    suppliers,
    storeSettings,
    saveSupplier,
    paySupplierDue,
    deleteSupplier,
  } = useErp();

  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [payTarget, setPayTarget] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [ledgerSupplier, setLedgerSupplier] = useState<Supplier | null>(null);

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [totalPurchased, setTotalPurchased] = useState('0');
  const [totalPayable, setTotalPayable] = useState('0');
  const sym = storeSettings.currencySymbol || '৳';

  const openAdd = () => {
    setEditingSupplier(null);
    setName('');
    setCompanyName('');
    setPhone('');
    setAddress('');
    setTotalPurchased('0');
    setTotalPayable('0');
    setSheetOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setCompanyName(s.companyName);
    setPhone(s.phone);
    setAddress(s.address);
    setTotalPurchased(String(s.totalPurchased));
    setTotalPayable(String(s.totalPayable));
    setSheetOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSupplier(
      {
        name,
        companyName,
        phone,
        address,
        totalPurchased: Number(totalPurchased) || 0,
        totalPayable: Number(totalPayable) || 0,
      },
      editingSupplier?.id
    );
    setSheetOpen(false);
  };

  const handlePayDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTarget) return;
    await paySupplierDue(payTarget.id, Number(payAmount) || 0);
    setPayTarget(null);
    setPayAmount('');
  };

  const filtered = suppliers.filter((s) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      s.companyName.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q)
    );
  });

  const totalPayableSum = suppliers.reduce((acc, s) => acc + s.totalPayable, 0);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Garment Suppliers & Payable Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
            {suppliers.length} Suppliers · Total Payable Balance:{' '}
            {formatBDT(totalPayableSum, sym)}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="min-h-[46px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search supplier company, contact person, or phone..."
          className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-900">No Suppliers Found</p>
          <button
            onClick={openAdd}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Add First Supplier
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm sm:text-base text-slate-900 truncate">
                    {s.companyName}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">Contact: {s.name}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="font-mono">{s.phone}</span>
                    {s.address && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{s.address}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right font-mono tabular-nums shrink-0">
                  <p
                    className={`text-sm font-bold ${
                      s.totalPayable > 0 ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {s.totalPayable > 0
                      ? `Payable: ${formatBDT(s.totalPayable, sym)}`
                      : 'Settled'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Purchased: {formatBDT(s.totalPurchased, sym)}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                {s.totalPayable > 0 ? (
                  <button
                    onClick={() => {
                      setPayTarget(s);
                      setPayAmount(String(s.totalPayable));
                    }}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
                  >
                    Pay Supplier Due
                  </button>
                ) : (
                  <span className="text-xs text-emerald-700 font-medium">
                    No Payable Due
                  </span>
                )}

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setLedgerSupplier(s)}
                    className="min-h-[40px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Ledger</span>
                  </button>
                  <a
                    href={`tel:${s.phone}`}
                    className="min-h-[40px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                  <button
                    onClick={() => openEdit(s)}
                    className="min-h-[40px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => deleteSupplier(s.id)}
                    className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Supplier Bottom Sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleSave}
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                {editingSupplier ? 'Edit Supplier' : 'Add Garment Supplier'}
              </h3>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Mill Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Dhaka Denim & Apparels Ltd."
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Person Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Haji Abdul Karim"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01713-000000"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Factory / Wholesale Market Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Mirpur-11 Garments Zone, Dhaka"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Purchased ({sym})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalPurchased}
                    onChange={(e) => setTotalPurchased(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payable Due ({sym})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalPayable}
                    onChange={(e) => setTotalPayable(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex-1 min-h-[46px] rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 min-h-[46px] rounded-xl bg-blue-600 text-white font-semibold text-sm"
              >
                Save Supplier
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pay Supplier Due Modal */}
      {payTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handlePayDue}
            className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Pay Supplier Due</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {payTarget.companyName} · Current Payable:{' '}
                {formatBDT(payTarget.totalPayable, sym)}
              </p>
            </div>
            <div className="p-5 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Payment Amount ({sym}) *
              </label>
              <input
                type="number"
                min="1"
                max={payTarget.totalPayable}
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full min-h-[46px] px-3.5 py-2 rounded-xl border border-slate-200 text-base font-mono tabular-nums"
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={() => setPayTarget(null)}
                className="flex-1 min-h-[44px] rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 min-h-[44px] rounded-xl bg-emerald-600 text-white font-semibold text-sm"
              >
                Confirm Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Supplier Ledger Modal */}
      {ledgerSupplier && (
        <SupplierLedgerModal
          supplier={ledgerSupplier}
          onClose={() => setLedgerSupplier(null)}
        />
      )}
    </div>
  );
}

function SupplierLedgerModal({
  supplier,
  onClose,
}: {
  supplier: Supplier;
  onClose: () => void;
}) {
  const { purchaseInvoices, storeSettings, setPrintableReceipt } = useErp();
  const sym = storeSettings.currencySymbol || '৳';

  const supplierInvoices = purchaseInvoices.filter(
    (inv) =>
      inv.supplierId === supplier.id ||
      inv.supplierName.toLowerCase() === supplier.companyName.toLowerCase() ||
      inv.supplierName.toLowerCase() === supplier.name.toLowerCase()
  );

  const totalPurchased = supplierInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPaid = supplierInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
  const currentPayable = supplier.totalPayable;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <span>Supplier Ledger: {supplier.companyName}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Contact: {supplier.name} · Phone: {supplier.phone} {supplier.address ? `· ${supplier.address}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl hover:bg-slate-200 flex items-center justify-center text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="p-5 grid grid-cols-3 gap-3 bg-slate-50/50 border-b border-slate-200 font-mono tabular-nums">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <p className="font-sans text-[11px] text-slate-500">Total Purchased</p>
            <p className="text-sm sm:text-base font-bold text-slate-900 mt-1">
              {formatBDT(totalPurchased, sym)}
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <p className="font-sans text-[11px] text-slate-500">Total Paid</p>
            <p className="text-sm sm:text-base font-bold text-emerald-600 mt-1">
              {formatBDT(totalPaid, sym)}
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <p className="font-sans text-[11px] text-slate-500">Payable Due</p>
            <p
              className={`text-sm sm:text-base font-bold mt-1 ${
                currentPayable > 0 ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              {formatBDT(currentPayable, sym)}
            </p>
          </div>
        </div>

        {/* Invoices List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Purchase Invoices & Stock Restock History ({supplierInvoices.length} invoices)
          </h4>

          {supplierInvoices.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-700">No purchase invoices found for this supplier.</p>
              <p className="text-xs text-slate-400">Invoices created during Stock Purchase will appear here automatically.</p>
            </div>
          ) : (
            supplierInvoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-slate-900">{inv.invoiceNumber}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600 font-mono">{inv.purchaseDate}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      inv.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : inv.status === 'Partial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>

                <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg font-mono">
                  <p className="font-semibold text-slate-900">{inv.itemsSummary}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Total Units: {inv.itemsCount} pcs</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 font-mono tabular-nums text-xs">
                  <div className="space-x-3 text-slate-600">
                    <span>Total: <strong className="text-slate-900">{formatBDT(inv.totalAmount, sym)}</strong></span>
                    <span>Paid: <strong className="text-emerald-600">{formatBDT(inv.paidAmount, sym)}</strong></span>
                    <span>Due: <strong className="text-red-600">{formatBDT(inv.dueAmount, sym)}</strong></span>
                  </div>

                  <button
                    onClick={() => {
                      setPrintableReceipt({
                        type: 'PURCHASE',
                        invoiceNumber: inv.invoiceNumber,
                        date: inv.purchaseDate,
                        partyName: inv.supplierName,
                        partyPhone: supplier.phone,
                        itemsSummary: inv.itemsSummary,
                        itemsCount: inv.itemsCount,
                        subtotal: inv.totalAmount,
                        discount: 0,
                        grandTotal: inv.totalAmount,
                        paidAmount: inv.paidAmount,
                        dueAmount: inv.dueAmount,
                        paymentMethod: inv.paymentMethod,
                        status: inv.status,
                      });
                    }}
                    className="min-h-[36px] px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Invoice</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="min-h-[42px] px-5 rounded-xl bg-slate-900 text-white font-semibold text-xs sm:text-sm hover:bg-slate-800"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   2. PURCHASE -> PURCHASE INVOICE VIEW (Stock Restock Builder + Ledger)
   ============================================================================ */
export function PurchaseInvoiceView() {
  const {
    products,
    allCategories,
    suppliers,
    purchaseInvoices,
    storeSettings,
    createPurchaseInvoice,
    settlePurchaseInvoiceDue,
    deletePurchaseInvoice,
    setPrintableReceipt,
  } = useErp();

  const [catFilter, setCatFilter] = useState<string>('All');
  const [supplierId, setSupplierId] = useState(() => suppliers[0]?.id || '');
  const [supplierName, setSupplierName] = useState(
    () => suppliers[0]?.companyName || 'Wholesale Supplier'
  );
  const [cart, setCart] = useState<CartLineItem[]>([]);
  const [paidAmount, setPaidAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [submitting, setSubmitting] = useState(false);

  const [settleTarget, setSettleTarget] = useState<PurchaseInvoice | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('Cash');
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);

  const sym = storeSettings.currencySymbol || '৳';
  const effectiveSupplierId = supplierId || suppliers[0]?.id || 'GENERAL_SUPPLIER';
  const effectiveSupplierName =
    supplierId && supplierName
      ? supplierName
      : suppliers[0]?.companyName || 'Wholesale Supplier';

  const totalAmount = cart.reduce((acc, i) => acc + i.unitCost * i.quantity, 0);
  const numPaid = Math.min(totalAmount, Math.max(0, Number(paidAmount) || 0));
  const dueAmount = Math.max(0, totalAmount - numPaid);

  const addRestockItem = (prodId: string) => {
    const p = products.find((x) => x.id === prodId);
    if (!p) return;
    const existing = cart.find((item) => item.productId === p.id);
    const nextCart = existing
      ? cart.map((item) =>
          item.productId === p.id ? { ...item, quantity: item.quantity + 5 } : item
        )
      : [
          ...cart,
          {
            productId: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            size: p.size,
            color: p.color,
            unitPrice: p.sellingPrice,
            unitCost: p.purchasePrice,
            quantity: 10,
          },
        ];
    setCart(nextCart);
    const nextTotal = nextCart.reduce((acc, i) => acc + i.unitCost * i.quantity, 0);
    setPaidAmount(String(nextTotal));
  };

  const updateCartQty = (productId: string, nextQty: number) => {
    const nextCart = cart
      .map((item) => {
        if (item.productId !== productId) return item;
        return nextQty > 0 ? { ...item, quantity: nextQty } : null;
      })
      .filter(Boolean) as CartLineItem[];
    setCart(nextCart);
    const nextTotal = nextCart.reduce((acc, i) => acc + i.unitCost * i.quantity, 0);
    setPaidAmount(String(nextTotal));
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      await createPurchaseInvoice({
        supplierId: effectiveSupplierId,
        supplierName: effectiveSupplierName,
        cartItems: cart,
        paidAmount: numPaid,
        paymentMethod,
        purchaseDate: new Date().toISOString().slice(0, 10),
      });
      setCart([]);
      setPaidAmount('0');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleTarget) return;
    await settlePurchaseInvoiceDue(settleTarget, Number(settleAmount) || 0, settleMethod);
    setSettleTarget(null);
  };

  const filteredProducts = products.filter(
    (p) => catFilter === 'All' || p.category === catFilter
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Select Garments to Restock (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              1. Tap Garments to Restock Inventory
            </h2>
            <p className="text-xs text-slate-500">
              Recording a purchase invoice automatically increases stock counts
            </p>
          </div>

          <div className="flex gap-2">
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="flex-1 min-h-[44px] px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs font-semibold text-slate-800"
            >
              <option value="All">All Categories ({products.length})</option>
              {allCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setCameraScannerOpen(true)}
              className="min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shrink-0 transition-transform"
              title="Scan Garment QR to Restock"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const inCart = cart.find((c) => c.productId === p.id)?.quantity || 0;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => addRestockItem(p.id)}
                  className={`min-h-[68px] p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                    inCart > 0
                      ? 'border-emerald-600 bg-emerald-50/40'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {p.category} · Size {p.size} · Stock: {p.stock}
                    </p>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <p className="text-xs font-bold text-slate-900">
                      Cost {formatBDT(p.purchasePrice, sym)}
                    </p>
                    {inCart > 0 && (
                      <span className="text-[11px] font-bold text-emerald-700">
                        +{inCart} pcs
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Supplier & Purchase Voucher Form (5 cols) */}
        <form
          onSubmit={handleCreatePurchase}
          className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900">
            2. Supplier & Restock Payment
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Supplier
            </label>
            <select
              value={supplierId}
              onChange={(e) => {
                const id = e.target.value;
                setSupplierId(id);
                const s = suppliers.find((x) => x.id === id);
                setSupplierName(s ? s.companyName : 'Wholesale Supplier');
              }}
              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 text-base sm:text-xs bg-white"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.companyName} ({s.name})
                </option>
              ))}
              <option value="GENERAL_SUPPLIER">Direct Factory / Walk-in Supplier</option>
            </select>
          </div>

          {/* Restock Line Items */}
          <div className="border-t border-b border-slate-100 py-3 space-y-2 max-h-56 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                Tap any garment item on the left to restock (+10 pcs per tap).
              </p>
            ) : (
              cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                      Size {item.size} · Cost {formatBDT(item.unitCost, sym)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateCartQty(item.productId, Number(e.target.value) || 0)
                      }
                      className="w-14 h-7 rounded-lg border border-slate-200 bg-white text-center font-mono font-bold text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount Paid to Supplier ({sym})
            </label>
            <input
              type="number"
              min="0"
              max={totalAmount}
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 text-base sm:text-xs font-mono tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`min-h-[40px] rounded-xl text-xs font-semibold border transition-colors ${
                    paymentMethod === m
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-xl space-y-1.5 text-xs font-mono tabular-nums">
            <div className="flex justify-between text-base font-bold text-white">
              <span>Purchase Total</span>
              <span>{formatBDT(totalAmount, sym)}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Paid Now ({paymentMethod})</span>
              <span>{formatBDT(numPaid, sym)}</span>
            </div>
            <div className="flex justify-between text-red-400 font-bold">
              <span>Payable Due</span>
              <span>{formatBDT(dueAmount, sym)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={cart.length === 0 || submitting}
            className="w-full min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>
              {submitting ? 'Saving Purchase...' : 'Save Purchase & Increase Stock'}
            </span>
          </button>
        </form>
      </div>

      {/* Purchase Invoices History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          Purchase Invoices History ({purchaseInvoices.length})
        </h3>

        <div className="space-y-3">
          {purchaseInvoices.map((pur) => (
            <div
              key={pur.id}
              className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-slate-900">
                    {pur.invoiceNumber}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {pur.supplierName}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-500">{pur.purchaseDate}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{pur.itemsSummary}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums mt-1.5">
                  <span>
                    Total: <strong>{formatBDT(pur.totalAmount, sym)}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700">
                    Paid: {formatBDT(pur.paidAmount, sym)}
                  </span>
                  {pur.dueAmount > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-red-600 font-bold">
                        Payable Due: {formatBDT(pur.dueAmount, sym)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {pur.dueAmount > 0 && pur.status !== 'Paid' && (
                  <button
                    onClick={() => {
                      setSettleTarget(pur);
                      setSettleAmount(String(pur.dueAmount));
                    }}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
                  >
                    Pay Due
                  </button>
                )}
                <button
                  onClick={() =>
                    setPrintableReceipt({
                      type: 'PURCHASE',
                      invoiceNumber: pur.invoiceNumber,
                      date: pur.purchaseDate,
                      partyName: pur.supplierName,
                      partyPhone: '',
                      itemsSummary: pur.itemsSummary,
                      itemsCount: pur.itemsCount,
                      subtotal: pur.totalAmount,
                      discount: 0,
                      grandTotal: pur.totalAmount,
                      paidAmount: pur.paidAmount,
                      dueAmount: pur.dueAmount,
                      paymentMethod: pur.paymentMethod,
                      status: pur.status,
                    })
                  }
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Voucher</span>
                </button>
                <button
                  onClick={() => deletePurchaseInvoice(pur.id)}
                  className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settle Purchase Due Modal */}
      {settleTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleSettlePurchase}
            className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                Pay Voucher {settleTarget.invoiceNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {settleTarget.supplierName} · Payable Due:{' '}
                {formatBDT(settleTarget.dueAmount, sym)}
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Paid ({sym}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={settleTarget.dueAmount}
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setSettleMethod(m)}
                      className={`min-h-[38px] rounded-xl text-xs font-semibold border ${
                        settleMethod === m
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={() => setSettleTarget(null)}
                className="flex-1 min-h-[44px] rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 min-h-[44px] rounded-xl bg-emerald-600 text-white font-semibold text-sm"
              >
                Confirm Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Camera Barcode/QR Scanner for Restock */}
      <QrCameraScannerModal
        isOpen={cameraScannerOpen}
        onClose={() => setCameraScannerOpen(false)}
        onScanItem={(product) => addRestockItem(product.id)}
        continuousMode={true}
        title="Restock Garment Scanner"
        subtitle="Point camera at clothing tags to add to purchase restock"
      />
    </div>
  );
}
