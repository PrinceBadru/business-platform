# Analytics Hardening & Maintenance Report (Days 11-15)

**Status:** Completed
**Objective:** Fortify the Insights & Alerts Engine against long-term operational issues, data lifecycle bloat, notification delivery, and timezone accuracy.

## 1. Timezone-Aware Rollups
The daily rollups initially bucketed all transactions by UTC midnight (`DATE(timezone('UTC', ...))`). This meant a business operating in New York might see their 10 PM sales bleed into the next day's analytics. 
We updated `computeDailyRollups` to fetch the account's timezone from the `accounts` table and inject it into the `DATE(timezone(tz, ...))` SQL clause, ensuring midnight-to-midnight accuracy per tenant.

## 2. Notification Dispatching
The Alert State Machine was originally silent, only surfacing anomalies in the UI when the user logged in. 
We integrated a notification layer (`modules/analytics/notifications.ts`) that listens to state transitions. If an alert matures from `candidate` to `active` (e.g., a revenue drop that persists for 2 days), the engine now fires a dispatch to notify the account owner, bringing proactive value to the insights layer.

## 3. Data Retention & Pruning
Analytical data grows linearly every day. To prevent table bloat, we introduced `pruneOldAnalytics` in `modules/analytics/maintenance.ts`. 
This permits DevOps to safely bulk-delete `analytics_daily_*` rows older than a configurable retention period (e.g. 24 months) without breaking current rollups. If long-term trends are needed, the L3 forecasting engine could cache those independently.

## 4. Formula Version Migrations
If the mathematical definitions of our metrics change in the future (e.g., moving from an absolute MAD anomaly threshold to a percentage-based one), we need a safe upgrade path.
We implemented `forceFormulaMigration`, which:
1. Wipes all L1 metric snapshots.
2. Triggers a massive bounded repair backfill via `enqueueAnalyticsRepair`.
The UI gracefully degrades to "Updating..." while the worker catches up, ensuring the user doesn't see disjointed math.

## 5. Idempotent Refund Handling
We verified that the `processRefund` mutation correctly enqueues a dirty scope and natively interacts with our rollup aggregation logic. The worker treats refunded transactions as negative quantities/revenue, ensuring our gross profit and total revenue metrics perfectly match the ledger without requiring special handling branches.

**Conclusion:** The Insights & Alerts Engine is now fully hardened for scale, timezone boundaries, and proactive notifications.
