'use client';

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Package,
  AlertTriangle,
  MoreVertical,
  History,
  Lock,
  ArrowLeft,
  FolderPlus,
  ShieldAlert,
  Camera,
  QrCode,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useErp } from '@/context/erp-context';
import {
  GARMENT_SIZES,
  GarmentCategory,
  Product,
  formatBDT,
} from '@/lib/types';
import { SingleProductQrModal } from './qr-views';
import { QrCameraScannerModal } from './qr-camera-scanner-modal';

function isSecurityCodeValid(input: string): boolean {
  const cleaned = input.trim().toLowerCase();
  return cleaned === 'confirm' || cleaned === '1234';
}

export function InventoryHistoryView() {
  const { inventoryLogs, setActiveModule } = useErp();
  const [actionFilter, setActionFilter] = useState<'ALL' | 'EDIT' | 'DELETE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 10;

  const filteredLogs = inventoryLogs.filter((log) => {
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      log.productName.toLowerCase().includes(q) ||
      log.sku.toLowerCase().includes(q) ||
      log.category.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q);
    return matchesAction && matchesSearch;
  });

  const totalHistoryPages = Math.max(1, Math.ceil(filteredLogs.length / historyPageSize));
  const pagedLogs = filteredLogs.slice(
    (historyPage - 1) * historyPageSize,
    historyPage * historyPageSize
  );

  return (
    <div className="space-y-5">
      {/* Top Bar with Back to Inventory Button */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveModule('inventory')}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Inventory</span>
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Inventory Edit & Delete History Log
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
              Total Recorded Actions: {inventoryLogs.length} logs
            </p>
          </div>
        </div>

        {/* Action Type Filter Dropdown for Mobile Ergonomics */}
        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as 'ALL' | 'EDIT' | 'DELETE')}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-base sm:text-xs font-semibold text-slate-800"
          >
            <option value="ALL">All Logs (Edit & Delete)</option>
            <option value="EDIT">Edited / Stock Updated Only</option>
            <option value="DELETE">Deleted Items Only</option>
          </select>
        </div>
      </div>

      {/* Search Logs */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search logs by product name, SKU, category, or change details..."
          className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
        />
      </div>

      {/* Log Entries List */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <History className="w-8 h-8 text-slate-400 mx-auto" />
          <div>
            <p className="text-sm font-bold text-slate-900">No History Logs Found</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Whenever any garment item is edited or deleted in Inventory, a permanent audit record will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {pagedLogs.map((log) => {
            const isDelete = log.action === 'DELETE';
            return (
              <div
                key={log.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`font-mono font-bold ${
                        isDelete ? 'text-red-600' : 'text-blue-600'
                      }`}
                    >
                      {isDelete ? 'DELETED' : 'EDITED'}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="font-bold text-sm text-slate-900">
                      {log.productName}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="font-mono text-slate-500">{log.sku}</span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="text-slate-600 font-medium">{log.category}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-mono tabular-nums leading-relaxed">
                    {log.details}
                  </p>
                </div>

                <div className="text-left sm:text-right font-mono tabular-nums shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <p className="text-xs font-semibold text-slate-600">{log.timestampStr}</p>
                  <p className="text-[11px] text-slate-400">Verified Action</p>
                </div>
              </div>
            );
          })}

          {/* Mobile-Friendly Pagination Controls */}
          {totalHistoryPages > 1 && (
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 font-mono">
                Page {historyPage} of {totalHistoryPages} ({filteredLogs.length} logs)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={historyPage <= 1}
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  className="min-h-[38px] min-w-[38px] px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>
                <div className="px-2 font-mono font-bold text-slate-800">
                  {historyPage} / {totalHistoryPages}
                </div>
                <button
                  type="button"
                  disabled={historyPage >= totalHistoryPages}
                  onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
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
    </div>
  );
}

export function InventoryView() {
  const {
    products,
    allCategories,
    inventoryLogs,
    storeSettings,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    setActiveModule,
    addCustomCategory,
    saveProduct,
    deleteProduct,
  } = useErp();

  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const productPageSize = 10;
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Three-dot menu open state (stores product.id)
  const [openMenuProductId, setOpenMenuProductId] = useState<string | null>(null);

  // Add / Edit Product Sheet State
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [editSecurityInput, setEditSecurityInput] = useState('');
  const [editSecurityError, setEditSecurityError] = useState('');

  // Delete Security Modal State
  const [deleteTargetProduct, setDeleteTargetProduct] = useState<Product | null>(null);
  const [deleteSecurityInput, setDeleteSecurityInput] = useState('');
  const [deleteSecurityError, setDeleteSecurityError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Add Custom Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryBengali, setNewCategoryBengali] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  // Product Form fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<GarmentCategory>('Pant');
  const [size, setSize] = useState('32');
  const [color, setColor] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStockAlert, setMinStockAlert] = useState(
    String(storeSettings.lowStockDefault || 5)
  );

  const sym = storeSettings.currencySymbol || '৳';

  const openAddSheet = () => {
    setEditingProduct(null);
    setEditSecurityInput('');
    setEditSecurityError('');
    const defaultCat: GarmentCategory =
      selectedCategoryFilter !== 'All'
        ? selectedCategoryFilter
        : allCategories[0]?.value || 'Pant';
    setCategory(defaultCat);
    const catMeta = allCategories.find((c) => c.value === defaultCat);
    const defaultSize = catMeta?.defaultSizes?.[0] || 'L';
    setSize(defaultSize);
    setName('');
    setSku(
      `${defaultCat.slice(0, 3).toUpperCase()}-${defaultSize}-${Math.floor(
        100 + Math.random() * 900
      )}`
    );
    setColor('');
    setPurchasePrice('');
    setSellingPrice('');
    setStock('10');
    setMinStockAlert(String(storeSettings.lowStockDefault || 5));
    setSheetOpen(true);
  };

  const openEditSheet = (p: Product) => {
    setOpenMenuProductId(null);
    setEditingProduct(p);
    setEditSecurityInput('');
    setEditSecurityError('');
    setName(p.name);
    setSku(p.sku);
    setCategory(p.category);
    setSize(p.size);
    setColor(p.color);
    setPurchasePrice(String(p.purchasePrice));
    setSellingPrice(String(p.sellingPrice));
    setStock(String(p.stock));
    setMinStockAlert(String(p.minStockAlert));
    setSheetOpen(true);
  };

  const openDeleteModal = (p: Product) => {
    setOpenMenuProductId(null);
    setDeleteTargetProduct(p);
    setDeleteSecurityInput('');
    setDeleteSecurityError('');
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Security confirmation gate when editing an existing product
    if (editingProduct && !isSecurityCodeValid(editSecurityInput)) {
      setEditSecurityError(
        'Please type CONFIRM or enter security code 1234 to authorize this edit.'
      );
      return;
    }

    setSaving(true);
    try {
      await saveProduct(
        {
          name,
          sku,
          category,
          size,
          color: color || 'Standard',
          purchasePrice: Number(purchasePrice) || 0,
          sellingPrice: Number(sellingPrice) || 0,
          stock: Number(stock) || 0,
          minStockAlert: Number(minStockAlert) || 5,
        },
        editingProduct?.id
      );
      setSheetOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTargetProduct) return;
    if (!isSecurityCodeValid(deleteSecurityInput)) {
      setDeleteSecurityError(
        'Please type CONFIRM or enter security code 1234 to delete this item.'
      );
      return;
    }

    setDeleting(true);
    try {
      await deleteProduct(deleteTargetProduct.id);
      setDeleteTargetProduct(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCategoryName.trim();
    if (!cleanName) return;
    setSavingCategory(true);
    try {
      await addCustomCategory(cleanName, newCategoryBengali.trim());
      setSelectedCategoryFilter(cleanName);
      setCategory(cleanName);
      setNewCategoryName('');
      setNewCategoryBengali('');
      setCategoryModalOpen(false);
    } finally {
      setSavingCategory(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategoryFilter === 'All' || p.category === selectedCategoryFilter;
    const matchesLow = !lowStockOnly || p.stock <= p.minStockAlert;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.color.toLowerCase().includes(q) ||
      p.size.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchesCat && matchesLow && matchesSearch;
  });

  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / productPageSize));
  const pagedProducts = filteredProducts.slice(
    (productPage - 1) * productPageSize,
    productPage * productPageSize
  );

  const totalFilteredUnits = filteredProducts.reduce((acc, p) => acc + p.stock, 0);
  const totalFilteredRetailValue = filteredProducts.reduce(
    (acc, p) => acc + p.stock * p.sellingPrice,
    0
  );

  return (
    <div className="space-y-5">
      {/* Top Action & History Log Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Garment Inventory & Stock Variants
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
            Showing {filteredProducts.length} SKUs · {totalFilteredUnits} pcs · Retail Value:{' '}
            {formatBDT(totalFilteredRetailValue, sym)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Add Category Button - Prominent for Mobile & Desktop */}
          <button
            type="button"
            onClick={() => setCategoryModalOpen(true)}
            className="flex-1 sm:flex-initial min-h-[44px] px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 active:scale-[0.98] text-indigo-900 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs"
            title="Create New Garment Category"
          >
            <FolderPlus className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>+ Category</span>
          </button>

          {/* QR Labels Batch Print */}
          <button
            type="button"
            onClick={() => setActiveModule('qr-labels')}
            className="flex-1 sm:flex-initial min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] text-slate-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all"
            title="Batch Print QR & Barcode Labels"
          >
            <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
            <span>QR Labels</span>
          </button>

          {/* Top History / Audit Log Button */}
          <button
            type="button"
            onClick={() => setActiveModule('inventory-history')}
            className="flex-1 sm:flex-initial min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] text-slate-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all"
          >
            <History className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Log ({inventoryLogs.length})</span>
          </button>

          {/* Add Garment Item Button */}
          <button
            type="button"
            onClick={openAddSheet}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Mobile-First Category Dropdown Selector + Add Category Button + Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Category Dropdown (Replaces Category Tabs) */}
          <div className="sm:col-span-5 flex items-center gap-2">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                setSelectedCategoryFilter(e.target.value);
                setProductPage(1);
              }}
              aria-label="Select Garment Category"
              className="flex-1 min-h-[44px] px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 truncate"
            >
              <option value="All">All Categories ({products.length} items)</option>
              {allCategories.map((cat) => {
                const count = products.filter((p) => p.category === cat.value).length;
                return (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} — {count} items
                  </option>
                );
              })}
            </select>

            <button
              type="button"
              onClick={() => setCategoryModalOpen(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs transition-all"
              title="Add New Category"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Category</span>
            </button>
          </div>

          {/* Search Input with Camera QR Button */}
          <div className="sm:col-span-5 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setProductPage(1);
                }}
                placeholder="Search name, SKU, size, or color..."
                className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="min-h-[44px] px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shrink-0 transition-transform"
              title="Scan Garment QR or Barcode to Find"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>
          </div>

          {/* Low Stock Filter Button */}
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => {
                setLowStockOnly((prev) => !prev);
                setProductPage(1);
              }}
              className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                lowStockOnly
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Low Stock</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop to close Three-Dot menu when clicking outside */}
      {openMenuProductId && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setOpenMenuProductId(null)}
        />
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <Package className="w-8 h-8 text-slate-400 mx-auto" />
          <div>
            <p className="text-sm font-bold text-slate-900">No Matching Garment Items</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Add a new garment item or select another category from the dropdown above.
            </p>
          </div>
          <button
            onClick={openAddSheet}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Garment Item</span>
          </button>
        </div>
      ) : (
        <>
          {/* iPhone / Mobile Touch Cards (<768px) — Stock Display + Three-Dot Menu Only */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {pagedProducts.map((p) => {
              const isLow = p.stock <= p.minStockAlert;
              const menuOpen = openMenuProductId === p.id;
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 leading-snug">{p.name}</p>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <span className="font-mono text-slate-700">{p.sku}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-slate-700">{p.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>Size {p.size}</span>
                        <span aria-hidden="true">·</span>
                        <span>{p.color}</span>
                      </div>
                    </div>

                    {/* Three-Dot Trigger */}
                    <div className="relative z-30 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuProductId(menuOpen ? null : p.id)
                        }
                        className="min-h-[44px] min-w-[44px] -mr-2 -mt-1 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200"
                        aria-label="Product options"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {menuOpen && (
                        <div className="absolute right-0 top-11 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-40">
                          <button
                            type="button"
                            onClick={() => openEditSheet(p)}
                            className="w-full min-h-[44px] px-4 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5"
                          >
                            <Edit3 className="w-4 h-4 text-blue-600" />
                            <span>Edit & Update Stock</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuProductId(null);
                              setQrProduct(p);
                            }}
                            className="w-full min-h-[44px] px-4 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 border-t border-slate-100"
                          >
                            <QrCode className="w-4 h-4 text-purple-600" />
                            <span>Print QR Sticker</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(p)}
                            className="w-full min-h-[44px] px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 border-t border-slate-100"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                            <span>Delete Item</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Info Row: Prices & Stock Quantity Only (No +/- or exposed Edit/Delete) */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 font-mono tabular-nums">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-900 font-bold">
                        Price: {formatBDT(p.sellingPrice, sym)}
                      </span>
                      <span className="text-slate-400">
                        Cost: {formatBDT(p.purchasePrice, sym)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold ${
                          p.stock === 0
                            ? 'text-red-600'
                            : isLow
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        Stock: {p.stock} pcs
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop High-Density Data Table (>=768px) — Stock Display + Three-Dot Menu Only */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-visible">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                    <th className="py-3 px-4">SKU & Garment Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Size & Color</th>
                    <th className="py-3 px-4 text-right">Purchase Cost</th>
                    <th className="py-3 px-4 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-right">Stock Quantity</th>
                    <th className="py-3 px-4 text-right">Options</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {pagedProducts.map((p) => {
                    const isLow = p.stock <= p.minStockAlert;
                    const menuOpen = openMenuProductId === p.id;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="font-mono text-[11px] text-slate-400 mt-0.5">{p.sku}</p>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{p.category}</td>
                        <td className="py-3 px-4 text-slate-600">
                          Size {p.size} · {p.color}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                          {formatBDT(p.purchasePrice, sym)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                          {formatBDT(p.sellingPrice, sym)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          <span
                            className={`font-bold ${
                              p.stock === 0
                                ? 'text-red-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            {p.stock} pcs
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right relative">
                          <div className="inline-block relative z-30">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuProductId(menuOpen ? null : p.id)
                              }
                              className="min-h-[38px] min-w-[38px] rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 ml-auto"
                              aria-label="Options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {menuOpen && (
                              <div className="absolute right-0 top-10 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-40 text-left">
                                <button
                                  type="button"
                                  onClick={() => openEditSheet(p)}
                                  className="w-full min-h-[40px] px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5"
                                >
                                  <Edit3 className="w-4 h-4 text-blue-600" />
                                  <span>Edit & Update Stock</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuProductId(null);
                                    setQrProduct(p);
                                  }}
                                  className="w-full min-h-[40px] px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 border-t border-slate-100"
                                >
                                  <QrCode className="w-4 h-4 text-purple-600" />
                                  <span>Print QR Sticker</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeleteModal(p)}
                                  className="w-full min-h-[40px] px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 border-t border-slate-100"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                  <span>Delete Item</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile-Friendly Pagination Controls */}
          {totalProductPages > 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 font-mono text-[11px] sm:text-xs">
                Page {productPage} of {totalProductPages} ({filteredProducts.length} items)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={productPage <= 1}
                  onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                  className="min-h-[38px] min-w-[38px] px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 flex items-center justify-center gap-1 hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>
                <div className="px-2 font-mono font-bold text-slate-800 text-xs">
                  {productPage} / {totalProductPages}
                </div>
                <button
                  type="button"
                  disabled={productPage >= totalProductPages}
                  onClick={() => setProductPage((p) => Math.min(totalProductPages, p + 1))}
                  className="min-h-[38px] min-w-[38px] px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40 flex items-center justify-center gap-1 hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 1. Add Custom Category Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleAddCategorySubmit}
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Add New Garment Category
                </h3>
                <p className="text-xs text-slate-500">
                  New category will appear in the Inventory dropdown & product forms
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Panjabi, Jacket, Blazer..."
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Secondary / Sub-Label (Optional)
                </label>
                <input
                  type="text"
                  value={newCategoryBengali}
                  onChange={(e) => setNewCategoryBengali(e.target.value)}
                  placeholder="e.g. Traditional, Formal, Casual"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="flex-1 min-h-[46px] rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingCategory}
                className="flex-1 min-h-[46px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-50"
              >
                {savingCategory ? 'Adding...' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Add / Edit Product Bottom Sheet (with Stock Update & Security Confirmation on Edit) */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleProductSubmit}
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          >
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />

            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingProduct
                    ? 'Edit Garment & Update Stock'
                    : 'Add New Garment Item'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingProduct
                    ? 'Update stock quantity or details and confirm with security code'
                    : 'Configure garment category, size variant, pricing, and opening stock'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Garment Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(true)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ New Category</span>
                  </button>
                </div>
                <select
                  value={category}
                  onChange={(e) => {
                    const nextCat = e.target.value;
                    setCategory(nextCat);
                    const catMeta = allCategories.find((c) => c.value === nextCat);
                    if (catMeta && !editingProduct) {
                      setSize(catMeta.defaultSizes[0] || 'L');
                    }
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm text-slate-900 bg-white"
                >
                  {allCategories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Slim Fit Stretch Denim Pant"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="PNT-32-01"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Size *
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-base sm:text-sm text-slate-900 bg-white"
                  >
                    {GARMENT_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Color *
                  </label>
                  <input
                    type="text"
                    required
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Navy Blue"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-base sm:text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Cost ({sym}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="650"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono tabular-nums text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price ({sym}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="1190"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono tabular-nums text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-blue-700 mb-1">
                    Stock Quantity (pcs) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 py-2 rounded-xl border-2 border-blue-500 bg-blue-50/20 text-base sm:text-sm font-mono font-bold tabular-nums text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Low Stock Alert Level *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 py-2 rounded-xl border border-slate-200 text-base sm:text-sm font-mono tabular-nums text-slate-900"
                  />
                </div>
              </div>

              {/* Security Password / CONFIRM Gate when Editing */}
              {editingProduct && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Security Verification Required to Save Changes</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    To prevent accidental stock or price changes, type{' '}
                    <strong className="font-mono">CONFIRM</strong> or enter security PIN{' '}
                    <strong className="font-mono">1234</strong> below:
                  </p>
                  <input
                    type="text"
                    required
                    value={editSecurityInput}
                    onChange={(e) => {
                      setEditSecurityInput(e.target.value);
                      if (editSecurityError) setEditSecurityError('');
                    }}
                    placeholder="Type CONFIRM or 1234"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-base sm:text-sm font-mono text-slate-900"
                  />
                  {editSecurityError && (
                    <p className="text-xs font-semibold text-red-600">
                      {editSecurityError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex-1 min-h-[46px] rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 min-h-[46px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : editingProduct
                  ? 'Confirm & Update Stock'
                  : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Delete Security Confirmation Modal */}
      {deleteTargetProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleConfirmDelete}
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />

            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-base">Confirm Product Deletion</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTargetProduct(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-sm text-slate-900">
                  {deleteTargetProduct.name}
                </p>
                <p className="text-slate-600 font-mono">
                  SKU: {deleteTargetProduct.sku} · {deleteTargetProduct.category} · Size{' '}
                  {deleteTargetProduct.size} ({deleteTargetProduct.color})
                </p>
                <p className="text-slate-700 font-mono font-semibold">
                  Current Stock: {deleteTargetProduct.stock} pcs
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">
                  Type <span className="font-mono text-red-600">CONFIRM</span> or enter
                  security PIN <span className="font-mono text-red-600">1234</span> to
                  permanently delete:
                </label>
                <input
                  type="text"
                  required
                  value={deleteSecurityInput}
                  onChange={(e) => {
                    setDeleteSecurityInput(e.target.value);
                    if (deleteSecurityError) setDeleteSecurityError('');
                  }}
                  placeholder="Type CONFIRM or 1234"
                  className="w-full min-h-[46px] px-3.5 py-2 rounded-xl border border-slate-300 text-base sm:text-sm font-mono text-slate-900"
                />
                {deleteSecurityError && (
                  <p className="text-xs font-semibold text-red-600">
                    {deleteSecurityError}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetProduct(null)}
                className="flex-1 min-h-[46px] rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deleting}
                className="flex-1 min-h-[46px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Custom Garment Category Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <form
            onSubmit={handleAddCategorySubmit}
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />

            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600">
                <FolderPlus className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-base text-slate-900">Add New Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Panjabi, Kabli, Blazer, Jacket"
                  className="w-full min-h-[46px] px-3.5 py-2 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Short Tag / Code (Optional)
                </label>
                <input
                  type="text"
                  value={newCategoryBengali}
                  onChange={(e) => setNewCategoryBengali(e.target.value)}
                  placeholder="e.g. PNJ, KBL, BLZ"
                  className="w-full min-h-[46px] px-3.5 py-2 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-800 space-y-1">
                <p className="font-semibold">Tip:</p>
                <p className="text-[11px] text-indigo-700">
                  New categories immediately appear in inventory filter dropdowns and product entry forms.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="flex-1 min-h-[46px] rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingCategory || !newCategoryName.trim()}
                className="flex-1 min-h-[46px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-50 shadow-xs flex items-center justify-center gap-1.5"
              >
                {savingCategory ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Single Product QR Sticker Modal */}
      {qrProduct && (
        <SingleProductQrModal
          product={qrProduct}
          onClose={() => setQrProduct(null)}
        />
      )}

      {/* Mobile Camera Barcode/QR Scanner for Inventory Lookup */}
      <QrCameraScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanItem={(product) => {
          setSearchQuery(product.sku);
          setOpenMenuProductId(product.id);
        }}
        title="Find Garment by Camera QR"
        subtitle="Point camera at clothing tag to locate in inventory"
      />
    </div>
  );
}
