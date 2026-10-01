import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  boolean,
  integer,
  jsonb,
  date,
  check,
  uniqueIndex,
  index,
  pgEnum
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const businessTypeEnum = pgEnum('business_type', ['retail', 'services', 'hybrid']);
export const roleEnum = pgEnum('role', ['owner', 'admin', 'manager', 'employee']);
export const itemTypeEnum = pgEnum('item_type', ['good', 'service']);
export const transactionTypeEnum = pgEnum('transaction_type', ['sale', 'service_delivery', 'stock_adjustment', 'refund']);
export const debtStatusEnum = pgEnum('debt_status', ['outstanding', 'partially_paid', 'paid', 'cancelled']);
export const jobStatusEnum = pgEnum('job_status', ['pending', 'processing', 'completed', 'failed']);
export const billingProviderEnum = pgEnum('billing_provider', ['stripe', 'manual', 'none']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'past_due', 'cancelled', 'trialing']);

// Helpers
const timestamps = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()), // Changed to $onUpdateFn for standard Next.js Date setup
};

// Users & Identity
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique(),
  username: varchar('username', { length: 50 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 255 }),
  ...timestamps
});

export const identityProviders = pgTable('identity_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(), // google, microsoft, sso
  providerSubject: varchar('provider_subject', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('provider_subject_idx').on(table.provider, table.providerSubject)
]);

export const webauthnCredentials = pgTable('webauthn_credentials', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  publicKey: text('public_key').notNull(),
  signCount: integer('sign_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(), // Opaque random hex token
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Tenancy & Organization
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  businessType: businessTypeEnum('business_type').notNull(),
  settings: jsonb('settings').default({}),
  timezone: varchar('timezone', { length: 50 }).notNull().default('UTC'),
  ...timestamps
});

export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  isArchived: boolean('is_archived').notNull().default(false),
  ...timestamps
}, (table) => [
  index('locations_account_idx').on(table.accountId)
]);

export const userAccountRoles = pgTable('user_account_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  role: roleEnum('role').notNull(),
  ...timestamps
}, (table) => [
  index('uar_account_idx').on(table.accountId, table.userId),
  uniqueIndex('uar_account_user_unique').on(table.accountId, table.userId)
]);

export const userLocationAccess = pgTable('user_location_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }), // Denormalized for RLS
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('ula_account_location_idx').on(table.accountId, table.locationId, table.userId),
  uniqueIndex('ula_location_user_unique').on(table.locationId, table.userId)
]);

// CRM & Suppliers
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  notes: text('notes'),
  isArchived: boolean('is_archived').notNull().default(false),
  ...timestamps
}, (table) => [
  index('customers_account_idx').on(table.accountId)
]);

export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  contactInfo: text('contact_info'),
  isArchived: boolean('is_archived').notNull().default(false),
  ...timestamps
}, (table) => [
  index('suppliers_account_idx').on(table.accountId)
]);

// Offerings (Goods & Services)
export const offerings = pgTable('offerings', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 255 }),
  itemType: itemTypeEnum('item_type').notNull(),
  tracksStock: boolean('tracks_stock').notNull().default(false),
  unit: varchar('unit', { length: 50 }),
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  costCents: integer('cost_cents').notNull().default(0),
  priceCents: integer('price_cents').notNull().default(0),
  currentStock: integer('current_stock').notNull().default(0),
  reorderThreshold: integer('reorder_threshold').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps
}, (table) => [
  index('offerings_account_idx').on(table.accountId),
  check('cost_cents_positive', sql`${table.costCents} >= 0`),
  check('price_cents_positive', sql`${table.priceCents} >= 0`)
]);

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'restrict' }),
  offeringId: uuid('offering_id').notNull().references(() => offerings.id, { onDelete: 'restrict' }),
  quantityChange: integer('quantity_change').notNull(),
  reason: varchar('reason', { length: 255 }).notNull(),
  transactionId: uuid('transaction_id'), // can't reference immediately if transactions table is below, so we leave it without FK or add it later. It will just be a UUID column.
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('stock_movements_account_loc_idx').on(table.accountId, table.locationId),
  index('stock_movements_offering_idx').on(table.offeringId),
]);

// Transactions
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'restrict' }),
  transactionType: transactionTypeEnum('transaction_type').notNull(),
  totalCents: integer('total_cents').notNull(),
  discountCents: integer('discount_cents').notNull().default(0),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('transactions_account_loc_idx').on(table.accountId, table.locationId),
  check('total_cents_positive', sql`${table.totalCents} >= 0`),
  check('discount_cents_positive', sql`${table.discountCents} >= 0`)
]);

export const transactionLines = pgTable('transaction_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  transactionId: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  offeringId: uuid('offering_id').notNull().references(() => offerings.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  unitCostAtTimeOfSaleCents: integer('unit_cost_at_time_of_sale_cents'),
  discountCents: integer('discount_cents').notNull().default(0),
  lineTotalCents: integer('line_total_cents').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('txlines_account_tx_idx').on(table.accountId, table.transactionId),
  check('quantity_positive', sql`${table.quantity} > 0`),
  check('unit_price_cents_positive', sql`${table.unitPriceCents} >= 0`),
  check('line_total_cents_positive', sql`${table.lineTotalCents} >= 0`),
  check('discount_cents_positive', sql`${table.discountCents} >= 0`)
]);

// Debts
export const debts = pgTable('debts', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'restrict' }),
  transactionId: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'restrict' }),
  amountCents: integer('amount_cents').notNull(),
  remainingCents: integer('remaining_cents').notNull(),
  status: debtStatusEnum('status').notNull(),
  dateIncurred: timestamp('date_incurred').notNull().defaultNow(),
  ...timestamps
}, (table) => [
  index('debts_account_customer_idx').on(table.accountId, table.customerId),
  check('amount_cents_positive', sql`${table.amountCents} >= 0`),
  check('remaining_cents_positive', sql`${table.remainingCents} >= 0`)
]);

export const debtPayments = pgTable('debt_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  debtId: uuid('debt_id').notNull().references(() => debts.id, { onDelete: 'cascade' }),
  amountCents: integer('amount_cents').notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('debt_payments_account_debt_idx').on(table.accountId, table.debtId),
  check('payment_amount_positive', sql`${table.amountCents} > 0`)
]);

// Background Jobs
export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }), // Nullable for system jobs
  type: varchar('type', { length: 255 }).notNull(),
  payload: jsonb('payload').notNull(),
  status: jobStatusEnum('status').notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  ...timestamps
}, (table) => [
  index('jobs_account_idx').on(table.accountId)
]);

// Insights
export const dailySummaries = pgTable('daily_summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }), // Nullable for account-wide
  date: date('date').notNull(),
  revenueCents: integer('revenue_cents').notNull().default(0),
  transactionCount: integer('transaction_count').notNull().default(0),
  salesCount: integer('sales_count').notNull().default(0),
  serviceCount: integer('service_count').notNull().default(0),
  lowStockCount: integer('low_stock_count').notNull().default(0),
  ...timestamps
}, (table) => [
  index('summaries_account_loc_date_idx').on(table.accountId, table.locationId, table.date)
]);

// Billing
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  provider: billingProviderEnum('provider').notNull(),
  providerSubscriptionId: text('provider_subscription_id'),
  planName: text('plan_name'),
  status: subscriptionStatusEnum('status').notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  ...timestamps
}, (table) => [
  index('subscriptions_account_idx').on(table.accountId)
]);

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 255 }).notNull(),
  entityId: varchar('entity_id', { length: 255 }),
  details: jsonb('details').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('audit_logs_account_idx').on(table.accountId),
]);

// ----------------------------------------------------------------------------
// Insights & Alerts Engine
// ----------------------------------------------------------------------------

export const analyticsDirtyScopes = pgTable('analytics_dirty_scopes', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }),
  businessDate: date('business_date').notNull(),
  metricFamiliesDirty: jsonb('metric_families_dirty').notNull().default([]), // string[]
  offeringIdsChanged: jsonb('offering_ids_changed').notNull().default([]), // string[]
  customerIdsChanged: jsonb('customer_ids_changed').notNull().default([]),
  supplierIdsChanged: jsonb('supplier_ids_changed').notNull().default([]),
  sourceEventWatermark: timestamp('source_event_watermark').notNull().defaultNow(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  nextRunAt: timestamp('next_run_at').notNull().defaultNow(),
  attempts: integer('attempts').notNull().default(0),
  ...timestamps
}, (table) => [
  index('dirty_scopes_account_status_idx').on(table.accountId, table.status, table.nextRunAt)
]);

export const analyticsDailyAccount = pgTable('analytics_daily_account', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  businessDate: date('business_date').notNull(),
  revenueCents: integer('revenue_cents').notNull().default(0),
  cogsCents: integer('cogs_cents').notNull().default(0),
  grossProfitCents: integer('gross_profit_cents').notNull().default(0),
  transactionCount: integer('transaction_count').notNull().default(0),
  customerCount: integer('customer_count').notNull().default(0),
  creditSalesCents: integer('credit_sales_cents').notNull().default(0),
  discountCents: integer('discount_cents').notNull().default(0),
  formulaVersion: integer('formula_version').notNull().default(1),
  ...timestamps
}, (table) => [
  uniqueIndex('daily_account_date_idx').on(table.accountId, table.businessDate)
]);

export const analyticsDailyLocation = pgTable('analytics_daily_location', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  businessDate: date('business_date').notNull(),
  revenueCents: integer('revenue_cents').notNull().default(0),
  cogsCents: integer('cogs_cents').notNull().default(0),
  grossProfitCents: integer('gross_profit_cents').notNull().default(0),
  transactionCount: integer('transaction_count').notNull().default(0),
  formulaVersion: integer('formula_version').notNull().default(1),
  ...timestamps
}, (table) => [
  uniqueIndex('daily_location_date_idx').on(table.locationId, table.businessDate)
]);

export const analyticsDailyOffering = pgTable('analytics_daily_offering', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }),
  offeringId: uuid('offering_id').notNull().references(() => offerings.id, { onDelete: 'cascade' }),
  businessDate: date('business_date').notNull(),
  quantitySold: integer('quantity_sold').notNull().default(0),
  revenueCents: integer('revenue_cents').notNull().default(0),
  cogsCents: integer('cogs_cents').notNull().default(0),
  grossProfitCents: integer('gross_profit_cents').notNull().default(0),
  discountCents: integer('discount_cents').notNull().default(0),
  priceObservationCount: integer('price_observation_count').notNull().default(0),
  sumPrice: integer('sum_price').notNull().default(0),
  formulaVersion: integer('formula_version').notNull().default(1),
  ...timestamps
}, (table) => [
  uniqueIndex('daily_offering_date_idx').on(table.locationId, table.offeringId, table.businessDate)
]);

export const analyticsDailyCustomer = pgTable('analytics_daily_customer', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  businessDate: date('business_date').notNull(),
  revenueCents: integer('revenue_cents').notNull().default(0),
  transactionCount: integer('transaction_count').notNull().default(0),
  creditSalesCents: integer('credit_sales_cents').notNull().default(0),
  formulaVersion: integer('formula_version').notNull().default(1),
  ...timestamps
}, (table) => [
  uniqueIndex('daily_customer_date_idx').on(table.customerId, table.businessDate)
]);

export const analyticsDailySupplier = pgTable('analytics_daily_supplier', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  businessDate: date('business_date').notNull(),
  purchaseVolumeCents: integer('purchase_volume_cents').notNull().default(0),
  formulaVersion: integer('formula_version').notNull().default(1),
  ...timestamps
}, (table) => [
  uniqueIndex('daily_supplier_date_idx').on(table.supplierId, table.businessDate)
]);

export const analyticsInventoryDaily = pgTable('analytics_inventory_daily', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }),
  offeringId: uuid('offering_id').notNull().references(() => offerings.id, { onDelete: 'cascade' }),
  businessDate: date('business_date').notNull(),
  openingStock: integer('opening_stock').notNull().default(0),
  closingStock: integer('closing_stock').notNull().default(0),
  stockValueCents: integer('stock_value_cents').notNull().default(0),
  formulaVersion: integer('formula_version').notNull().default(1),
  ...timestamps
}, (table) => [
  uniqueIndex('daily_inventory_date_idx').on(table.locationId, table.offeringId, table.businessDate)
]);

export const analyticsMetricSnapshots = pgTable('analytics_metric_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }),
  offeringId: uuid('offering_id').references(() => offerings.id, { onDelete: 'cascade' }),
  metricKey: varchar('metric_key', { length: 100 }).notNull(),
  periodKey: varchar('period_key', { length: 50 }).notNull(),
  value: jsonb('value').notNull(), 
  sufficiencyStatus: varchar('sufficiency_status', { length: 50 }).notNull().default('computed'),
  formulaVersion: integer('formula_version').notNull().default(1),
  computedAt: timestamp('computed_at').notNull().defaultNow(),
  sourceWatermark: timestamp('source_watermark').notNull(),
  ...timestamps
}, (table) => [
  uniqueIndex('metric_snapshots_unique_idx').on(table.accountId, table.locationId, table.offeringId, table.metricKey, table.periodKey)
]);

export const analyticsAlerts = pgTable('analytics_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }),
  offeringId: uuid('offering_id').references(() => offerings.id, { onDelete: 'cascade' }),
  metricKey: varchar('metric_key', { length: 100 }).notNull(),
  comparisonKey: varchar('comparison_key', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), 
  severity: varchar('severity', { length: 50 }).notNull(),
  computedValue: jsonb('computed_value').notNull(),
  baselineValue: jsonb('baseline_value'),
  triggerType: varchar('trigger_type', { length: 50 }),
  firstFiredAt: timestamp('first_fired_at').notNull().defaultNow(),
  lastFiredAt: timestamp('last_fired_at').notNull().defaultNow(),
  consecutivePeriods: integer('consecutive_periods').notNull().default(1),
  formulaVersion: integer('formula_version').notNull().default(1),
  computationRunId: uuid('computation_run_id'),
  ...timestamps
}, (table) => [
  uniqueIndex('alerts_unique_idx').on(table.accountId, table.locationId, table.offeringId, table.metricKey, table.comparisonKey).where(sql`${table.status} IN ('active', 'candidate')`)
]);

export const analyticsComputationRuns = pgTable('analytics_computation_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  jobType: varchar('job_type', { length: 100 }).notNull(),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  status: varchar('status', { length: 50 }).notNull(), // success, failed
  rowsRead: integer('rows_read').default(0),
  rowsWritten: integer('rows_written').default(0),
  errorDetails: text('error_details'),
  watermark: timestamp('watermark'),
  formulaVersion: integer('formula_version').notNull().default(1)
});
