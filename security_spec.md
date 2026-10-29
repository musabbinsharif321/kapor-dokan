# Security Specification — ThreadCraft Apparel ERP

## 1. Data Invariants

1. **Authenticated & Verified Store Owner**: Every write operation across `products`, `customers`, `salesOrders`, `salesInvoices`, `suppliers`, `purchaseInvoices`, `expenses`, and `storeSettings` requires an authenticated user with `request.auth != null && request.auth.token.email_verified == true`.
2. **Strict Tenant Isolation (`ownerId`)**: Every document in all 8 collections MUST store `ownerId` matching `request.auth.uid` (`^[a-zA-Z0-9_\-]+$`, max 128 chars). A user can only `get`, `list`, `create`, `update`, or `delete` documents where `ownerId == request.auth.uid`.
3. **Immutable Ownership & Creation Timestamps**: During `update` operations, `ownerId` and `createdAt` must remain strictly unchanged (`incoming().ownerId == existing().ownerId && incoming().createdAt == existing().createdAt`).
4. **Server-Side Temporal Integrity**: All `create` operations require `incoming().createdAt == request.time && incoming().updatedAt == request.time`. All `update` operations require `incoming().updatedAt == request.time`.
5. **Strict Key Allowlisting & Type/Size Bounds**: Every `isValid[Entity]` helper validates exact required and allowed keys (`data.keys().hasAll(...) && data.keys().hasOnly(...)`) and enforces string `.size()` limits and numeric non-negative bounds matching `firebase-blueprint.json`.
6. **Path ID Hardening**: Every single-document target rule (`get`, `create`, `update`, `delete`) validates its path variable via `isValidId(docId)` (`id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Identity Spoofing on Product Creation)**: Authenticated user `uid_A` creates `/products/prod_1` with `ownerId: "uid_B"`. -> `PERMISSION_DENIED`.
2. **Payload 2 (Unverified Email Write)**: User with `email_verified: false` attempts to create `/products/prod_1`. -> `PERMISSION_DENIED`.
3. **Payload 3 (Shadow Field Injection on Customer)**: Creating `/customers/cust_1` with an extra undeclared field `isVIP: true`. -> `PERMISSION_DENIED`.
4. **Payload 4 (Path ID Poisoning)**: Creating a product at `/products/invalid$id!with*special` or >128 chars. -> `PERMISSION_DENIED`.
5. **Payload 5 (Invalid Garment Category Enum)**: Creating `/products/prod_1` with `category: "Shoes"` (not in the 9 allowed garment categories). -> `PERMISSION_DENIED`.
6. **Payload 6 (Value Poisoning on Update)**: Updating `/products/prod_1` with `stock: "one hundred"` (string instead of number) or negative stock `-5`. -> `PERMISSION_DENIED`.
7. **Payload 7 (Ownership Hijack on Update)**: Updating `/customers/cust_1` to change `ownerId` from `uid_A` to `uid_B`. -> `PERMISSION_DENIED`.
8. **Payload 8 (Forged Client Timestamp)**: Creating `/expenses/exp_1` with a past/future client timestamp instead of `request.time`. -> `PERMISSION_DENIED`.
9. **Payload 9 (Cross-Tenant PII Read on Customers)**: User `uid_B` attempts `get` on `/customers/cust_owned_by_A`. -> `PERMISSION_DENIED`.
10. **Payload 10 (Unscoped List Query Scraping)**: User `uid_B` runs a collection `list` query on `/salesInvoices` without filtering `ownerId == request.auth.uid`. -> `PERMISSION_DENIED`.
11. **Payload 11 (String Buffer Overflow Attack)**: Creating `/salesInvoices/inv_1` with `itemsSummary` exceeding 1000 characters (e.g., 50,000 chars). -> `PERMISSION_DENIED`.
12. **Payload 12 (Immutable `createdAt` Tampering)**: Updating `/purchaseInvoices/pur_1` while mutating `createdAt` to `request.time`. -> `PERMISSION_DENIED`.

---

## 3. Test Runner Reference

See `firestore.rules.test.ts` for the complete verification suite covering all 12 adversarial payloads.
