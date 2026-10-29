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
  ChevronLeft,
  ChevronRight,
  Filter,
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
  const [payableFilter, setPayableFilter] = useState<'ALL' | 'PAYABLE' | 'CLEAR'>('ALL');
  const [supplierPage, setSupplierPage] = useState(1);
  const supplierPageSize = 8;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [payTarget, setPayTarget] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [payNotes, setPayNotes] = useState('');
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
    await paySupplierDue(
      payTarget.id,
      Number(payAmount) || 0,
      payMethod,
      payNotes
    );
    setPayTarget(null);
    setPayAmount('');
    setPayMethod('Cash');
    setPayNotes('');
  };

  const filtered = suppliers.filter((s) => {
    const matchesPayable =
      payableFilter === 'ALL'
        ? true
        : payableFilter === 'PAYABLE'
        ? s.totalPayable > 0
        : s.totalPayable === 0;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.companyName.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q);
    return matchesPayable && matchesSearch;
  });

  const totalSupplierPages = Math.max(1, Math.ceil(filtered.length / supplierPageSize));
  const pagedSuppliers = filtered.slice(
    (supplierPage - 1) * supplierPageSize,
    supplierPage * supplierPageSize
  );

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

      {/* Search and Payable Filter Controls (Mobile Touch Friendly) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSupplierPage(1);
            }}
            placeholder="Search supplier company, contact person, or phone..."
            className="w-full min-h-[44px] pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-sm focus:border-blue-600 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSupplierPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar shrink-0">
          {(
            [
              { id: 'ALL', label: 'All Suppliers' },
              { id: 'PAYABLE', label: 'Has Payable Due' },
              { id: 'CLEAR', label: 'Settled Accounts' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setPayableFilter(item.id);
                setSupplierPage(1);
              }}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                payableFilter === item.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {pagedSuppliers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-900">No Suppliers Found</p>
          <p className="text-xs text-slate-400">Try changing your search term or payable status</p>
          <button
            onClick={openAdd}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Add First Supplier
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pagedSuppliers.map((s) => (
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
                      className="min-h-[40px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"
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
                      title="Delete Supplier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile-Friendly Pagination Controls */}
          {totalSupplierPages > 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 font-mono">
                Page {supplierPage} of {totalSupplierPages} ({filtered.length} suppliers)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={supplierPage <= 1}
                  onClick={() => setSupplierPage((p) => Math.max(1, p - 1))}
                  className="min-h-[38px] min-w-[38px] px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>
                <div className="px-2 font-mono font-bold text-slate-800">
                  {supplierPage} / {totalSupplierPages}
                </div>
                <button
                  type="button"
                  disabled={supplierPage >= totalSupplierPages}
                  onClick={() => setSupplierPage((p) => Math.min(totalSupplierPages, p + 1))}
                  className="min-h-[38px] min-w-[38px] px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm}>{pm}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note / Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via Bank transfer / Cash"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
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
  const { purchaseInvoices, ledgerTransactions, storeSettings, setPrintableReceipt } = useErp();
  const [activeLedgerTab, setActiveLedgerTab] = useState<'all' | 'invoices' | 'payments'>('all');
  const sym = storeSettings.currencySymbol || '৳';

  const supplierInvoices = purchaseInvoices.filter(
    (inv) =>
      inv.supplierId === supplier.id ||
      inv.supplierName.toLowerCase() === supplier.companyName.toLowerCase() ||
      inv.supplierName.toLowerCase() === supplier.name.toLowerCase()
  );

  const supplierPayments = ledgerTransactions.filter(
    (tx) =>
      tx.partyId === supplier.id ||
      (tx.partyType === 'supplier' &&
        (tx.partyName.toLowerCase() === supplier.companyName.toLowerCase() ||
          tx.partyName.toLowerCase() === supplier.name.toLowerCase()))
  );

  interface SupplierLedgerItem {
    id: string;
    date: string;
    type: 'INVOICE' | 'PAYMENT';
    title: string;
    subtitle?: string;
    details?: string;
    debit?: number; // Invoiced wholesale amount (payable increases)
    credit?: number; // Paid amount to supplier (payable decreases)
    paymentMethod?: string;
    statusBadge?: string;
    statusColor?: string;
    rawInvoice?: typeof supplierInvoices[0];
  }

  const combinedLedger: SupplierLedgerItem[] = [
    ...supplierInvoices.map((inv): SupplierLedgerItem => ({
      id: inv.id,
      date: inv.purchaseDate,
      type: 'INVOICE',
      title: `Purchase ${inv.invoiceNumber}`,
      subtitle: `${inv.itemsCount} pcs`,
      details: inv.itemsSummary,
      debit: inv.totalAmount,
      credit: inv.paidAmount,
      paymentMethod: inv.paymentMethod,
      statusBadge: inv.status,
      statusColor:
        inv.status === 'Paid'
          ? 'bg-emerald-100 text-emerald-800'
          : inv.status === 'Partial'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-red-100 text-red-800',
      rawInvoice: inv,
    })),
    ...supplierPayments.map((p): SupplierLedgerItem => ({
      id: p.id,
      date: p.date,
      type: 'PAYMENT',
      title: `Due Payment Sent`,
      subtitle: p.notes || (p.invoiceNumber ? `Ref: ${p.invoiceNumber}` : 'Supplier Due Settlement'),
      credit: p.amount,
      paymentMethod: p.paymentMethod,
      statusBadge: 'Paid',
      statusColor: 'bg-emerald-100 text-emerald-800',
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const totalPurchased = supplierInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPaidDirect = supplierInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalPaidDues = supplierPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalPaid = totalPaidDirect + totalPaidDues;
  const currentPayable = supplier.totalPayable;

  const displayItems =
    activeLedgerTab === 'invoices'
      ? combinedLedger.filter((item) => item.type === 'INVOICE')
      : activeLedgerTab === 'payments'
      ? combinedLedger.filter((item) => item.type === 'PAYMENT')
      : combinedLedger;

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

        {/* Sub-Tabs: All / Invoices / Payments */}
        <div className="px-5 pt-3 pb-0 flex items-center gap-2 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveLedgerTab('all')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors ${
              activeLedgerTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            All Activity ({combinedLedger.length})
          </button>
          <button
            onClick={() => setActiveLedgerTab('invoices')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors ${
              activeLedgerTab === 'invoices'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Purchase Invoices ({supplierInvoices.length})
          </button>
          <button
            onClick={() => setActiveLedgerTab('payments')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors ${
              activeLedgerTab === 'payments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Payments Sent ({supplierPayments.length})
          </button>
        </div>

        {/* Ledger Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {displayItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-700">No records found for this supplier.</p>
              <p className="text-xs text-slate-400">Invoices and due payments will appear here automatically.</p>
            </div>
          ) : (
            displayItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-4 space-y-3 transition-colors ${
                  item.type === 'PAYMENT'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-slate-900">{item.title}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600 font-mono">{item.date}</span>
                    {item.paymentMethod && (
                      <>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500 font-medium">Via {item.paymentMethod}</span>
                      </>
                    )}
                  </div>
                  {item.statusBadge && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        item.statusColor || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.statusBadge}
                    </span>
                  )}
                </div>

                {item.details && (
                  <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg font-mono">
                    <p className="font-semibold text-slate-900">{item.details}</p>
                    {item.subtitle && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.subtitle}</p>
                    )}
                  </div>
                )}

                {!item.details && item.subtitle && (
                  <p className="text-xs text-slate-600 italic bg-white/60 p-2 rounded border border-slate-100">
                    {item.subtitle}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 font-mono tabular-nums text-xs">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-600">
                    {item.debit !== undefined && (
                      <span>
                        Purchased: <strong className="text-slate-900">{formatBDT(item.debit, sym)}</strong>
                      </span>
                    )}
                    {item.credit !== undefined && (
                      <span>
                        Paid: <strong className="text-emerald-600">{formatBDT(item.credit, sym)}</strong>
                      </span>
                    )}
                    {item.rawInvoice && item.rawInvoice.dueAmount > 0 && (
                      <span>
                        Due: <strong className="text-red-600">{formatBDT(item.rawInvoice.dueAmount, sym)}</strong>
                      </span>
                    )}
                  </div>

                  {item.rawInvoice && (
                    <button
                      onClick={() => {
                        setPrintableReceipt({
                          type: 'PURCHASE',
                          invoiceNumber: item.rawInvoice!.invoiceNumber,
                          date: item.rawInvoice!.purchaseDate,
                          partyName: item.rawInvoice!.supplierName,
                          partyPhone: supplier.phone,
                          itemsSummary: item.rawInvoice!.itemsSummary,
                          itemsCount: item.rawInvoice!.itemsCount,
                          subtotal: item.rawInvoice!.totalAmount,
                          discount: 0,
                          grandTotal: item.rawInvoice!.totalAmount,
                          paidAmount: item.rawInvoice!.paidAmount,
                          dueAmount: item.rawInvoice!.dueAmount,
                          paymentMethod: item.rawInvoice!.paymentMethod,
                          status: item.rawInvoice!.status,
                        });
                      }}
                      className="min-h-[36px] px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Invoice</span>
                    </button>
                  )}
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

  // Purchase Invoices Filter & Pagination States
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState<'ALL' | 'Paid' | 'Partial' | 'Due'>('ALL');
  const [purchasePage, setPurchasePage] = useState(1);
  const purchasePageSize = 8;

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

  const filteredPurchases = purchaseInvoices.filter((pur) => {
    const matchesStatus =
      purchaseStatusFilter === 'ALL' || pur.status === purchaseStatusFilter;
    const q = purchaseSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      pur.invoiceNumber.toLowerCase().includes(q) ||
      pur.supplierName.toLowerCase().includes(q) ||
      pur.itemsSummary.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalPurchasePages = Math.max(1, Math.ceil(filteredPurchases.length / purchasePageSize));
  const pagedPurchases = filteredPurchases.slice(
    (purchasePage - 1) * purchasePageSize,
    purchasePage * purchasePageSize
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Purchase Invoices History ({filteredPurchases.length})
            </h3>
            <p className="text-xs text-slate-500">
              Review factory restock invoices, filter by status or pay supplier dues
            </p>
          </div>

          {/* Quick Search & Status Filter (Mobile-friendly) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search invoice, supplier, item..."
                value={purchaseSearch}
                onChange={(e) => {
                  setPurchaseSearch(e.target.value);
                  setPurchasePage(1);
                }}
                className="w-full min-h-[40px] pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 transition-colors"
              />
              {purchaseSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setPurchaseSearch('');
                    setPurchasePage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              {(['ALL', 'Paid', 'Partial', 'Due'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setPurchaseStatusFilter(st);
                    setPurchasePage(1);
                  }}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    purchaseStatusFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {pagedPurchases.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No purchase invoices match your filter
          </div>
        ) : (
          <div className="space-y-3">
            {pagedPurchases.map((pur) => (
              <div
                key={pur.id}
                className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:border-slate-300 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-slate-900">
                      {pur.invoiceNumber}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-bold text-slate-900 text-sm truncate">
                      {pur.supplierName}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono text-slate-500">{pur.purchaseDate}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        pur.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : pur.status === 'Partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {pur.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-1">{pur.itemsSummary}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums mt-1.5">
                    <span>
                      Total: <strong>{formatBDT(pur.totalAmount, sym)}</strong>
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-emerald-700 font-semibold">
                      Paid: {formatBDT(pur.paidAmount, sym)}
                    </span>
                    {pur.dueAmount > 0 && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-red-600 font-bold">
                          Payable Due: {formatBDT(pur.dueAmount, sym)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-end sm:self-center">
                  {pur.dueAmount > 0 && pur.status !== 'Paid' && (
                    <button
                      onClick={() => {
                        setSettleTarget(pur);
                        setSettleAmount(String(pur.dueAmount));
                      }}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
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
                    className="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1 hover:bg-slate-50 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Voucher</span>
                  </button>
                  <button
                    onClick={() => deletePurchaseInvoice(pur.id)}
                    className="min-h-[38px] min-w-[38px] rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 flex items-center justify-center"
                    title="Delete Invoice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile-Friendly Pagination Controls */}
        {totalPurchasePages > 1 && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 font-mono">
              Page {purchasePage} of {totalPurchasePages} ({filteredPurchases.length} invoices)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={purchasePage <= 1}
                onClick={() => setPurchasePage((p) => Math.max(1, p - 1))}
                className="min-h-[38px] min-w-[38px] px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>
              <div className="px-2 font-mono font-bold text-slate-800">
                {purchasePage} / {totalPurchasePages}
              </div>
              <button
                type="button"
                disabled={purchasePage >= totalPurchasePages}
                onClick={() => setPurchasePage((p) => Math.min(totalPurchasePages, p + 1))}
                className="min-h-[38px] min-w-[38px] px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 flex items-center justify-center gap-1"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
