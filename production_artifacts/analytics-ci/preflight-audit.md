# Analytics Scenario CI — Preflight Audit

This document serves as the Day 1 deliverable for the **Insights & Alerts Engine — AI-Driven Scenario Testing and CI/CD Pipeline**. It documents the existing state of the Nexus Finance repository and proposes the exact architectural additions needed to implement the deterministic scenario laboratory.

## 1. Current Test Architecture
- **Unit & Integration:** Vitest (`tests/` directory). Tests rely on local SQLite or a shared PostgreSQL database.
- **End-to-End (E2E):** Playwright (`e2e/` directory), covering authentication, basic routing, and dashboard interactions.
- **Database Lifecycle:** Managed via `drizzle-kit` and Node scripts (`npm run db:migrate`, `npm run db:seed`).
- **CI/CD Pipeline:** Currently missing or incomplete. No active GitHub Actions workflows exist in `.github/workflows/` to automatically run tests or provision test databases on pull requests.

## 2. Existing Commands and Conventions
- **Development Server:** `npm run dev`
- **Testing:** `npm run test` (Vitest), `npx playwright test`
- **Database Operations:** `npm run db:migrate`, `npm run db:seed`, `npm run db:generate`
- **Conventions:** The project strongly enforces server-side actions, separation of concerns (via the `modules/` directory), and explicit UI boundaries (`app/`).

## 3. Source-of-Truth Tables
The analytics engine reads from the following core transactional tables:
- `transactions` and `transaction_lines` (Revenue, Discounts, Sales volume)
- `offerings` (Current Stock, Reorder Thresholds, Current Cost/Price)
- `customers` and `suppliers` (Concentration, Demographics)
- `debts` and `debt_payments` (Outstanding credit, DSO calculation base)
- `stock_movements` (Inventory flow over time)
- `locations` and `accounts` (Hierarchy and rollups)

## 4. Available Business Fields
Currently implemented fields that support the insights engine:
- **`transaction_lines.unitCostAtTimeOfSaleCents`**: Critical for accurate historical gross margin calculations (present).
- **`offerings.tracksStock`**: Determines if the engine should apply inventory analysis or skip it (services) (present).
- **`offerings.reorderThreshold`**: Required for low stock action alerts (present).
- **`accounts.businessType`**: Retail, Services, or Hybrid (present).

## 5. Missing Fields Required by Scenarios
To satisfy all required test scenarios (specifically Scenarios A, B, H, and I), the following schema additions are required:
1. **Operating Expenses (OPEX):** There is currently no `expenses` table. Computing net profit, net margin, and break-even points (Scenarios A and B) requires a structured recurring/variable expense model.
2. **Supplier Lead Times:** Scenario H requires `leadTimeDays` on either the `suppliers` or `offerings` table to compute safety stock and stock risk.
3. **Supplier Payment Terms / DPO:** Scenario I requires payment terms (e.g., `paymentTermsDays`) to accurately calculate Days Payable Outstanding (DPO) and the full Cash Conversion Cycle (CCC).
4. **Order / Holding Costs:** Required for Economic Order Quantity (EOQ) calculations, though graceful degradation to `missing_input` is acceptable.

## 6. Proposed Scenario and Oracle Structure
- **Location:** `analytics-lab/scenarios/`
- **Scenario Definition:** TypeScript objects exporting fixed parameters (`AnalyticsScenario`), utilizing a deterministic time clock (`ANALYTICS_TEST_CLOCK`).
- **Independent Oracle:** A standalone `truth-calculator.ts` that relies strictly on pure math and the in-memory scenario definition. It will not import any Drizzle queries or production metric services to prevent circular validation.
- **Manifests:** Generated expected values stored in `analytics-lab/scenarios/manifests/` to freeze the expected truth for the AI repair loop.

## 7. Proposed CI Jobs
1. **`analytics-ci.yml`**: Triggers on PR and push to `main`. Spins up a transient PostgreSQL container, migrates it, seeds it via `scripts/ci-seed-scenarios.ts`, triggers the async worker, waits for the watermark, and compares against the Oracle.
2. **`analytics-nightly.yml`**: A longer-running test suite executing high-volume performance limits, crash recovery tests, and long time-series data without delaying the standard PR loop.
3. **`analytics-repair.yml`**: An isolated workflow triggered upon deterministic CI failure to kick off the Antigravity AI repair loop.

## 8. Security and Performance Risks
- **Tenant Isolation (RLS):** Analytics tables (`analytics_metric_snapshots`, `analytics_daily_offering`, etc.) must rigorously enforce RLS or application-level boundaries. If an account ID is missing or misapplied in the worker, cross-tenant leaks will occur.
- **Queue Deadlocks/Starvation:** Heavy rollups on large accounts could starve smaller accounts if the background worker queue lacks fairness or chunking.
- **Synchronous Overhead:** The system currently relies on the worker. Any accidental shift of L2/L3 calculations into the HTTP request path to "fix" a test will severely degrade user experience.
- **Deterministic Time:** If the worker relies on `new Date()` internally instead of an injected clock, CI runs will become flaky at midnight UTC.

## 9. Exact Files to Create or Modify
**To Create:**
- `analytics-lab/` directory and entire sub-structure (catalog, fixtures, truth calculator, assertions).
- `scripts/` additions for CI hooks (`ci-seed-scenarios.ts`, `ci-collect-evidence.ts`).
- `.github/workflows/analytics-ci.yml`.

**To Modify:**
- `lib/db/schema.ts` (Add `expenses`, `suppliers.leadTimeDays`, `suppliers.paymentTermsDays`).
- `modules/analytics/worker.ts` and `modules/analytics/alerts.ts` (Implement dependency injection for the current date/time to support the deterministic clock).

## 10. Decisions Requiring Human Approval
1. **Schema Changes:** Do we want to introduce a full `expenses` table now, or should we simulate OPEX via a mock API or settings JSON for the purpose of the MVP scenarios?
2. **AI Merge Policy:** Confirm that the AI repair loop is restricted from auto-merging PRs or deploying code, and is strictly isolated to branch creation and artifact generation.
3. **Materiality Thresholds:** Determine the exact financial threshold that classifies a business as "healthy" versus "loss-making" to encode into the Oracle.
