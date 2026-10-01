# Analytics Preflight Audit (Day 1)

**Status:** Completed
**Objective:** Inspect current repository, identify data gaps, map source of truth, and plan schema changes for the Insights & Alerts Engine.

## 1. Source-of-Truth Map

The business-management application currently manages state in the following primary tables (with RLS isolation through `accountId` and `locationId`):

- **Sales & Revenue:** `transactions` (header) and `transaction_lines` (details).
- **Inventory & Stock:** `offerings` (current state) and `stock_movements` (append-only ledger).
- **Credit & Debt:** `debts` and `debt_payments`.
- **Entities:** `customers` and `suppliers`.
- **Tenancy:** `accounts`, `locations`, `users`, `user_account_roles`, and `sessions`.
- **Jobs:** Basic custom `jobs` table exists.

## 2. Required-Input Gap Matrix

We audited the schema against the requirements of the new insights and alerts engine.

| Required Input | Current Status | Notes |
|---|---|---|
| `unit_cost_at_time_of_sale` | ❌ **Missing** | `transaction_lines` stores `unitPriceCents`, but relies on current `offerings.costCents` for cost. Historical COGS will be inaccurate without this. |
| Line-level discounts | ❌ **Missing** | No discount tracking in transactions. |
| Returns, refunds, voids | ⚠️ **Partial** | `transactionType` enum includes `refund`, and the refund mutation handles them gracefully with positive values. `voids` and cancellations are missing. |
| Payment status / credit sales | ✅ **Available** | Captured securely in `debts` and `debt_payments`. |
| Stock movements ledger | ✅ **Available** | `stock_movements` is append-only and timestamped. |
| Supplier lead times / PO history | ❌ **Missing** | Not tracked in `suppliers` or `offerings`. POs don't exist yet. |
| Structured OPEX / Expenses | ❌ **Missing** | No expense tracking. Net profit and break-even metrics cannot be reliably calculated and must degrade to `gross_margin_only`. |
| Supplier payment terms & AP | ❌ **Missing** | No AP ledger. DPO and CCC metrics must degrade gracefully. |
| Account / Location Time Zones | ❌ **Missing** | `accounts.settings` exists as JSONB, but no explicit timezone column for reliable daily windowing. |
| Job Queue (`pg-boss`) | ❌ **Missing** | `pg-boss` is not in `package.json`. There is a custom `jobs` table, but it may lack robust deduplication, concurrency control, and retries. |

## 3. Performance Risks & Current Anti-patterns

- **In-Request Analytics:** The current L1 dashboard (`app/(dashboard)/dashboard/page.tsx`) computes `SUM` and `COUNT` over all raw `transactions` and `transaction_lines` synchronously on every page render. As history grows, this will degrade application latency heavily.
- **Missing Invalidation Marker:** Checkout mutations (`modules/checkout/mutations.ts`) execute database updates atomically but do not emit "dirty scope" markers for asynchronous processing.
- **Queueing Engine:** The absence of `pg-boss` means there's no built-in coalescing of duplicate jobs (e.g., grouping 50 transactions on the same day into one rollup job).

## 4. Schema Changes (Day 2 Preparation)

Before any analytics logic is implemented, the following schema migrations are necessary:

1. **Transaction Completeness:**
   - Add `unit_cost_at_time_of_sale_cents` to `transaction_lines`.
2. **Business Requirements:**
   - Create an `expenses` table for structured OPEX if required in Phase 1 (otherwise, net margin will degrade gracefully).
   - Add `timezone` to `accounts`.
3. **Analytics Infrastructure:**
   - Create analytics invalidation/dirty-scope table (`analytics_dirty_scopes`) or configure `pg-boss` for coalesced work queues.
   - Define daily rollup tables (`analytics_daily_account`, `analytics_daily_location`, `analytics_daily_offering`, etc.) and snapshot tables (`analytics_metric_snapshot`, `analytics_alert`) ensuring strict RLS isolation.

## 5. Exact Next Steps

1. **Confirm Strategy with Product/Engineering:** Decide whether to implement the `expenses` table immediately or degrade net profit metrics for now. Determine whether to install `pg-boss` or adapt the current `jobs` table for deduplication and coalescing.
2. **Execute Day 2:** Design the analytics data contract and daily rollup summaries (without raw array storage) and generate the Drizzle migrations.
3. **Execute Day 3:** Update the `processCheckout` and `processRefund` mutations to populate `unit_cost_at_time_of_sale_cents` and emit tiny post-commit enqueue markers.
