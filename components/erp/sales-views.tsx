'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Phone,
  MapPin,
  Edit3,
  Trash2,
  X,
  Printer,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  Users,
  ClipboardList,
  Minus,
  RotateCcw,
  ArrowLeftRight,
  Camera,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useErp, CartLineItem } from '@/context/erp-context';
import { QrCameraScannerModal } from './qr-camera-scanner-modal';
import {
  Customer,
  SalesOrder,
  SalesInvoice,
  OrderStatus,
  PaymentMethod,
  PAYMENT_METHODS,
  GARMENT_CATEGORIES,
  ReturnType,
  formatBDT,
} from '@/lib/types';

/* ============================================================================
   1. SALES -> CUSTOMER VIEW
   ============================================================================ */
export function CustomerView() {
  const {
    customers,
    storeSettings,
    saveCustomer,
    collectCustomerDue,
    deleteCustomer,
  } = useErp();

  const [search, setSearch] = useState('');
  const [dueFilter, setDueFilter] = useState<'ALL' | 'DUE' | 'CLEAR'>('ALL');
  const [customerPage, setCustomerPage] = useState(1);
  const customerPageSize = 8;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [dueCollectionTarget, setDueCollectionTarget] = useState<Customer | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState<PaymentMethod>('Cash');
  const [collectNotes, setCollectNotes] = useState('');
  const [ledgerCustomer, setLedgerCustomer] = useState<Customer | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [totalSales, setTotalSales] = useState('0');
  const [totalDue, setTotalDue] = useState('0');
  const sym = storeSettings.currencySymbol || '৳';

  const openAdd = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setTotalSales('0');
    setTotalDue('0');
    setSheetOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address);
    setTotalSales(String(c.totalSales));
    setTotalDue(String(c.totalDue));
    setSheetOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCustomer(
      {
        name,
        phone,
        address,
        totalSales: Number(totalSales) || 0,
        totalDue: Number(totalDue) || 0,
      },
      editingCustomer?.id
    );
    setSheetOpen(false);
  };

  const handleCollectDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueCollectionTarget) return;
    await collectCustomerDue(
      dueCollectionTarget.id,
      Number(collectAmount) || 0,
      collectMethod,
      collectNotes
    );
    setDueCollectionTarget(null);
    setCollectAmount('');
    setCollectMethod('Cash');
    setCollectNotes('');
  };

  const filtered = customers.filter((c) => {
    const matchesDue =
      dueFilter === 'ALL'
        ? true
        : dueFilter === 'DUE'
        ? c.totalDue > 0
        : c.totalDue === 0;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q);
    return matchesDue && matchesSearch;
  });

  const totalCustomerPages = Math.max(1, Math.ceil(filtered.length / customerPageSize));
  const pagedCustomers = filtered.slice(
    (customerPage - 1) * customerPageSize,
    customerPage * customerPageSize
  );

  const totalDueSum = customers.reduce((acc, c) => acc + c.totalDue, 0);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Customer Accounts & Due Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
            {customers.length} Customers · Total Receivable Due: {formatBDT(totalDueSum, sym)}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="min-h-[46px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search and Due Filter Controls (Mobile Touch Friendly) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCustomerPage(1);
            }}
            placeholder="Search customer by name, phone, or area..."
            className="w-full min-h-[44px] pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-sm focus:border-blue-600 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCustomerPage(1);
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
              { id: 'ALL', label: 'All Accounts' },
              { id: 'DUE', label: 'Has Due' },
              { id: 'CLEAR', label: 'Account Clear' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setDueFilter(item.id);
                setCustomerPage(1);
              }}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                dueFilter === item.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {pagedCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-900">No Customers Found</p>
          <p className="text-xs text-slate-400">Try changing your search term or due filter</p>
          <button
            onClick={openAdd}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Add First Customer
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pagedCustomers.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm sm:text-base text-slate-900 truncate">
                      {c.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="font-mono">{c.phone}</span>
                      {c.address && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{c.address}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right font-mono tabular-nums shrink-0">
                    <p
                      className={`text-sm font-bold ${
                        c.totalDue > 0 ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {c.totalDue > 0 ? `Due: ${formatBDT(c.totalDue, sym)}` : 'No Due'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Sales: {formatBDT(c.totalSales, sym)}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                  {c.totalDue > 0 ? (
                    <button
                      onClick={() => {
                        setDueCollectionTarget(c);
                        setCollectAmount(String(c.totalDue));
                      }}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-semibold shadow-xs"
                    >
                      Collect Due
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700 font-medium">
                      Account Clear
                    </span>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setLedgerCustomer(c)}
                      className="min-h-[40px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>Ledger</span>
                    </button>
                    <a
                      href={`tel:${c.phone}`}
                      className="min-h-[40px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                    <button
                      onClick={() => openEdit(c)}
                      className="min-h-[40px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => deleteCustomer(c.id)}
                      className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 flex items-center justify-center"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile-Friendly Pagination Controls */}
          {totalCustomerPages > 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 font-mono">
                Page {customerPage} of {totalCustomerPages} ({filtered.length} customers)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={customerPage <= 1}
                  onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
                  className="min-h-[38px] min-w-[38px] px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>
                <div className="px-2 font-mono font-bold text-slate-800">
                  {customerPage} / {totalCustomerPages}
                </div>
                <button
                  type="button"
                  disabled={customerPage >= totalCustomerPages}
                  onClick={() => setCustomerPage((p) => Math.min(totalCustomerPages, p + 1))}
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

      {/* Add / Edit Customer Bottom Sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleSave}
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
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
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01711-000000"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address / Location
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Uttara Sector 7, Dhaka"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Opening Sales ({sym})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalSales}
                    onChange={(e) => setTotalSales(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Due ({sym})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalDue}
                    onChange={(e) => setTotalDue(e.target.value)}
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
                Save Customer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Collect Due Modal */}
      {dueCollectionTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleCollectDue}
            className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                Collect Customer Due
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {dueCollectionTarget.name} · Current Due:{' '}
                {formatBDT(dueCollectionTarget.totalDue, sym)}
              </p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Received ({sym}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={dueCollectionTarget.totalDue}
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 py-2 rounded-xl border border-slate-200 text-base font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value as PaymentMethod)}
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
                  placeholder="e.g. Received via bKash / Cash counter"
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={() => setDueCollectionTarget(null)}
                className="flex-1 min-h-[44px] rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 min-h-[44px] rounded-xl bg-emerald-600 text-white font-semibold text-sm"
              >
                Confirm Collection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer Ledger Modal */}
      {ledgerCustomer && (
        <CustomerLedgerModal
          customer={ledgerCustomer}
          onClose={() => setLedgerCustomer(null)}
        />
      )}
    </div>
  );
}

function CustomerLedgerModal({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  const { salesInvoices, ledgerTransactions, storeSettings, setPrintableReceipt, openReturnForInvoice } = useErp();
  const [activeLedgerTab, setActiveLedgerTab] = useState<'all' | 'invoices' | 'payments'>('all');
  const sym = storeSettings.currencySymbol || '৳';

  const customerInvoices = salesInvoices.filter(
    (inv) =>
      inv.customerId === customer.id ||
      inv.customerName.toLowerCase() === customer.name.toLowerCase()
  );

  const customerPayments = ledgerTransactions.filter(
    (tx) =>
      tx.partyId === customer.id ||
      (tx.partyType === 'customer' && tx.partyName.toLowerCase() === customer.name.toLowerCase())
  );

  // Combine invoices and payment records into a unified chronological ledger stream
  interface LedgerItem {
    id: string;
    date: string;
    type: 'INVOICE' | 'PAYMENT';
    title: string;
    subtitle?: string;
    details?: string;
    debit?: number; // Invoiced charge (increases due)
    credit?: number; // Payment made (decreases due)
    paymentMethod?: string;
    statusBadge?: string;
    statusColor?: string;
    rawInvoice?: typeof customerInvoices[0];
  }

  const combinedLedger: LedgerItem[] = [
    ...customerInvoices.map((inv): LedgerItem => ({
      id: inv.id,
      date: inv.invoiceDate,
      type: 'INVOICE',
      title: `Invoice ${inv.invoiceNumber}`,
      subtitle: `${inv.itemsCount} pcs · ${inv.primaryCategory}`,
      details: inv.itemsSummary,
      debit: inv.grandTotal,
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
    ...customerPayments.map((p): LedgerItem => ({
      id: p.id,
      date: p.date,
      type: 'PAYMENT',
      title: `Due Payment Received`,
      subtitle: p.notes || (p.invoiceNumber ? `Ref: ${p.invoiceNumber}` : 'Customer Due Collection'),
      credit: p.amount,
      paymentMethod: p.paymentMethod,
      statusBadge: 'Received',
      statusColor: 'bg-emerald-100 text-emerald-800',
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const totalBilled = customerInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
  const totalPaidDirect = customerInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalDuePayments = customerPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalPaid = totalPaidDirect + totalDuePayments;
  const currentDue = customer.totalDue;

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
              <span>Customer Ledger: {customer.name}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Phone: {customer.phone} {customer.address ? `· ${customer.address}` : ''}
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
            <p className="font-sans text-[11px] text-slate-500">Total Invoiced</p>
            <p className="text-sm sm:text-base font-bold text-slate-900 mt-1">
              {formatBDT(totalBilled, sym)}
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <p className="font-sans text-[11px] text-slate-500">Total Paid</p>
            <p className="text-sm sm:text-base font-bold text-emerald-600 mt-1">
              {formatBDT(totalPaid, sym)}
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <p className="font-sans text-[11px] text-slate-500">Current Balance Due</p>
            <p
              className={`text-sm sm:text-base font-bold mt-1 ${
                currentDue > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {formatBDT(currentDue, sym)}
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
            Invoices ({customerInvoices.length})
          </button>
          <button
            onClick={() => setActiveLedgerTab('payments')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors ${
              activeLedgerTab === 'payments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Due Payments Received ({customerPayments.length})
          </button>
        </div>

        {/* Ledger Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {displayItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-700">No records found in this view.</p>
              <p className="text-xs text-slate-400">Transactions and invoice records will appear here automatically.</p>
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
                        Billed: <strong className="text-slate-900">{formatBDT(item.debit, sym)}</strong>
                      </span>
                    )}
                    {item.credit !== undefined && (
                      <span>
                        Paid: <strong className="text-emerald-600">{formatBDT(item.credit, sym)}</strong>
                      </span>
                    )}
                    {item.rawInvoice && item.rawInvoice.dueAmount > 0 && (
                      <span>
                        Due: <strong className="text-amber-600">{formatBDT(item.rawInvoice.dueAmount, sym)}</strong>
                      </span>
                    )}
                  </div>

                  {item.rawInvoice && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onClose();
                          openReturnForInvoice(item.rawInvoice!);
                        }}
                        className="min-h-[36px] px-3 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 font-semibold text-purple-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Return / Exchange</span>
                      </button>
                      <button
                        onClick={() => {
                          setPrintableReceipt({
                            type: 'SALES',
                            invoiceNumber: item.rawInvoice!.invoiceNumber,
                            date: item.rawInvoice!.invoiceDate,
                            partyName: item.rawInvoice!.customerName,
                            partyPhone: item.rawInvoice!.customerPhone,
                            itemsSummary: item.rawInvoice!.itemsSummary,
                            itemsCount: item.rawInvoice!.itemsCount,
                            subtotal: item.rawInvoice!.subtotal,
                            discount: item.rawInvoice!.discount,
                            grandTotal: item.rawInvoice!.grandTotal,
                            paidAmount: item.rawInvoice!.paidAmount,
                            dueAmount: item.rawInvoice!.dueAmount,
                            paymentMethod: item.rawInvoice!.paymentMethod,
                            status: item.rawInvoice!.status,
                          });
                        }}
                        className="min-h-[36px] px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Invoice</span>
                      </button>
                    </div>
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
   2. SALES -> SALES ORDER VIEW
   ============================================================================ */
export function SalesOrderView() {
  const {
    salesOrders,
    customers,
    products,
    storeSettings,
    saveSalesOrder,
    updateSalesOrderStatus,
    deleteSalesOrder,
    setPendingOrderForInvoice,
    setActiveModule,
  } = useErp();

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sheetOpen, setSheetOpen] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedProdId, setSelectedProdId] = useState('');
  const [orderQty, setOrderQty] = useState('2');
  const [itemsSummary, setItemsSummary] = useState('');
  const [itemsCount, setItemsCount] = useState('2');
  const [totalAmount, setTotalAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const sym = storeSettings.currencySymbol || '৳';

  const openNewOrder = () => {
    const firstCust = customers[0];
    setCustomerId(firstCust?.id || 'WALK_IN');
    setCustomerName(firstCust?.name || 'Walk-in Customer');
    const firstProd = products[0];
    setSelectedProdId(firstProd?.id || '');
    setOrderQty('2');
    if (firstProd) {
      setItemsSummary(`2x ${firstProd.name} (${firstProd.size})`);
      setItemsCount('2');
      setTotalAmount(String(firstProd.sellingPrice * 2));
    } else {
      setItemsSummary('');
      setItemsCount('1');
      setTotalAmount('0');
    }
    setNotes('');
    setSheetOpen(true);
  };

  const handleQuickAddItemToSummary = () => {
    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod) return;
    const q = Math.max(1, Number(orderQty) || 1);
    const segment = `${q}x ${prod.name} (${prod.size})`;
    setItemsSummary((prev) => (prev ? `${prev} · ${segment}` : segment));
    setItemsCount((prev) => String((Number(prev) || 0) + q));
    setTotalAmount((prev) => String((Number(prev) || 0) + prod.sellingPrice * q));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSalesOrder({
      orderNumber: `SO-${Date.now().toString().slice(-4)}`,
      customerId: customerId || 'WALK_IN',
      customerName: customerName || 'Walk-in Customer',
      itemsSummary: itemsSummary || 'Assorted Garments',
      itemsCount: Math.max(1, Number(itemsCount) || 1),
      totalAmount: Math.max(0, Number(totalAmount) || 0),
      status: 'Pending',
      orderDate: new Date().toISOString().slice(0, 10),
      notes,
    });
    setSheetOpen(false);
  };

  const handleConvertToInvoice = (order: SalesOrder) => {
    setPendingOrderForInvoice(order);
    setActiveModule('sales-invoice');
  };

  const filtered = salesOrders.filter(
    (o) => statusFilter === 'All' || o.status === statusFilter
  );

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Sales Orders & Bookings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track customer pre-orders and convert confirmed orders into Sales Invoices
          </p>
        </div>
        <button
          onClick={openNewOrder}
          className="min-h-[46px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Sales Order</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['All', 'Pending', 'Confirmed', 'Invoiced', 'Cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              statusFilter === st
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <ClipboardList className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-900">No Sales Orders Found</p>
          <button
            onClick={openNewOrder}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Create First Sales Order
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-slate-900">
                      {order.orderNumber}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {order.customerName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{order.itemsSummary}</p>
                  {order.notes && (
                    <p className="text-[11px] text-slate-400 mt-1">Note: {order.notes}</p>
                  )}
                </div>

                <div className="text-right font-mono tabular-nums shrink-0">
                  <p className="text-base font-bold text-slate-900">
                    {formatBDT(order.totalAmount, sym)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {order.itemsCount} pcs · {order.orderDate}
                  </p>
                  <p
                    className={`text-xs font-semibold mt-0.5 ${
                      order.status === 'Invoiced'
                        ? 'text-emerald-600'
                        : order.status === 'Confirmed'
                        ? 'text-blue-600'
                        : order.status === 'Cancelled'
                        ? 'text-red-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {order.status}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {order.status === 'Pending' && (
                    <button
                      onClick={() => updateSalesOrderStatus(order.id, 'Confirmed')}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
                    >
                      Confirm Order
                    </button>
                  )}
                  {(order.status === 'Pending' || order.status === 'Confirmed') && (
                    <button
                      onClick={() => handleConvertToInvoice(order)}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span>Convert to Sales Invoice</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {(order.status === 'Pending' || order.status === 'Confirmed') && (
                    <button
                      onClick={() => updateSalesOrderStatus(order.id, 'Cancelled')}
                      className="min-h-[40px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-red-600"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => deleteSalesOrder(order.id)}
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

      {/* New Sales Order Bottom Sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleCreateOrder}
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          >
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Create Sales Order</h3>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Customer
                </label>
                <select
                  value={customerId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setCustomerId(id);
                    const c = customers.find((x) => x.id === id);
                    setCustomerName(c ? c.name : 'Walk-in Customer');
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm bg-white"
                >
                  <option value="WALK_IN">Walk-in Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Garment Selector */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <p className="text-xs font-semibold text-slate-700">
                  Add Garment to Order Summary
                </p>
                <div className="flex gap-2">
                  <select
                    value={selectedProdId}
                    onChange={(e) => setSelectedProdId(e.target.value)}
                    className="flex-1 min-h-[42px] px-3 py-1.5 rounded-xl border border-slate-200 text-base sm:text-xs bg-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.size}) — {sym}
                        {p.sellingPrice}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={orderQty}
                    onChange={(e) => setOrderQty(e.target.value)}
                    className="w-20 min-h-[42px] px-2.5 py-1.5 rounded-xl border border-slate-200 text-base sm:text-xs font-mono text-center bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddItemToSummary}
                    className="min-h-[42px] px-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shrink-0"
                  >
                    + Append
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Order Items Summary *
                </label>
                <textarea
                  rows={2}
                  required
                  value={itemsSummary}
                  onChange={(e) => setItemsSummary(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Quantity (pcs) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={itemsCount}
                    onChange={(e) => setItemsCount(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Order Total ({sym}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery / Pickup Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Deliver by Thursday via courier"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm"
                />
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
                Save Sales Order
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   3. SALES -> SALES INVOICE VIEW (Mobile POS Builder + Invoice Ledger)
   ============================================================================ */
export function SalesInvoiceView() {
  const {
    products,
    allCategories,
    customers,
    salesInvoices,
    returns,
    storeSettings,
    showToast,
    createSalesInvoice,
    settleSalesInvoiceDue,
    deleteSalesInvoice,
    setPrintableReceipt,
    pendingOrderForInvoice,
    setPendingOrderForInvoice,
    pendingReturnInvoice,
    setPendingReturnInvoice,
    pendingCartProducts,
    clearPendingCartProducts,
    openReturnForInvoice,
    processReturnExchange,
  } = useErp();

  const [posCatFilter, setPosCatFilter] = useState<string>('All');
  const [posSearch, setPosSearch] = useState('');
  const [customerId, setCustomerId] = useState(
    () => pendingOrderForInvoice?.customerId || 'WALK_IN'
  );
  const [customerName, setCustomerName] = useState(
    () => pendingOrderForInvoice?.customerName || 'Walk-in Customer'
  );
  const [customerPhone, setCustomerPhone] = useState(() => {
    if (pendingOrderForInvoice) {
      const found = customers.find((c) => c.id === pendingOrderForInvoice.customerId);
      return found?.phone || '';
    }
    return '';
  });
  const [cart, setCart] = useState<CartLineItem[]>([]);
  const [discount, setDiscount] = useState('0');
  const [paidAmount, setPaidAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [submitting, setSubmitting] = useState(false);

  const [settleTarget, setSettleTarget] = useState<SalesInvoice | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('Cash');

  // Integrated History Tabs
  const [historyTab, setHistoryTab] = useState<'INVOICES' | 'RETURNS'>('INVOICES');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'ALL' | 'Paid' | 'Partial' | 'Due'>('ALL');
  const [invoicePage, setInvoicePage] = useState(1);
  const invoicePageSize = 8;

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnsSearch, setReturnsSearch] = useState('');
  const [returnsFilterType, setReturnsFilterType] = useState<'ALL' | 'RETURN_REFUND' | 'EXCHANGE'>('ALL');
  const [returnsPage, setReturnsPage] = useState(1);
  const returnsPageSize = 8;

  // Return Form States
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [retOriginalInvoiceNumber, setRetOriginalInvoiceNumber] = useState('');
  const [retCustomerId, setRetCustomerId] = useState('');
  const [retCustomerName, setRetCustomerName] = useState('');
  const [retCustomerPhone, setRetCustomerPhone] = useState('');
  const [retType, setRetType] = useState<ReturnType>('RETURN_REFUND');

  const [returnedProductId, setReturnedProductId] = useState('');
  const [returnedQty, setReturnedQty] = useState('1');
  const [refundAmount, setRefundAmount] = useState('0');
  const [refundMethod, setRefundMethod] = useState<string>('Cash');

  const [isSameGarmentSwap, setIsSameGarmentSwap] = useState(false);
  const [exchangeProductId, setExchangeProductId] = useState('');
  const [exchangeQty, setExchangeQty] = useState('1');
  const [exchangeExtraCharge, setExchangeExtraCharge] = useState('0');
  const [extraChargeMethod, setExtraChargeMethod] = useState<PaymentMethod>('Cash');

  const [retReason, setRetReason] = useState('Wrong Size / Fit');
  const [retReasonNote, setRetReasonNote] = useState('');
  const [processingReturn, setProcessingReturn] = useState(false);
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);

  const sym = storeSettings.currencySymbol || '৳';

  const populateReturnFromInvoice = (inv: SalesInvoice) => {
    setSelectedInvoiceId(inv.id);
    setRetOriginalInvoiceNumber(inv.invoiceNumber);
    setRetCustomerId(inv.customerId || '');
    setRetCustomerName(inv.customerName || 'Walk-in Customer');
    setRetCustomerPhone(inv.customerPhone || '');

    const matchProd = products.find(
      (p) =>
        inv.itemsSummary.toLowerCase().includes(p.name.toLowerCase()) ||
        p.category.toLowerCase() === inv.primaryCategory.toLowerCase()
    );
    if (matchProd) {
      setReturnedProductId(matchProd.id);
      setRefundAmount(String(matchProd.sellingPrice));
    } else if (products.length > 0) {
      setReturnedProductId(products[0].id);
      setRefundAmount(String(products[0].sellingPrice));
    }
  };

  useEffect(() => {
    if (!pendingReturnInvoice) return;
    const timer = setTimeout(() => {
      populateReturnFromInvoice(pendingReturnInvoice);
      setReturnModalOpen(true);
      setPendingReturnInvoice(null);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingReturnInvoice]);

  useEffect(() => {
    if (pendingCartProducts.length > 0) {
      setCart((prevCart) => {
        let updated = [...prevCart];
        pendingCartProducts.forEach((p) => {
          const currentProd = products.find((x) => x.id === p.id) || p;
          if (currentProd.stock <= 0) {
            showToast(`Out of stock: ${currentProd.name} has 0 pcs`, 'error');
            return;
          }
          const existing = updated.find((item) => item.productId === p.id);
          if (existing) {
            if (existing.quantity >= currentProd.stock) {
              showToast(
                `Stock limit reached: Only ${currentProd.stock} pcs available for ${currentProd.name}`,
                'error'
              );
            } else {
              updated = updated.map((item) =>
                item.productId === p.id
                  ? { ...item, quantity: Math.min(currentProd.stock, item.quantity + 1) }
                  : item
              );
            }
          } else {
            updated.push({
              productId: currentProd.id,
              name: currentProd.name,
              sku: currentProd.sku,
              category: currentProd.category,
              size: currentProd.size,
              color: currentProd.color,
              unitPrice: currentProd.sellingPrice,
              unitCost: currentProd.purchasePrice,
              quantity: 1,
            });
          }
        });
        syncPaidWithCart(updated, discount);
        return updated;
      });
      clearPendingCartProducts();
    }
  }, [pendingCartProducts, clearPendingCartProducts, discount, products, showToast]);

  const resetReturnForm = () => {
    setSelectedInvoiceId('');
    setRetOriginalInvoiceNumber('');
    setRetCustomerId('');
    setRetCustomerName('');
    setRetCustomerPhone('');
    setRetType('RETURN_REFUND');
    setReturnedProductId('');
    setReturnedQty('1');
    setRefundAmount('0');
    setRefundMethod('Cash');
    setIsSameGarmentSwap(false);
    setExchangeProductId('');
    setExchangeQty('1');
    setExchangeExtraCharge('0');
    setRetReason('Wrong Size / Fit');
    setRetReasonNote('');
  };

  const recomputeExchangeDiff = (
    retId: string,
    retQ: string,
    exId: string,
    exQ: string
  ) => {
    const retProd = products.find((p) => p.id === retId);
    const exProd = products.find((p) => p.id === exId);
    if (retProd && exProd) {
      const retTotal = retProd.sellingPrice * (Number(retQ) || 1);
      const exTotal = exProd.sellingPrice * (Number(exQ) || 1);
      const diff = exTotal - retTotal;
      if (diff > 0) {
        setExchangeExtraCharge(String(diff));
        setRefundAmount('0');
      } else if (diff < 0) {
        setExchangeExtraCharge('0');
        setRefundAmount(String(Math.abs(diff)));
      } else {
        setExchangeExtraCharge('0');
        setRefundAmount('0');
      }
    }
  };

  const handleReturnedProductChange = (prodId: string) => {
    setReturnedProductId(prodId);
    const p = products.find((x) => x.id === prodId);
    if (p) {
      const q = Math.max(1, Number(returnedQty) || 1);
      if (retType === 'RETURN_REFUND') {
        setRefundAmount(String(p.sellingPrice * q));
      }

      let nextExId = exchangeProductId;
      if (isSameGarmentSwap) {
        const altVariant = products.find((x) => x.id !== p.id && x.name === p.name);
        if (altVariant) {
          nextExId = altVariant.id;
          setExchangeProductId(altVariant.id);
        }
      }
      if (retType === 'EXCHANGE') {
        recomputeExchangeDiff(prodId, returnedQty, nextExId, exchangeQty);
      }
    }
  };

  const handleReturnedQtyChange = (val: string) => {
    setReturnedQty(val);
    const q = Math.max(1, Number(val) || 1);
    const p = products.find((x) => x.id === returnedProductId);
    if (p && retType === 'RETURN_REFUND') {
      setRefundAmount(String(p.sellingPrice * q));
    }
    if (retType === 'EXCHANGE') {
      recomputeExchangeDiff(returnedProductId, val, exchangeProductId, exchangeQty);
    }
  };

  const handleExchangeProductChange = (prodId: string) => {
    setExchangeProductId(prodId);
    recomputeExchangeDiff(returnedProductId, returnedQty, prodId, exchangeQty);
  };

  const handleExchangeQtyChange = (val: string) => {
    setExchangeQty(val);
    recomputeExchangeDiff(returnedProductId, returnedQty, exchangeProductId, val);
  };

  const handleRetTypeChange = (nextType: ReturnType) => {
    setRetType(nextType);
    if (nextType === 'EXCHANGE') {
      recomputeExchangeDiff(returnedProductId, returnedQty, exchangeProductId, exchangeQty);
    } else {
      const p = products.find((x) => x.id === returnedProductId);
      if (p) {
        setRefundAmount(String(p.sellingPrice * (Number(returnedQty) || 1)));
      }
    }
  };

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnedProductId) {
      alert('Please select the item being returned.');
      return;
    }
    if (retType === 'EXCHANGE' && !exchangeProductId) {
      alert('Please select the replacement exchange item.');
      return;
    }

    setProcessingReturn(true);
    try {
      const retProd = products.find((p) => p.id === returnedProductId);
      const exProd = products.find((p) => p.id === exchangeProductId);
      const fullReason = retReasonNote.trim() ? `${retReason} (${retReasonNote.trim()})` : retReason;

      const finalRefundMethod =
        retType === 'EXCHANGE' && Number(exchangeExtraCharge) > 0
          ? extraChargeMethod
          : refundMethod;

      const matchedCust = customers.find(
        (c) => c.id === retCustomerId || (c.name && c.name.toLowerCase() === retCustomerName.toLowerCase())
      );

      await processReturnExchange({
        originalInvoiceNumber: retOriginalInvoiceNumber.trim() || 'INV-DIRECT',
        customerId: matchedCust?.id || undefined,
        customerName: retCustomerName.trim() || 'Walk-in Customer',
        customerPhone: retCustomerPhone.trim() || 'N/A',
        type: retType,
        returnedItemSummary: retProd
          ? `${retProd.name} (${retProd.category}) [${retProd.size}, ${retProd.color}]`
          : 'Returned Item',
        returnedQty: Math.max(1, Number(returnedQty) || 1),
        refundAmount: Math.max(0, Number(refundAmount) || 0),
        refundMethod: finalRefundMethod,
        exchangeItemSummary:
          retType === 'EXCHANGE' && exProd
            ? `${exProd.name} (${exProd.category}) [${exProd.size}, ${exProd.color}]`
            : undefined,
        exchangeQty: retType === 'EXCHANGE' ? Math.max(1, Number(exchangeQty) || 1) : 0,
        exchangeExtraCharge: retType === 'EXCHANGE' ? Math.max(0, Number(exchangeExtraCharge) || 0) : 0,
        reason: fullReason,
        returnedProductId: returnedProductId || undefined,
        returnedReturnStockQty: Math.max(1, Number(returnedQty) || 1),
        exchangeProductId: retType === 'EXCHANGE' ? exchangeProductId || undefined : undefined,
        exchangeDeductStockQty: retType === 'EXCHANGE' ? Math.max(1, Number(exchangeQty) || 1) : 0,
      });

      setReturnModalOpen(false);
      resetReturnForm();
    } finally {
      setProcessingReturn(false);
    }
  };

  const subtotal = cart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const numDiscount = Math.min(subtotal, Math.max(0, Number(discount) || 0));
  const grandTotal = Math.max(0, subtotal - numDiscount);
  const numPaid = Math.min(grandTotal, Math.max(0, Number(paidAmount) || 0));
  const dueAmount = Math.max(0, grandTotal - numPaid);

  const syncPaidWithCart = (nextCart: CartLineItem[], nextDiscountStr: string) => {
    const nextSub = nextCart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    const nextDisc = Math.min(nextSub, Math.max(0, Number(nextDiscountStr) || 0));
    setPaidAmount(String(Math.max(0, nextSub - nextDisc)));
  };

  const addToCart = (prodId: string) => {
    const p = products.find((x) => x.id === prodId);
    if (!p) return;
    if (p.stock <= 0) {
      showToast(`Out of stock: ${p.name} has 0 pcs in stock`, 'error');
      return;
    }
    const existing = cart.find((item) => item.productId === p.id);
    if (existing && existing.quantity >= p.stock) {
      showToast(
        `Cannot add more: Only ${p.stock} pcs available in stock for ${p.name}`,
        'error'
      );
      return;
    }
    const nextCart = existing
      ? cart.map((item) =>
          item.productId === p.id
            ? { ...item, quantity: Math.min(p.stock, item.quantity + 1) }
            : item
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
            quantity: 1,
          },
        ];
    setCart(nextCart);
    syncPaidWithCart(nextCart, discount);
  };

  const updateCartQty = (productId: string, delta: number) => {
    const p = products.find((x) => x.id === productId);
    if (delta > 0 && p) {
      const existing = cart.find((item) => item.productId === productId);
      if (existing && existing.quantity >= p.stock) {
        showToast(
          `Stock limit reached: Only ${p.stock} pcs available in stock for ${p.name}`,
          'error'
        );
        return;
      }
    }
    const nextCart = cart
      .map((item) => {
        if (item.productId !== productId) return item;
        const maxLimit = p ? p.stock : 9999;
        const next = Math.min(maxLimit, item.quantity + delta);
        return next > 0 ? { ...item, quantity: next } : null;
      })
      .filter(Boolean) as CartLineItem[];
    setCart(nextCart);
    syncPaidWithCart(nextCart, discount);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Strict validation: check that no line item exceeds current inventory stock
    for (const item of cart) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) continue;
      if (item.quantity > prod.stock) {
        showToast(
          `Cannot invoice ${item.name}: ${item.quantity} requested, but only ${prod.stock} pcs in stock!`,
          'error'
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      await createSalesInvoice({
        customerId,
        customerName,
        customerPhone,
        cartItems: cart,
        discount: numDiscount,
        paidAmount: numPaid,
        paymentMethod,
        invoiceDate: new Date().toISOString().slice(0, 10),
        linkedOrderId: pendingOrderForInvoice?.id,
      });
      setCart([]);
      setDiscount('0');
      setPendingOrderForInvoice(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettleDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleTarget) return;
    await settleSalesInvoiceDue(settleTarget, Number(settleAmount) || 0, settleMethod);
    setSettleTarget(null);
  };

  const availableProducts = products.filter((p) => {
    const matchesCat = posCatFilter === 'All' || p.category === posCatFilter;
    const q = posSearch.trim().toLowerCase();
    const matchesQ =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.size.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  const retProd = products.find((p) => p.id === returnedProductId);
  const exProd = products.find((p) => p.id === exchangeProductId);

  const filteredInvoices = salesInvoices.filter((inv) => {
    const matchesStatus =
      invoiceStatusFilter === 'ALL' || inv.status === invoiceStatusFilter;
    const q = invoiceSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      (inv.customerPhone && inv.customerPhone.toLowerCase().includes(q)) ||
      inv.itemsSummary.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalInvoicePages = Math.max(1, Math.ceil(filteredInvoices.length / invoicePageSize));
  const pagedInvoices = filteredInvoices.slice(
    (invoicePage - 1) * invoicePageSize,
    invoicePage * invoicePageSize
  );

  const filteredReturns = returns.filter((r) => {
    const matchesFilter =
      returnsFilterType === 'ALL' || r.type === returnsFilterType;
    const q = returnsSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.returnNumber.toLowerCase().includes(q) ||
      r.originalInvoiceNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      (r.customerPhone && r.customerPhone.toLowerCase().includes(q)) ||
      r.returnedItemSummary.toLowerCase().includes(q) ||
      (r.exchangeItemSummary && r.exchangeItemSummary.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const totalReturnPages = Math.max(1, Math.ceil(filteredReturns.length / returnsPageSize));
  const pagedReturns = filteredReturns.slice(
    (returnsPage - 1) * returnsPageSize,
    returnsPage * returnsPageSize
  );

  return (
    <div className="space-y-6">
      {pendingOrderForInvoice && (
        <div className="bg-blue-950 text-white rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="text-xs">
            <p className="font-bold">
              Converting Sales Order {pendingOrderForInvoice.orderNumber} for{' '}
              {pendingOrderForInvoice.customerName}
            </p>
            <p className="text-blue-200 mt-0.5">{pendingOrderForInvoice.itemsSummary}</p>
          </div>
          <button
            onClick={() => setPendingOrderForInvoice(null)}
            className="px-3 py-1.5 rounded-lg bg-blue-900 text-xs font-semibold"
          >
            Clear
          </button>
        </div>
      )}

      {/* Interactive Mobile & Desktop POS Split Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Product Tap Picker (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              1. Tap Garments to Add to Bill
            </h2>
            <p className="text-xs text-slate-500">
              Filter by the 9 apparel categories and tap any item to add to cart
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <select
              value={posCatFilter}
              onChange={(e) => setPosCatFilter(e.target.value)}
              className="w-full min-h-[42px] px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs font-semibold text-slate-800"
            >
              <option value="All">All Categories ({products.length})</option>
              {allCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  placeholder="Quick search SKU, name, or size..."
                  className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => setCameraScannerOpen(true)}
                className="min-h-[44px] px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shrink-0 transition-transform"
                title="Scan Garment QR or Barcode with Mobile Camera"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Scan QR</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {availableProducts.map((p) => {
              const inCart = cart.find((c) => c.productId === p.id)?.quantity || 0;
              const isMaxStock = inCart >= p.stock;
              return (
                <button
                  type="button"
                  key={p.id}
                  disabled={p.stock <= 0 || isMaxStock}
                  onClick={() => addToCart(p.id)}
                  className={`min-h-[68px] p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                    p.stock <= 0
                      ? 'border-slate-200 bg-slate-50 opacity-40 cursor-not-allowed'
                      : isMaxStock
                      ? 'border-amber-300 bg-amber-50/50 opacity-60 cursor-not-allowed'
                      : inCart > 0
                      ? 'border-blue-600 bg-blue-50/40'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                  title={
                    p.stock <= 0
                      ? 'Out of stock'
                      : isMaxStock
                      ? `Maximum ${p.stock} pcs already in bill`
                      : 'Add to bill'
                  }
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {p.category} · Size {p.size} · Stock:{' '}
                      <span className={`font-semibold ${p.stock <= 0 ? 'text-red-500' : 'text-slate-700'}`}>
                        {p.stock} pcs
                      </span>
                    </p>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <p className="text-xs font-bold text-slate-900">
                      {formatBDT(p.sellingPrice, sym)}
                    </p>
                    {p.stock <= 0 ? (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        Out of stock
                      </span>
                    ) : isMaxStock ? (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        Max ({p.stock})
                      </span>
                    ) : inCart > 0 ? (
                      <span className="text-[11px] font-bold text-blue-600">
                        +{inCart} in bill
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Invoice Checkout & Payment Calculator (5 cols) */}
        <form
          onSubmit={handleCheckout}
          className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900">
            2. Customer & Payment Checkout
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Account
              </label>
              <select
                value={customerId}
                onChange={(e) => {
                  const id = e.target.value;
                  setCustomerId(id);
                  if (id === 'WALK_IN') {
                    setCustomerName('Walk-in Customer');
                    setCustomerPhone('');
                  } else {
                    const c = customers.find((x) => x.id === id);
                    if (c) {
                      setCustomerName(c.name);
                      setCustomerPhone(c.phone);
                    }
                  }
                }}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 text-base sm:text-xs bg-white"
              >
                <option value="WALK_IN">Walk-in Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name on Bill
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 text-base sm:text-xs"
              />
            </div>
          </div>

          {/* Selected Cart Items */}
          <div className="border-t border-b border-slate-100 py-3 space-y-2 max-h-56 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                Tap any garment item on the left to add it to this invoice.
              </p>
            ) : (
              cart.map((item) => {
                const prod = products.find((x) => x.id === item.productId);
                const isMax = prod ? item.quantity >= prod.stock : false;
                return (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono tabular-nums flex items-center gap-1.5 flex-wrap">
                        <span>Size {item.size}</span>
                        <span>·</span>
                        <span>{formatBDT(item.unitPrice, sym)} each</span>
                        {prod && (
                          <span
                            className={`text-[10px] font-sans px-1.5 py-0.2 rounded ${
                              isMax
                                ? 'bg-amber-100 text-amber-800 font-semibold'
                                : 'bg-slate-200/60 text-slate-600'
                            }`}
                          >
                            {isMax ? `Max ${prod.stock} pcs in stock` : `Stock: ${prod.stock}`}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.productId, -1)}
                        className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-100"
                        title="Reduce 1"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={isMax}
                        onClick={() => updateCartQty(item.productId, 1)}
                        className={`w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center ${
                          isMax
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-40'
                            : 'bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                        title={isMax ? `Only ${prod?.stock} pcs in stock` : 'Add 1'}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pricing & Payment Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discount ({sym})
              </label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 text-base sm:text-xs font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paid Amount ({sym})
              </label>
              <input
                type="number"
                min="0"
                max={grandTotal}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 text-base sm:text-xs font-mono tabular-nums"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
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

          {/* Summary Box */}
          <div className="bg-slate-900 text-white p-4 rounded-xl space-y-1.5 text-xs font-mono tabular-nums">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>{formatBDT(subtotal, sym)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Discount</span>
              <span>-{formatBDT(numDiscount, sym)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-1 border-t border-slate-800">
              <span>Grand Total</span>
              <span>{formatBDT(grandTotal, sym)}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Paid ({paymentMethod})</span>
              <span>{formatBDT(numPaid, sym)}</span>
            </div>
            <div className="flex justify-between text-amber-400 font-bold">
              <span>Balance Due</span>
              <span>{formatBDT(dueAmount, sym)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={cart.length === 0 || submitting}
            className="w-full min-h-[48px] rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>
              {submitting ? 'Generating Invoice...' : 'Complete Sale & Print Invoice'}
            </span>
          </button>
        </form>
      </div>

      {/* Sales Invoices History Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Sales Invoices History ({filteredInvoices.length})
            </h3>
            <p className="text-xs text-slate-500">
              Tap Receipt to print or Collect Due on partial/unpaid bills
            </p>
          </div>

          {/* Quick Search & Status Filter (Mobile-first full width) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search invoice, customer, item..."
                value={invoiceSearch}
                onChange={(e) => {
                  setInvoiceSearch(e.target.value);
                  setInvoicePage(1);
                }}
                className="w-full min-h-[40px] pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 transition-colors"
              />
              {invoiceSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceSearch('');
                    setInvoicePage(1);
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
                    setInvoiceStatusFilter(st);
                    setInvoicePage(1);
                  }}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    invoiceStatusFilter === st
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {pagedInvoices.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No sales invoices match your filter
          </div>
        ) : (
          <div className="space-y-3">
            {pagedInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:border-slate-300 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-bold text-slate-900 text-sm truncate">
                      {inv.customerName}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono text-slate-500">{inv.invoiceDate}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                  <p className="text-xs text-slate-600 mt-1 line-clamp-1">{inv.itemsSummary}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums mt-1.5">
                    <span className="text-slate-700">
                      Total: <strong>{formatBDT(inv.grandTotal, sym)}</strong>
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-emerald-700 font-semibold">
                      Paid: {formatBDT(inv.paidAmount, sym)} ({inv.paymentMethod})
                    </span>
                    {inv.dueAmount > 0 && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-red-600 font-bold">
                          Due: {formatBDT(inv.dueAmount, sym)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-end sm:self-center">
                  {inv.dueAmount > 0 && inv.status !== 'Paid' && (
                    <button
                      onClick={() => {
                        setSettleTarget(inv);
                        setSettleAmount(String(inv.dueAmount));
                      }}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-semibold shadow-xs"
                    >
                      Collect Due
                    </button>
                  )}
                  <button
                    onClick={() => openReturnForInvoice(inv)}
                    className="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-xs font-semibold text-purple-700 flex items-center gap-1 hover:bg-purple-100 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Return</span>
                  </button>
                  <button
                    onClick={() =>
                      setPrintableReceipt({
                        type: 'SALES',
                        invoiceNumber: inv.invoiceNumber,
                        date: inv.invoiceDate,
                        partyName: inv.customerName,
                        partyPhone: inv.customerPhone,
                        itemsSummary: inv.itemsSummary,
                        itemsCount: inv.itemsCount,
                        subtotal: inv.subtotal,
                        discount: inv.discount,
                        grandTotal: inv.grandTotal,
                        paidAmount: inv.paidAmount,
                        dueAmount: inv.dueAmount,
                        paymentMethod: inv.paymentMethod,
                        status: inv.status,
                      })
                    }
                    className="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1 hover:bg-slate-50 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>
                  <button
                    onClick={() => deleteSalesInvoice(inv.id)}
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
        {totalInvoicePages > 1 && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 font-mono">
              Page {invoicePage} of {totalInvoicePages} ({filteredInvoices.length} invoices)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={invoicePage <= 1}
                onClick={() => setInvoicePage((p) => Math.max(1, p - 1))}
                className="min-h-[38px] min-w-[38px] px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>
              <div className="px-2 font-mono font-bold text-slate-800">
                {invoicePage} / {totalInvoicePages}
              </div>
              <button
                type="button"
                disabled={invoicePage >= totalInvoicePages}
                onClick={() => setInvoicePage((p) => Math.min(totalInvoicePages, p + 1))}
                className="min-h-[38px] min-w-[38px] px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 flex items-center justify-center gap-1"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settle Sales Invoice Due Modal */}
      {settleTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleSettleDue}
            className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                Settle Invoice {settleTarget.invoiceNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {settleTarget.customerName} · Unpaid Due:{' '}
                {formatBDT(settleTarget.dueAmount, sym)}
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Collected ({sym}) *
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
                Save Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Camera Barcode/QR Scanner for POS Billing */}
      <QrCameraScannerModal
        isOpen={cameraScannerOpen}
        onClose={() => setCameraScannerOpen(false)}
        onScanItem={(product) => addToCart(product.id)}
        continuousMode={true}
        title="POS Garment Tag Scanner"
        subtitle="Point camera at clothing barcode/QR sticker to add to cart"
      />
    </div>
  );
}

/* ============================================================================
   4. SALES -> RETURNS & EXCHANGE VIEW (Comprehensive & Flexible)
   ============================================================================ */
export function ReturnsView() {
  const {
    returns,
    products,
    customers,
    salesInvoices,
    storeSettings,
    pendingReturnInvoice,
    setPendingReturnInvoice,
    openReturnForInvoice,
    processReturnExchange,
    setPrintableReceipt,
  } = useErp();

  const sym = storeSettings.currencySymbol || '৳';

  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'RETURN_REFUND' | 'EXCHANGE'>('ALL');

  // Form states
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [originalInvoiceNumber, setOriginalInvoiceNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [type, setType] = useState<ReturnType>('RETURN_REFUND');

  // Returned Item
  const [returnedProductId, setReturnedProductId] = useState('');
  const [returnedQty, setReturnedQty] = useState('1');
  const [refundAmount, setRefundAmount] = useState('0');
  const [refundMethod, setRefundMethod] = useState<string>('Cash');

  // Exchange Item
  const [isSameGarmentSwap, setIsSameGarmentSwap] = useState(false);
  const [exchangeProductId, setExchangeProductId] = useState('');
  const [exchangeQty, setExchangeQty] = useState('1');
  const [exchangeExtraCharge, setExchangeExtraCharge] = useState('0');
  const [extraChargeMethod, setExtraChargeMethod] = useState<PaymentMethod>('Cash');

  // Reason & Note
  const [reason, setReason] = useState('Wrong Size / Fit');
  const [reasonNote, setReasonNote] = useState('');
  const [processing, setProcessing] = useState(false);

  // Auto-fill from invoice helper
  const populateFromInvoice = (inv: SalesInvoice) => {
    setSelectedInvoiceId(inv.id);
    setOriginalInvoiceNumber(inv.invoiceNumber);
    setCustomerId(inv.customerId || '');
    setCustomerName(inv.customerName || 'Walk-in Customer');
    setCustomerPhone(inv.customerPhone || '');

    // Attempt smart matching with inventory products
    const matchProd = products.find(
      (p) =>
        inv.itemsSummary.toLowerCase().includes(p.name.toLowerCase()) ||
        p.category.toLowerCase() === inv.primaryCategory.toLowerCase()
    );
    if (matchProd) {
      setReturnedProductId(matchProd.id);
      setRefundAmount(String(matchProd.sellingPrice));
    } else if (products.length > 0) {
      setReturnedProductId(products[0].id);
      setRefundAmount(String(products[0].sellingPrice));
    }
  };

  // Watch for invoice passed from SalesInvoiceView or CustomerLedgerModal
  useEffect(() => {
    if (!pendingReturnInvoice) return;
    const timer = setTimeout(() => {
      populateFromInvoice(pendingReturnInvoice);
      setModalOpen(true);
      setPendingReturnInvoice(null);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingReturnInvoice]);

  // Handle invoice dropdown selection inside modal
  const handleSelectInvoiceDropdown = (invId: string) => {
    if (!invId) {
      setSelectedInvoiceId('');
      setOriginalInvoiceNumber('');
      setCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      return;
    }
    const found = salesInvoices.find((i) => i.id === invId);
    if (found) {
      populateFromInvoice(found);
    }
  };

  const recomputeExchangeDiff = (
    retId: string,
    retQ: string,
    exId: string,
    exQ: string
  ) => {
    const retProd = products.find((p) => p.id === retId);
    const exProd = products.find((p) => p.id === exId);
    if (retProd && exProd) {
      const retTotal = retProd.sellingPrice * (Number(retQ) || 1);
      const exTotal = exProd.sellingPrice * (Number(exQ) || 1);
      const diff = exTotal - retTotal;
      if (diff > 0) {
        setExchangeExtraCharge(String(diff));
        setRefundAmount('0');
      } else if (diff < 0) {
        setExchangeExtraCharge('0');
        setRefundAmount(String(Math.abs(diff)));
      } else {
        setExchangeExtraCharge('0');
        setRefundAmount('0');
      }
    }
  };

  // When returned product or quantity changes, recalculate suggested refund
  const handleReturnedProductChange = (prodId: string) => {
    setReturnedProductId(prodId);
    const p = products.find((x) => x.id === prodId);
    if (p) {
      const q = Math.max(1, Number(returnedQty) || 1);
      if (type === 'RETURN_REFUND') {
        setRefundAmount(String(p.sellingPrice * q));
      }

      let nextExId = exchangeProductId;
      if (isSameGarmentSwap) {
        const altVariant = products.find((x) => x.id !== p.id && x.name === p.name);
        if (altVariant) {
          nextExId = altVariant.id;
          setExchangeProductId(altVariant.id);
        }
      }
      if (type === 'EXCHANGE') {
        recomputeExchangeDiff(prodId, returnedQty, nextExId, exchangeQty);
      }
    }
  };

  const handleReturnedQtyChange = (val: string) => {
    setReturnedQty(val);
    const q = Math.max(1, Number(val) || 1);
    const p = products.find((x) => x.id === returnedProductId);
    if (p && type === 'RETURN_REFUND') {
      setRefundAmount(String(p.sellingPrice * q));
    }
    if (type === 'EXCHANGE') {
      recomputeExchangeDiff(returnedProductId, val, exchangeProductId, exchangeQty);
    }
  };

  const handleExchangeProductChange = (prodId: string) => {
    setExchangeProductId(prodId);
    recomputeExchangeDiff(returnedProductId, returnedQty, prodId, exchangeQty);
  };

  const handleExchangeQtyChange = (val: string) => {
    setExchangeQty(val);
    recomputeExchangeDiff(returnedProductId, returnedQty, exchangeProductId, val);
  };

  const handleTypeChange = (nextType: ReturnType) => {
    setType(nextType);
    if (nextType === 'EXCHANGE') {
      recomputeExchangeDiff(returnedProductId, returnedQty, exchangeProductId, exchangeQty);
    } else {
      const p = products.find((x) => x.id === returnedProductId);
      if (p) {
        setRefundAmount(String(p.sellingPrice * (Number(returnedQty) || 1)));
      }
    }
  };

  // Selected customer data (for checking due)
  const matchedCustomer = customers.find(
    (c) => c.id === customerId || (c.name && c.name.toLowerCase() === customerName.toLowerCase())
  );

  const resetForm = () => {
    setSelectedInvoiceId('');
    setOriginalInvoiceNumber('');
    setCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setType('RETURN_REFUND');
    setReturnedProductId('');
    setReturnedQty('1');
    setRefundAmount('0');
    setRefundMethod('Cash');
    setIsSameGarmentSwap(false);
    setExchangeProductId('');
    setExchangeQty('1');
    setExchangeExtraCharge('0');
    setReason('Wrong Size / Fit');
    setReasonNote('');
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnedProductId) {
      alert('Please select the item being returned.');
      return;
    }
    if (type === 'EXCHANGE' && !exchangeProductId) {
      alert('Please select the replacement exchange item.');
      return;
    }

    setProcessing(true);
    try {
      const retProd = products.find((p) => p.id === returnedProductId);
      const exProd = products.find((p) => p.id === exchangeProductId);
      const fullReason = reasonNote.trim() ? `${reason} (${reasonNote.trim()})` : reason;

      const finalRefundMethod =
        type === 'EXCHANGE' && Number(exchangeExtraCharge) > 0
          ? extraChargeMethod
          : refundMethod;

      await processReturnExchange({
        originalInvoiceNumber: originalInvoiceNumber.trim() || 'INV-DIRECT',
        customerId: matchedCustomer?.id || undefined,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || 'N/A',
        type,
        returnedItemSummary: retProd
          ? `${retProd.name} (${retProd.category}) [${retProd.size}, ${retProd.color}]`
          : 'Returned Item',
        returnedQty: Math.max(1, Number(returnedQty) || 1),
        refundAmount: Math.max(0, Number(refundAmount) || 0),
        refundMethod: finalRefundMethod,
        exchangeItemSummary:
          type === 'EXCHANGE' && exProd
            ? `${exProd.name} (${exProd.category}) [${exProd.size}, ${exProd.color}]`
            : undefined,
        exchangeQty: type === 'EXCHANGE' ? Math.max(1, Number(exchangeQty) || 1) : 0,
        exchangeExtraCharge: type === 'EXCHANGE' ? Math.max(0, Number(exchangeExtraCharge) || 0) : 0,
        reason: fullReason,
        returnedProductId: returnedProductId || undefined,
        returnedReturnStockQty: Math.max(1, Number(returnedQty) || 1),
        exchangeProductId: type === 'EXCHANGE' ? exchangeProductId || undefined : undefined,
        exchangeDeductStockQty: type === 'EXCHANGE' ? Math.max(1, Number(exchangeQty) || 1) : 0,
      });

      setModalOpen(false);
      resetForm();
    } finally {
      setProcessing(false);
    }
  };

  const filtered = returns.filter((r) => {
    if (filterType === 'RETURN_REFUND' && r.type !== 'RETURN_REFUND') return false;
    if (filterType === 'EXCHANGE' && r.type !== 'EXCHANGE') return false;
    const q = search.trim().toLowerCase();
    return (
      !q ||
      r.returnNumber.toLowerCase().includes(q) ||
      r.originalInvoiceNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.customerPhone.toLowerCase().includes(q) ||
      r.returnedItemSummary.toLowerCase().includes(q)
    );
  });

  const totalRefundSum = returns
    .filter((r) => r.type === 'RETURN_REFUND')
    .reduce((acc, r) => acc + r.refundAmount, 0);

  const returnedProd = products.find((p) => p.id === returnedProductId);
  const exchangeProd = products.find((p) => p.id === exchangeProductId);

  // Filter exchange product list if same garment swap is checked
  const exchangeCandidateProducts = isSameGarmentSwap && returnedProd
    ? products.filter((p) => p.id !== returnedProd.id && p.name === returnedProd.name)
    : products;

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Returns & Exchange Management
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-semibold">
              Live Stock Restock
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            {returns.length} Total Records · Return Refunds: {formatBDT(totalRefundSum, sym)}
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="min-h-[46px] px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 shadow-sm transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>New Return / Exchange</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Return #, Invoice #, customer name, phone, item..."
            className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterType('ALL')}
            className={`min-h-[36px] px-3.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({returns.length})
          </button>
          <button
            onClick={() => setFilterType('RETURN_REFUND')}
            className={`min-h-[36px] px-3.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'RETURN_REFUND'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Refunds ({returns.filter((r) => r.type === 'RETURN_REFUND').length})
          </button>
          <button
            onClick={() => setFilterType('EXCHANGE')}
            className={`min-h-[36px] px-3.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'EXCHANGE'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Exchanges ({returns.filter((r) => r.type === 'EXCHANGE').length})
          </button>
        </div>
      </div>

      {/* Return & Exchange Records List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <RotateCcw className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-slate-900">No Return or Exchange Records Found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You can process returns directly from the Sales Invoice list or by clicking the button below.
          </p>
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-purple-600 text-white text-xs sm:text-sm font-semibold hover:bg-purple-700"
          >
            Process Return / Exchange
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-xs hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm font-mono text-slate-900">
                        {r.returnNumber}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs font-mono text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md">
                        Inv: {r.originalInvoiceNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Customer: <strong className="text-slate-900">{r.customerName}</strong>
                      {r.customerPhone && r.customerPhone !== 'N/A' && (
                        <span className="text-slate-500 font-mono"> ({r.customerPhone})</span>
                      )}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-sans ${
                      r.type === 'EXCHANGE'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {r.type === 'EXCHANGE' ? 'Exchange' : 'Return & Refund'}
                  </span>
                </div>

                <div className="mt-3 bg-slate-50 p-3 rounded-xl text-xs space-y-1.5 border border-slate-100 font-mono">
                  <div className="flex items-start gap-1.5 text-slate-800">
                    <span className="text-red-500 font-bold shrink-0">◀ Returned:</span>
                    <span>
                      {r.returnedQty}x {r.returnedItemSummary}
                    </span>
                  </div>

                  {r.type === 'EXCHANGE' && r.exchangeItemSummary && (
                    <div className="flex items-start gap-1.5 text-purple-800">
                      <span className="text-purple-600 font-bold shrink-0">▶ Exchanged:</span>
                      <span>
                        {r.exchangeQty || 1}x {r.exchangeItemSummary}
                      </span>
                    </div>
                  )}

                  <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-sans text-slate-500">
                    <span>
                      <strong>Reason:</strong> {r.reason}
                    </span>
                    <span>{r.date}</span>
                  </div>
                </div>
              </div>

              {/* Financial & Action Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="font-mono tabular-nums">
                  {r.refundAmount > 0 && (
                    <div>
                      <span className="text-slate-500">Refund: </span>
                      <strong className="text-red-600 font-bold text-sm">
                        {formatBDT(r.refundAmount, sym)}
                      </strong>
                      <span className="text-slate-500 text-[11px] ml-1">({r.refundMethod})</span>
                    </div>
                  )}
                  {r.exchangeExtraCharge && r.exchangeExtraCharge > 0 ? (
                    <div>
                      <span className="text-slate-500">Extra Paid: </span>
                      <strong className="text-emerald-600 font-bold text-sm">
                        +{formatBDT(r.exchangeExtraCharge, sym)}
                      </strong>
                    </div>
                  ) : null}
                  {r.refundAmount === 0 && (!r.exchangeExtraCharge || r.exchangeExtraCharge === 0) && (
                    <span className="text-emerald-700 font-semibold">Even Exchange (৳0)</span>
                  )}
                </div>

                {/* Print Voucher Button */}
                <button
                  onClick={() => {
                    setPrintableReceipt({
                      type: 'RETURN',
                      invoiceNumber: r.returnNumber,
                      date: r.date,
                      partyName: r.customerName,
                      partyPhone: r.customerPhone,
                      itemsSummary:
                        r.type === 'EXCHANGE'
                          ? `RETURNED: ${r.returnedQty}x ${r.returnedItemSummary} · EXCHANGED: ${r.exchangeQty || 1}x ${r.exchangeItemSummary || 'Garment Item'}`
                          : `RETURNED: ${r.returnedQty}x ${r.returnedItemSummary}`,
                      itemsCount: r.returnedQty,
                      subtotal: r.refundAmount,
                      discount: 0,
                      grandTotal: r.refundAmount,
                      paidAmount: r.refundAmount,
                      dueAmount: 0,
                      paymentMethod: r.refundMethod || 'Cash',
                      status: 'Completed',
                      returnReason: r.reason,
                      returnTypeLabel: r.type === 'EXCHANGE' ? 'Exchange Item' : 'Return & Refund',
                      originalInvoiceNumber: r.originalInvoiceNumber,
                    });
                  }}
                  className="min-h-[36px] px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comprehensive Return / Exchange Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleProcess}
            className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-purple-600" />
                  <span>Process Return or Exchange</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live inventory restock & financial balance settlement
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs sm:text-sm">
              {/* 1. Quick Past Invoice Auto-Fill Selector */}
              <div className="bg-purple-50/60 border border-purple-200/80 p-3.5 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider">
                  Select Past Invoice (Auto-Fills Details)
                </label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => handleSelectInvoiceDropdown(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-purple-200 bg-white font-sans text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="">-- Choose Recent Invoice (or type manually below) --</option>
                  {salesInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} · {inv.customerName} ({formatBDT(inv.grandTotal, sym)}) - {inv.invoiceDate}
                    </option>
                  ))}
                </select>
                {selectedInvoiceId && (
                  <p className="text-[11px] text-purple-700">
                    Auto-loaded customer details and invoice items.
                  </p>
                )}
              </div>

              {/* 2. Return Type Selector */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">Action Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('RETURN_REFUND')}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                      type === 'RETURN_REFUND'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>🔄 Return & Refund</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('EXCHANGE')}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                      type === 'EXCHANGE'
                        ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>🔁 Exchange Item</span>
                  </button>
                </div>
              </div>

              {/* 3. Customer & Invoice Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-xs">
                    Invoice # *
                  </label>
                  <input
                    type="text"
                    required
                    value={originalInvoiceNumber}
                    onChange={(e) => setOriginalInvoiceNumber(e.target.value)}
                    placeholder="INV-XXXX"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-xs">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-xs">
                    Customer Phone
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="01700..."
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Customer Due Alert Note (if any) */}
              {matchedCustomer && matchedCustomer.totalDue > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs flex items-center justify-between font-mono">
                  <span className="text-amber-800">
                    Customer Current Due: <strong>{formatBDT(matchedCustomer.totalDue, sym)}</strong>
                  </span>
                  <span className="text-[11px] text-amber-700">
                    Can adjust refund directly to due!
                  </span>
                </div>
              )}

              {/* 4. Item Being Returned Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Returned Garment (Stock Will Restock)
                  </h4>
                  {returnedProd && (
                    <span className="text-[11px] font-mono text-slate-500">
                      Current Stock: <strong>{returnedProd.stock} pcs</strong>
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-xs">
                    Choose Garment Item *
                  </label>
                  <select
                    required
                    value={returnedProductId}
                    onChange={(e) => handleReturnedProductChange(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white font-sans text-xs"
                  >
                    <option value="">-- Select Garment from Inventory --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category}) - Size: {p.size}, Color: {p.color} [Price: {sym}{p.sellingPrice}, Stock: {p.stock}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-xs">
                      Returned Quantity *
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleReturnedQtyChange(
                            String(Math.max(1, (Number(returnedQty) || 1) - 1))
                          )
                        }
                        className="min-h-[42px] min-w-[42px] rounded-xl border border-slate-200 bg-white flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        required
                        value={returnedQty}
                        onChange={(e) => handleReturnedQtyChange(e.target.value)}
                        className="w-full min-h-[42px] px-3 text-center rounded-xl border border-slate-200 font-mono text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleReturnedQtyChange(String((Number(returnedQty) || 1) + 1))
                        }
                        className="min-h-[42px] min-w-[42px] rounded-xl border border-slate-200 bg-white flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {type === 'RETURN_REFUND' ? (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-xs">
                        Refund Amount ({sym}) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs bg-white"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-xs">
                        Item Value Credit
                      </label>
                      <div className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-100/70 font-mono text-xs flex items-center">
                        {formatBDT(
                          (returnedProd?.sellingPrice || 0) * (Number(returnedQty) || 1),
                          sym
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {type === 'RETURN_REFUND' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-xs">
                      Refund Payment Method *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-sans text-xs">
                      {['Cash', 'bKash', 'Nagad', 'Due Adjustment'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setRefundMethod(m)}
                          className={`min-h-[40px] px-2 rounded-xl border font-semibold transition-colors cursor-pointer ${
                            refundMethod === m
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {m === 'Due Adjustment' ? '⚖️ Due Adjust' : m}
                        </button>
                      ))}
                    </div>

                    {refundMethod === 'Due Adjustment' && matchedCustomer && (
                      <p className="text-[11px] text-amber-700 mt-1.5 font-mono">
                        Due will be reduced from {formatBDT(matchedCustomer.totalDue, sym)} to{' '}
                        <strong>
                          {formatBDT(
                            Math.max(0, matchedCustomer.totalDue - (Number(refundAmount) || 0)),
                            sym
                          )}
                        </strong>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Exchange Replacement Item Section (Only on EXCHANGE) */}
              {type === 'EXCHANGE' && (
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-purple-900 text-xs uppercase tracking-wider">
                      Replacement Item (Stock Will Deduct)
                    </h4>
                    {returnedProd && (
                      <label className="flex items-center gap-1.5 text-xs text-purple-800 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isSameGarmentSwap}
                          onChange={(e) => {
                            setIsSameGarmentSwap(e.target.checked);
                            if (e.target.checked && returnedProd) {
                              const alt = products.find(
                                (x) => x.id !== returnedProd.id && x.name === returnedProd.name
                              );
                              if (alt) setExchangeProductId(alt.id);
                            }
                          }}
                          className="rounded text-purple-600"
                        />
                        <span>Same Product Size/Color Only</span>
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-xs">
                      Choose Replacement Garment *
                    </label>
                    <select
                      required={type === 'EXCHANGE'}
                      value={exchangeProductId}
                      onChange={(e) => handleExchangeProductChange(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-purple-200 bg-white font-sans text-xs"
                    >
                      <option value="">-- Select Replacement SKU --</option>
                      {exchangeCandidateProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category}) - Size: {p.size}, Color: {p.color} [Price: {sym}{p.sellingPrice}, Stock: {p.stock}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-xs">
                        Replacement Qty *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={exchangeQty}
                        onChange={(e) => handleExchangeQtyChange(e.target.value)}
                        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-purple-200 font-mono text-xs bg-white"
                      />
                    </div>

                    <div>
                      {Number(exchangeExtraCharge) > 0 ? (
                        <div>
                          <label className="block font-semibold text-emerald-700 mb-1 text-xs">
                            Customer Pays Extra ({sym})
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={exchangeExtraCharge}
                            onChange={(e) => setExchangeExtraCharge(e.target.value)}
                            className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-emerald-300 font-mono text-xs bg-white text-emerald-700 font-bold"
                          />
                        </div>
                      ) : Number(refundAmount) > 0 ? (
                        <div>
                          <label className="block font-semibold text-red-600 mb-1 text-xs">
                            Refund Difference ({sym})
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-red-300 font-mono text-xs bg-white text-red-600 font-bold"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block font-semibold text-slate-600 mb-1 text-xs">
                            Price Difference
                          </label>
                          <div className="min-h-[42px] px-3 py-2 rounded-xl border border-purple-200 bg-white/80 font-mono text-xs flex items-center text-slate-700 font-semibold">
                            Even Exchange (৳0)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {Number(exchangeExtraCharge) > 0 && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-xs">
                        Extra Charge Payment Method
                      </label>
                      <div className="grid grid-cols-4 gap-2 font-sans text-xs">
                        {PAYMENT_METHODS.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setExtraChargeMethod(m)}
                            className={`min-h-[38px] px-2 rounded-xl border font-semibold transition-colors cursor-pointer ${
                              extraChargeMethod === m
                                ? 'bg-purple-700 text-white border-purple-700'
                                : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-100/50'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 6. Reason & Optional Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-xs">
                    Reason for Return / Exchange *
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white font-sans text-xs"
                  >
                    <option value="Wrong Size / Fit">Wrong Size / Fit</option>
                    <option value="Color Mismatch">Color Mismatch</option>
                    <option value="Defective / Damaged Item">Defective / Damaged Item</option>
                    <option value="Fabric / Quality Issue">Fabric / Quality Issue</option>
                    <option value="Customer Change of Mind">Customer Change of Mind</option>
                    <option value="Other">Other Reason</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-xs">
                    Optional Note / Details
                  </label>
                  <input
                    type="text"
                    value={reasonNote}
                    onChange={(e) => setReasonNote(e.target.value)}
                    placeholder="e.g. Returned with tag intact"
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* 7. Live Action Summary Confirmation Card */}
              {returnedProd && (
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl text-xs space-y-1.5 font-mono">
                  <p className="text-[11px] font-sans font-bold uppercase tracking-wider text-purple-300">
                    Summary of System Actions:
                  </p>
                  <p className="text-emerald-300">
                    ✔ Stock Restock: +{returnedQty} pcs to {returnedProd.name} ({returnedProd.size})
                  </p>
                  {type === 'EXCHANGE' && exchangeProd && (
                    <p className="text-amber-300">
                      ✔ Stock Deduct: -{exchangeQty} pcs from {exchangeProd.name} ({exchangeProd.size})
                    </p>
                  )}
                  {Number(refundAmount) > 0 && (
                    <p className="text-red-300">
                      ✔ Financial: Refund {formatBDT(Number(refundAmount), sym)} via {refundMethod}
                    </p>
                  )}
                  {type === 'EXCHANGE' && Number(exchangeExtraCharge) > 0 && (
                    <p className="text-emerald-300">
                      ✔ Financial: Collect Extra {formatBDT(Number(exchangeExtraCharge), sym)} via {extraChargeMethod}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Sticky Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 min-h-[46px] rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing || !returnedProductId}
                className="flex-1 min-h-[46px] rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{processing ? 'Processing...' : 'Confirm & Print Voucher'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
