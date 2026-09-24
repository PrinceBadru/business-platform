# Day 28: Refunds & Cancellations

## Objective
Provide cashiers the ability to safely void or refund a transaction. This must negate the revenue internally while cleanly restoring physical stock to the inventory ledger.

## Actions Completed
- **Schema Adjustment (`/lib/db/schema.ts`):** Added the `refund` variant to the `transaction_type` Drizzle enum and pushed the mutation to PostgreSQL via `drizzle-kit push`.
- **Refund Engine (`/modules/transactions/mutations.ts`):** 
  - Exposes `processRefund` which acts defensively against double-refunding (preventing users from refunding a transaction that is already a refund).
  - Copies over the exact monetary amounts from the original header and lines into a new inverse transaction. (We keep monetary numbers positive because of the db constraint).
  - Iterates over all transaction lines and increments `currentStock` securely within the active transaction lock.
- **Analytics Sync (`/modules/analytics/queries.ts`):** Modified the raw SQL aggregations for Total Revenue and Type Split to intelligently detect `transactionType = 'refund'` and subtract the values from the global dashboard sums, keeping reporting 100% accurate.
- **Transaction UI (`/dashboard/transactions`):** 
  - Added a "Refund" action button to the ledger, protected by the `transactions:write` permission.
  - Refund transactions are explicitly highlighted in the UI with a red `Refund` badge and negative display strings.

## Next Action
Refunds are locked in. I will proceed to **Day 34: Configuration-Driven Behavior**.
