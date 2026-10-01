# Cheap Metrics & Snapshots Report (Day 5)

**Status:** Completed
**Objective:** Replace slow real-time aggregations on the dashboard with pre-calculated, fast L1/L2 metric snapshots. Expose clear metadata about the data's freshness and limitations.

## 1. Snapshot Architecture

We implemented a read-model pattern for the dashboard using `analytics_metric_snapshots`.

- **Decoupling from Source:** The `getDashboardMetrics` query (in `modules/analytics/queries.ts`) no longer scans `transactions` or `transactionLines` (except for the 5 most recent transactions log). Instead, it maps directly to `analyticsMetricSnapshots`, which is 1 row per metric per account.
- **Snapshot Generator:** Added `computeL1Snapshots` inside `modules/analytics/snapshots.ts`. This routine aggregates the 1-row-per-day records from `analytics_daily_account` and `analytics_daily_offering`, calculating `gross_margin`, `markup`, `total_revenue`, and `total_cogs`.
- **Integration:** The worker automatically triggers the snapshot generation immediately after processing a batch of daily rollups, keeping the read replicas perfectly in sync with the rollups.

## 2. Sufficiency & Limitations

As specified in the Day 1 audit, we deferred structured OPEX tracking. The system correctly identifies this limitation:
- `net_profit` is explicitly stored with `sufficiencyStatus: 'missing_input'` because structured expenses are unavailable.
- `debt_aging` degrades to `insufficient_data` if no outstanding debts exist to average.

## 3. Freshness Transparency

Data latency is clearly communicated to the merchant on the dashboard (`app/(dashboard)/dashboard/page.tsx`):

- **Fresh:** Indicates that all source data has been successfully rolled up. Shows the `formulaVersion` and `computedAt` timestamp.
- **Updating:** By checking `analytics_dirty_scopes` for any pending jobs, the dashboard detects when transactions have occurred but haven't been rolled up yet. It displays a spinning "Updating..." badge to set expectations.
- **Waiting for Data:** Displayed for brand new accounts that lack even an initial snapshot.

## 4. Testing

We added `tests/snapshots.test.ts` to assert that:
1. Empty rollups correctly propagate to 0-value snapshots.
2. The presence of a `pending` scope correctly flips the freshness metadata to `updating`.

## 5. Next Steps

- **Action:** Execute `npm run test` or manually verify the Next.js UI.
- **Next Phase:** We are ready for **Day 6: State-Machine Alerts Engine**. We will create scheduled jobs that run anomaly detection queries against these daily tables and generate threshold alerts.
