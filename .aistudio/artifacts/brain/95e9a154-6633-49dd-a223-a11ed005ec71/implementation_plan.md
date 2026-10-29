# ThreadCraft ERP — Mobile-First (iPhone) Apparel & Menswear Retail ERP

ThreadCraft ERP is a mobile-first enterprise resource planning and point-of-sale system engineered specifically for iPhone and iOS touch ergonomics while scaling seamlessly to desktop, featuring real-time Firebase Firestore persistence, size/color inventory tracking across nine garment categories, customer and supplier due (Baki) ledgers, daily expense management, and mobile-printable BDT (`৳`) invoices.

### User Review & Critical Decisions

> [!IMPORTANT]
> This revised plan optimizes the entire ERP experience for **iPhone / iOS one-handed mobile usage** alongside full hierarchical slide-bar navigation. Once you click **Proceed**, you will be prompted to accept the Firebase setup dialog to provision your live Firestore database and Google Authentication.

- **Confirmed Decision 1 — iPhone & iOS Mobile-First Architecture**:
  - **Slide-Over Hierarchical Sidebar Drawer + Bottom Thumb Bar**: On iPhone viewports (`375px`–`430px`), tapping the top-left menu button opens a smooth iOS-style **Slide-Over Sidebar Drawer** containing the exact hierarchy requested (`Dashboard`, `Inventory`, `Sales` → `[Customer, Sales Order, Sales Invoice]`, `Purchase` → `[Supplier, Purchase Invoice]`, `Daily Expenses`, `Report`, `Setting`), paired with a **Fixed Bottom Thumb Tab Bar** for instant one-handed switching between core workflows (`Dashboard`, `Inventory`, `Sales`, `Purchase`, `Menu`).
  - **Touch-Optimized Mobile Cards & Bottom Sheets**: Data tables automatically render as high-density tap-friendly cards on iPhone (`min-h-[44px]` touch hitboxes, zero horizontal scroll clipping), and forms/invoice builders open in smooth **iOS Bottom Sheet Drawers** with sticky bottom action bars and `16px` input font sizes to prevent unwanted iOS Safari auto-zoom.
- **Confirmed Decision 2 — Full English Interface with BDT (`৳`) Currency**: All navigation, forms, financial ledgers, and receipts are in English using Bangladeshi Taka (`৳` / `BDT`) across all 9 garment categories (`Pant`, `Shirt`, `Polo Shirt`, `T-Shirt`, `Half Pant`, `Trouser`, `Formal Pant`, `Sweatshirt`, `Half Shirt`).
- **Confirmed Decision 3 — Size & Color Variant Inventory**: Each product tracks size (`S`, `M`, `L`, `XL`, `XXL`, or waist sizes `28`–`38`) and color attributes alongside SKU codes, purchase cost price, retail selling price, current stock count, and automatic low-stock threshold alerts.
- **Confirmed Decision 4 — Full & Partial Payment Ledger (Baki / Due Tracking)**: Both Sales Invoices and Purchase Invoices support full or partial payments (`Cash`, `bKash`, `Nagad`, `Card`), automatically updating Customer and Supplier due balances and generating mobile-shareable / AirPrint-ready receipts.

---

### 1. Overview & Core Concept

- **What It Does**: Delivers a fast, native-feeling iPhone web application for running a menswear clothing store from the shop floor—covering **Dashboard**, **Inventory**, **Sales** (`Customer`, `Sales Order`, `Sales Invoice`), **Purchase** (`Supplier`, `Purchase Invoice`), **Daily Expenses**, **Report**, and **Setting**—synced in real time via Firebase.
- **Target Audience / Persona**: Clothing store owners and showroom managers operating primarily from an iPhone on the retail floor who need quick thumb access to stock levels, mobile billing, customer Baki (due) collection, and daily cash flow.
- **Key Value**: Lets the store owner manage stock variants, bill customers in seconds from their iPhone, track partial payments/dues, and inspect net profit anywhere without needing a desktop computer.

---

### 2. User Experience & Visual Design

- **Key User Flows (Optimized for iPhone)**:
  1. **Sign-In & One-Tap Sample Store Setup**: The user signs in with Google on their iPhone. If the database is empty, a prominent **"Load Sample Garment Store Data"** button populates realistic items across all 9 categories (`Pant`, `Shirt`, `Polo Shirt`, `T-Shirt`, `Half Pant`, `Trouser`, `Formal Pant`, `Sweatshirt`, `Half Shirt`), sample customers, suppliers, invoices, and expenses.
  2. **Slide-Bar & Thumb-Zone Navigation**:
     - **Slide-Over Sidebar (`Slidebar`)**: Accessible from any screen via the top-left menu trigger or the bottom bar; features expandable accordions for **Sales** (`Customer`, `Sales Order`, `Sales Invoice`) and **Purchase** (`Supplier`, `Purchase Invoice`), plus direct links to **Dashboard**, **Inventory**, **Daily Expenses**, **Report**, and **Setting**.
     - **Bottom Quick-Access Bar**: Anchored in the natural thumb reach zone (`h-16 pb-safe`) for one-tap jumping between key modules and a quick `+ Bill` action.
  3. **Mobile Inventory Management**: Horizontal swipeable category filter bar (`All`, `Pant`, `Shirt`, `Polo Shirt`, `T-Shirt`, `Half Pant`, `Trouser`, `Formal Pant`, `Sweatshirt`, `Half Shirt`), instant search by SKU/name/size, and one-tap stock adjustment or product editing in an iOS bottom sheet.
  4. **Mobile Sales Flow (Customers → Sales Orders → Sales Invoices)**:
     - **Customers**: Tap any customer card to call/WhatsApp, inspect their invoice history, or tap **"Collect Due (Baki)"** to record a payment.
     - **Sales Orders**: Create wholesale/retail bookings on mobile and tap **"Convert to Invoice"** when ready to deliver.
     - **Sales Invoices (Mobile POS)**: Select customer (or walk-in), tap products to add to cart with automatic stock validation, enter discount and paid amount (`Cash`, `bKash`, `Nagad`, `Card`), automatically compute due (`৳`), deduct inventory atomically, and preview a clean **Mobile Receipt / AirPrint Invoice**.
  5. **Mobile Purchase Flow (Suppliers → Purchase Invoices)**:
     - **Suppliers**: Track garment wholesalers/factories and record **"Pay Supplier Due"** transactions.
     - **Purchase Invoices**: Record incoming stock shipments from an iPhone; saving a Purchase Invoice automatically increases product stock counts and updates supplier payable balances.
  6. **Daily Expenses & Financial Reports**:
     - Log shop expenses (`Rent`, `Electricity`, `Salary`, `Transport`, `Packaging`, `Refreshment`, `Other`) in seconds.
     - View mobile-friendly **Profit & Loss Cards** (Gross Sales, COGS, Gross Profit, Expenses, Net Profit), Category Sales Breakdown, and Due Summaries.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Native iOS Enterprise Retail Console—tactile, high-contrast surfaces with frosted glass navigation headers (`backdrop-blur-md bg-white/90`), crisp hairline dividers, and generous `44px × 44px` minimum touch targets.
  - *Color Palette & Mood* (60-30-10 Discipline):
    - **60% Dominant Neutral Canvas**: Daylight-legible cool alabaster (`#F8FAFC`) with pure white (`#FFFFFF`) interactive cards and list rows.
    - **30% Structural Surfaces**: Deep obsidian slate (`#0F172A`) for the slide-over navigation sidebar (`Slidebar`) and primary summary cards, paired with subtle slate borders (`#E2E8F0`).
    - **10% Accent Budget**: High-intent Royal Indigo (`#2563EB`) for primary CTAs and active states, paired with semantic status indicators always accompanied by explicit text labels: Emerald (`#16A34A` — Paid / In Stock), Amber (`#D97706` — Partial / Low Stock), and Crimson (`#DC2626` — Due / Out of Stock).
  - *Typography & Hierarchy* (2+1 Font Rule & iOS Input Safety):
    - **Display & Navigation Face**: `Plus Jakarta Sans` (600/700 weight) for section titles, header bar, and summary cards.
    - **Body & Form Controls**: `DM Sans` (400/500 weight), with all mobile `<input>` and `<select>` fields enforced at `text-base` (`16px`) so iOS Safari never triggers jarring viewport zoom when typing.
    - **Tabular Numerals & Financial Metrics**: `JetBrains Mono` (`font-mono tabular-nums`) strictly applied to all BDT (`৳`) prices, quantities, SKU codes, and invoice totals.
  - *Viewport & Responsive Ergonomics*:
    - **15% Aggregate Sticky Surface Cap**: Compact `52px` sticky top bar + `60px` bottom navigation bar keep over 85% of the iPhone screen open for scrollable content.
    - **Adaptive Mobile-to-Desktop Layout**: Uses stacked touch cards and slide-over drawers on iPhone (`375px`–`430px`) while expanding cleanly into a docked sidebar + multi-column data table workspace on `lg:` desktop screens.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Navigation (Slide-Over Hierarchical Sidebar + Bottom Thumb Bar)**
  - *Chosen Approach*: Provide the exact requested hierarchical slide-bar menu (`Dashboard`, `Inventory`, `Sales` → `[Customer, Sales Order, Sales Invoice]`, `Purchase` → `[Supplier, Purchase Invoice]`, `Daily Expenses`, `Report`, `Setting`) as a smooth slide-over drawer on iPhone (and docked sidebar on desktop), supplemented by a 5-item bottom thumb bar on mobile.
  - *Why*: Preserves 100% of the requested sidebar hierarchy without crowding the narrow iPhone screen, while keeping frequent actions within effortless one-handed thumb reach.
- **Decision 2: Adaptive Card-List Rows on iPhone vs. Data Tables on Desktop**
  - *Chosen Approach*: Render inventory items, invoices, orders, and ledgers as structured, full-width tap cards on mobile viewports (`<768px`) and full multi-column tables on desktop (`>=768px`).
  - *Why*: Multi-column spreadsheets require awkward horizontal pinching/scrolling on an iPhone; structured mobile cards show SKU, size/color, price, stock, and status clearly in a single vertical scroll.
- **Decision 3: Atomic Stock & Due Balance Sync via Firestore Batches**
  - *Chosen Approach*: Creating a Sales Invoice or Purchase Invoice executes an atomic Firestore write batch that records the invoice, adjusts each line item's product stock, and updates the Customer or Supplier due balance simultaneously.
  - *Why*: Guarantees inventory and Baki (due) ledgers remain accurate even on unstable mobile connections.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│             ThreadCraft ERP — Mobile-First (iPhone) & Desktop Shell        │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │ Slide-Over Sidebar      │  │ Compact Mobile Top Bar (52pxSticky)     │  │
│  │ (Drawer on iPhone /     │  │ [☰ Slidebar]   [Module Title]  [+ Action]│  │
│  │  Docked on Desktop)     │  ├─────────────────────────────────────────┤  │
│  │ • Dashboard             │  │ Touch-First Active Viewport             │  │
│  │ • Inventory (9 Cats)    │  │  ├─ 2-Col KPI Grid & Category Scroller  │  │
│  │ • Sales ▼               │  │  ├─ Mobile Tap Cards / Desktop Tables   │  │
│  │   ├─ Customer           │  │  ├─ Bottom-Sheet POS & Order Builder    │  │
│  │   ├─ Sales Order        │  │  ├─ Customer & Supplier Due Collection  │  │
│  │   └─ Sales Invoice      │  │  ├─ Mobile Receipt / AirPrint Preview   │  │
│  │ • Purchase ▼            │  │  ├─ Daily Expense Logger & P&L Reports  │  │
│  │   ├─ Supplier           │  ├─────────────────────────────────────────┤  │
│  │   └─ Purchase Invoice   │  │ iPhone Bottom Thumb Bar (Mobile Only)   │  │
│  │ • Daily Expenses        │  │ [Home] [Stock] [+Sale] [Purchase] [Menu]│  │
│  │ • Report                │  └────────────────────┬────────────────────┘  │
│  │ • Setting               │                       │                       │
│  └─────────────────────────┘                       ▼                       │
│                                    ┌───────────────────────────┐           │
│                                    │ Real-Time ERP Context     │           │
│                                    │ (onSnapshot + Batch Sync) │           │
│                                    └─────────────┬─────────────┘           │
└──────────────────────────────────────────────────┼─────────────────────────┘
                                                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│               Firebase Backend (Auth + Cloud Firestore)                    │
│  ├─ products         (9 Apparel Categories, Size, Color, Cost, Price, Qty) │
│  ├─ customers        (Name, Phone, Address, TotalSales, TotalDue)          │
│  ├─ salesOrders      (OrderNo, Customer, LineItems, Status, TotalAmount)   │
│  ├─ salesInvoices    (InvNo, Customer, LineItems, Paid, Due, Method)       │
│  ├─ suppliers        (Name, Company, Phone, TotalPurchased, TotalPayable)  │
│  ├─ purchaseInvoices (PurNo, Supplier, LineItems, Paid, Due, Method)       │
│  ├─ expenses         (Title, Category, Amount, PaymentMethod, Date, Notes) │
│  └─ storeSettings    (StoreName, Phone, Address, Currency, FooterNote)     │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Products (`products`)**: `name`, `sku`, `category` (`Pant`, `Shirt`, `Polo Shirt`, `T-Shirt`, `Half Pant`, `Trouser`, `Formal Pant`, `Sweatshirt`, `Half Shirt`), `size` (`S`, `M`, `L`, `XL`, `XXL`, `28`–`38`), `color`, `purchasePrice`, `sellingPrice`, `stock`, `minStockAlert`, `ownerId`, `createdAt`, `updatedAt`.
  - **Customers (`customers`)**: `name`, `phone`, `address`, `totalSales`, `totalDue`, `ownerId`, `createdAt`, `updatedAt`.
  - **Sales Orders (`salesOrders`)**: `orderNumber`, `customerId`, `customerName`, `itemsSummary`, `itemsData` (bounded array of line items), `totalAmount`, `status` (`Pending`, `Confirmed`, `Invoiced`, `Cancelled`), `orderDate`, `ownerId`, `createdAt`, `updatedAt`.
  - **Sales Invoices (`salesInvoices`)**: `invoiceNumber`, `customerId`, `customerName`, `itemsSummary`, `itemsData`, `subtotal`, `discount`, `grandTotal`, `paidAmount`, `dueAmount`, `paymentMethod` (`Cash`, `bKash`, `Nagad`, `Card`), `status` (`Paid`, `Partial`, `Due`), `invoiceDate`, `ownerId`, `createdAt`, `updatedAt`.
  - **Suppliers (`suppliers`)**: `name`, `companyName`, `phone`, `address`, `totalPurchased`, `totalPayable`, `ownerId`, `createdAt`, `updatedAt`.
  - **Purchase Invoices (`purchaseInvoices`)**: `invoiceNumber`, `supplierId`, `supplierName`, `itemsSummary`, `itemsData`, `totalAmount`, `paidAmount`, `dueAmount`, `paymentMethod`, `status` (`Paid`, `Partial`, `Due`), `purchaseDate`, `ownerId`, `createdAt`, `updatedAt`.
  - **Daily Expenses (`expenses`)**: `title`, `category` (`Rent`, `Electricity`, `Salary`, `Transport`, `Packaging`, `Refreshment`, `Other`), `amount`, `paymentMethod`, `expenseDate`, `notes`, `ownerId`, `createdAt`, `updatedAt`.
  - **Store Settings (`storeSettings`)**: `storeName`, `tagline`, `phone`, `email`, `address`, `currencySymbol` (`৳`), `invoiceFooterNote`, `lowStockDefault`, `ownerId`, `updatedAt`.

- **Interactive Component & State Mapping**:
  - **Mobile Slidebar & Navigation State**: Tapping the hamburger button or the `Menu` tab opens the animated slide-over sidebar with collapsible `Sales` and `Purchase` sub-menus; selecting any sub-item closes the drawer and scrolls to the top of the module.
  - **Bottom-Sheet Modals**: All creation/editing flows (Add Product, New Sales Order, New Sales Invoice, New Purchase Invoice, Collect Customer Due, Pay Supplier Due, Log Expense) render inside an iOS-style slide-up sheet (`rounded-t-3xl`) with a drag-handle affordance and a sticky bottom submit bar.
  - **AirPrint / Mobile Receipt Modal**: Tapping any Sales or Purchase Invoice opens a clean receipt view formatted for both iPhone screen sharing/screenshots and direct iOS AirPrint (`window.print()`).
