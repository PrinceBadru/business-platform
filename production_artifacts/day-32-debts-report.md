# Day 32 & 33: Credit & Debts Module

## Objective
Implement a line-of-credit (Debts) system allowing cashiers to run "tabs" or delay payment collection for trusted customers, while accurately attributing the debt to a specific transaction and customer under the active business account.

## Actions Completed
- **Checkout POS Upgrade:** Modified `/modules/checkout/mutations.ts` and the POS Client to include a "Record as Credit (Tab)" button. If selected, a `debts` record is instantly generated alongside the transaction and stock deductions inside the same ACID boundary. (Prevents anonymous walk-in debts by strictly enforcing a `customerId` mapping).
- **Debt Resolution Endpoints (`/modules/debts/mutations.ts`):** 
  - Exposes `collectDebtPayment` Server Action, guarded by the `transactions:write` RBAC role.
  - Automatically calculates remaining balances safely in PostgreSQL logic. Prevents overpayment explicitly.
  - Switches the debt `status` to `paid_off` the moment `remainingCents` hits zero.
- **Debts UI (`/dashboard/debts`):** 
  - A fast tracker highlighting total incurred debt vs current remaining balance per customer.
  - Cashiers can rapidly type in an amount and click "Collect" to immediately log a payment without refreshing the page.

## Next Action
With Debts implemented, the platform has reached a state of deep maturity.

The next steps depend on your priorities:
- **Week 8 (Reporting):** Build financial dashboards, sales charts, and top-customer analytics.
- **End-to-End Tests:** Write Playwright E2E browser tests to solidify the core operations loops.
- **Supplier Directory:** Build the Supplier tracking from Day 22.
