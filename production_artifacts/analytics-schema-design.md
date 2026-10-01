# Analytics Schema Design (Day 2)

**Status:** Completed
**Objective:** Design the analytics data contract, including daily rollups, metric snapshots, dirty scopes, and add required historical tracking fields to source tables.

## 1. Source Table Modifications

To support accurate historical margin analysis and timezone-aware daily aggregates, we modified the following existing source tables in `lib/db/schema.ts`:

- **`accounts`**: Added a `timezone` column (default `'UTC'`) to ensure end-of-day analytics logic is accurate for the specific tenant's physical location.
- **`transactions`**: Added `discount_cents` to track transaction-level reductions.
- **`transaction_lines`**: Added `unit_cost_at_time_of_sale_cents` to persist the exact cost of the offering when the transaction occurred, decoupling it from future `offerings.cost_cents` adjustments. We also added `discount_cents` here.

## 2. Analytics Engine Data Contract

We created a set of new tables explicitly for the Insights & Alerts Engine. These tables live in the same PostgreSQL database and use the same RLS isolation strategy via `accountId` and `locationId`.

### 2.1 Invalidation Marker (Dirty Scopes)
**`analytics_dirty_scopes`**
Acts as an outbox ledger for analytical jobs. A tiny enqueue marker will be placed here by the transaction request handler without blocking the user.
- **Uniqueness**: `(accountId, locationId, businessDate)` where `status = 'pending'` ensures coalescing of jobs. 100 transactions in the same day will produce only 1 pending analytics rollup job.
- **Structure**: Tracks `metricFamiliesDirty`, `offeringIdsChanged`, and `sourceEventWatermark`.

### 2.2 Incremental Daily Rollups
Instead of repeatedly calculating stats against raw transactions on page load, background workers will incrementally upsert summary rows per business day.

- **`analytics_daily_account`**: Stores account-wide `revenueCents`, `cogsCents`, `grossProfitCents`, `transactionCount`, `customerCount`.
- **`analytics_daily_location`**: Stores location-scoped financial metrics.
- **`analytics_daily_offering`**: Tracks `quantitySold`, `cogsCents`, `sumPrice`, and `priceObservationCount` (required inputs for price elasticity).
- **`analytics_daily_customer`**: Tracks LTV accumulation and transaction frequency.
- **`analytics_daily_supplier`**: Tracks purchasing volume against suppliers.
- **`analytics_inventory_daily`**: Records daily `openingStock`, `closingStock`, and `stockValueCents`.

### 2.3 Read Models (Dashboard Queries)
**`analytics_metric_snapshots`**
- Caches the result of computationally expensive metrics like Price Elasticity, HHI concentration, and Anomaly Baselines. 
- Serves the frontend directly. Exposes `sufficiencyStatus` (`computed`, `insufficient_data`) to degrade gracefully without re-calculating on every request.

**`analytics_alerts`**
- Manages the state machine for alerts (Candidate → Active → Resolved).
- Stores the `computedValue`, `baselineValue`, and tracks the streak (`consecutivePeriods`) to avoid alert flapping.

### 2.4 Diagnostics
**`analytics_computation_runs`**
- Tracks execution telemetry (start/end times, rows read/written, errors) for background workers to help tune memory usage and timeout bounds.

## 3. RLS & Tenancy 
- **Every table** forces a mandatory `account_id` foreign key.
- Summary tables that correspond to locations also enforce `location_id`.
- Rollup workers will utilize `withTenantContext` wrappers to ensure jobs isolated within an account context cannot cross-pollinate metrics.

## 4. Next Steps

- **Action:** Run `npm run db:generate` to produce the Drizzle SQL migration files.
- **Next Phase:** Proceed to **Day 3** to update the business transaction logic to persist `unit_cost_at_time_of_sale_cents` and emit `analytics_dirty_scopes` markers atomically during checkout.
