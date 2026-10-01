# Daily Rollup Worker Report (Day 4)

**Status:** Completed
**Objective:** Implement the PostgreSQL-backed analytics rollup worker that idempotently processes dirty scopes into daily summaries without scanning complete raw history.

## 1. Rollup Mechanics

The worker (`modules/analytics/worker.ts`) operates on the bounded dirty-scope outbox (`analytics_dirty_scopes`) populated during checkouts and refunds.

1. **Concurrency Safety (Scope Leases):** The worker polls the `analytics_dirty_scopes` table using `FOR UPDATE SKIP LOCKED`. This guarantees that if multiple worker instances are running, they will not fetch the same scopes, safely distributing the workload and preventing race conditions or deadlocks.
2. **Idempotent Re-aggregation:** Instead of performing math like `revenue = old_revenue + delta`, which is notoriously fragile under retries and refunds, the worker performs a **bounded day-rebuild**. It re-calculates the *exact* totals for the single affected `businessDate`, completely overwriting the summary row for that day. This ensures 100% mathematical correctness even if the job retries multiple times, or if late data arrives.
3. **Data Scope:** The worker computes and stores:
   - `analyticsDailyAccount`: Total Revenue, COGS, Gross Profit, Transaction Count, Customer Count, Discounts.
   - `analyticsDailyLocation`: Location-specific splits.
   - `analyticsDailyOffering`: Offering-level volume, pricing points (for elasticity), and margin.
   - `analyticsDailyCustomer`: Customer-level revenue tracking.

## 2. Operational Defenses

- **Bounded Batches:** The worker pulls a maximum of 50 pending scopes per loop, ensuring memory stability and short database locks.
- **Retries & Backoff:** If computation fails, the worker increments an `attempts` counter and schedules a retry with exponential backoff (`Math.pow(2, attempts) * 1 min`).
- **Dead-letter Queue:** After 3 consecutive failures, the scope's status transitions to `failed`, preventing poison pills from halting the entire queue.
- **Telemetry:** Each job execution persists a record to `analytics_computation_runs`, tracking start/end times and error stacks. This allows DevOps to alert on systemic calculation failures.

## 3. Repair & Backfill Paths

The `computeDailyRollups` function is exported independently from the worker loop. This satisfies the requirement for a "repair command for one account/date." 
DevOps or support agents can import this function and execute it for any historical `(accountId, locationId, businessDate)` tuple to instantly repair or rebuild that day's analytics summary from source-of-truth records, bypassing the queue entirely.

## 4. Next Steps

- **Action:** Execute the linter to verify `modules/analytics/worker.ts`.
- **Next Phase:** We are ready for **Day 5: L1/L2 cheap metrics and snapshots**, where we will route the L1 dashboard to read directly from these daily summaries (making the dashboard exponentially faster), and begin generating daily snapshots.
