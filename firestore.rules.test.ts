/**
 * Firestore Security Rules Verification Suite (Dirty Dozen Payloads)
 * Verifies that all 12 adversarial payloads in security_spec.md return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'create' | 'update' | 'get' | 'list' | 'delete';
  auth: { uid: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Product Creation',
    collection: 'products',
    docId: 'prod_1',
    operation: 'create',
    auth: { uid: 'user_a', email_verified: true },
    payload: { ownerId: 'user_b', name: 'Denim Pant', sku: 'PNT-01', category: 'Pant' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Write',
    collection: 'products',
    docId: 'prod_1',
    operation: 'create',
    auth: { uid: 'user_a', email_verified: false },
    payload: { ownerId: 'user_a', name: 'Denim Pant', sku: 'PNT-01', category: 'Pant' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Customer',
    collection: 'customers',
    docId: 'cust_1',
    operation: 'create',
    auth: { uid: 'user_a', email_verified: true },
    payload: {
      name: 'Rahim Uddin',
      phone: '01711000000',
      address: 'Dhaka',
      totalSales: 0,
      totalDue: 0,
      ownerId: 'user_a',
      isVIP: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Path ID Poisoning',
    collection: 'products',
    docId: 'invalid$id!with*special',
    operation: 'create',
    auth: { uid: 'user_a', email_verified: true },
    payload: { ownerId: 'user_a' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Invalid Garment Category Enum',
    collection: 'products',
    docId: 'prod_1',
    operation: 'create',
    auth: { uid: 'user_a', email_verified: true },
    payload: { ownerId: 'user_a', category: 'Shoes' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Value Poisoning on Update',
    collection: 'products',
    docId: 'prod_1',
    operation: 'update',
    auth: { uid: 'user_a', email_verified: true },
    payload: { stock: -5 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Ownership Hijack on Update',
    collection: 'customers',
    docId: 'cust_1',
    operation: 'update',
    auth: { uid: 'user_a', email_verified: true },
    payload: { ownerId: 'user_b' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Forged Client Timestamp',
    collection: 'expenses',
    docId: 'exp_1',
    operation: 'create',
    auth: { uid: 'user_a', email_verified: true },
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Cross-Tenant PII Read on Customers',
    collection: 'customers',
    docId: 'cust_owned_by_a',
    operation: 'get',
    auth: { uid: 'user_b', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Unscoped List Query Scraping',
    collection: 'salesInvoices',
    docId: '*',
    operation: 'list',
    auth: { uid: 'user_b', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'String Buffer Overflow Attack',
    collection: 'salesInvoices',
    docId: 'inv_1',
    operation: 'create',
    auth: { uid: 'user_a', email_verified: true },
    payload: { itemsSummary: 'X'.repeat(2000) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Immutable createdAt Tampering',
    collection: 'purchaseInvoices',
    docId: 'pur_1',
    operation: 'update',
    auth: { uid: 'user_a', email_verified: true },
    payload: { createdAt: '2026-10-28T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
];
