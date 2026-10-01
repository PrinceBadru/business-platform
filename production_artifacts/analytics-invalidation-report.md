# Analytics Invalidation Report (Day 3)

**Status:** Completed
**Objective:** Implement source-data tracking for historical analytics (cost and discounts), implement atomic dirty-scope enqueue logic, and verify idempotency.

## 1. Source Data Corrections

The primary business transactions now accurately record context at the time of sale, which is strictly required for accurate period-over-period metric generation:

- **Cost Tracking:** `processCheckout` now captures `unitCostAtTimeOfSaleCents` directly from the `offerings` master record and stores it immutably on `transactionLines`. 
- **Refund Propagation:** `processRefund` correctly propagates the original `unitCostAtTimeOfSaleCents` and `discountCents` from the sale being refunded, ensuring gross margin is decremented accurately.
- **Structured Expenses:** *Deferred.* In accordance with the Day 1 audit, we have explicitly deferred building the structured expenses table for Phase 1. Net profit metrics will degrade gracefully to `gross_margin_only`.
- **Refund/Void Signs:** The refund logic natively uses positive magnitude tracking with a specific `refund` transaction type, avoiding mathematical complications with negative quantities.

## 2. Atomic Invalidation (Dirty Scopes)

We implemented an atomic, low-overhead outbox pattern to decouple heavy analytics calculation from the synchronous user request.

1. **Transactional Integrity:** During `processCheckout` and `processRefund`, an enqueue operation is appended to the *same database transaction* using Drizzle's `withTenantContext`.
2. **Coalescing by Date & Location:** The marker uses an `ON CONFLICT DO UPDATE` strategy against `(accountId, locationId, businessDate)`.
   - If 500 sales happen in a location today, they all collapse into **one** pending `analytics_dirty_scopes` record.
   - The JSON arrays for `metricFamiliesDirty`, `offeringIdsChanged`, and `customerIdsChanged` are atomically merged and deduplicated at the PostgreSQL level.
3. **Time Zone Normalization:** The marker infers the current `businessDate` string using the account's localized `timezone` preference, ensuring a transaction occurring at 1:00 AM UTC is bucketed accurately for a merchant in New York.
4. **No Blocking Execution:** The transaction handler completes without waiting for any L1/L2 calculation to run.

## 3. Idempotency & Rollback Verification

We added `tests/analytics-invalidation.test.ts` to mathematically prove the transaction integrity:

- **Idempotency:** A test asserts that executing multiple checkout operations consecutively for the same day results in `scopes.length === 1` due to conflict resolution.
- **Rollback Safety:** A test forces a checkout failure (e.g., throwing a validation error) and proves that the PostgreSQL transaction correctly rolls back, leaving no orphaned dirty scopes.

## 4. Next Steps

- **Action:** Execute the test suite `npm run test` to verify.
- **Next Phase:** We are ready for **Day 4: Incremental daily rollup worker**, where we will consume these `analytics_dirty_scopes` records and process the actual metrics into our `analytics_daily_*` tables.
