# Day 26 & Day 27: Checkout UI and Transaction Domain

## Objective
Implement a fully functional Point of Sale (POS) interface and a secure, server-side transaction engine that tracks sales and updates inventory stock atomically under strict RLS isolation.

## Actions Completed
- **Transaction Engine (`/modules/checkout/mutations.ts`):** 
  - Client-submitted prices are completely ignored to prevent tampering. The server fetches the exact price of every catalog item directly from the DB at the exact moment of checkout.
  - Transactions, Transaction Lines, and Stock Deductions are executed synchronously inside a single Drizzle database transaction.
  - If a physical good has insufficient stock, the transaction explicitly aborts and rolls back.
- **POS Interface (`/dashboard/checkout`):** 
  - A fast, reactive Point of Sale UI that leverages Shadcn cards. 
  - Cashiers can quickly add catalog items to a cart, adjust quantities, select walk-in or returning customers, and assign the transaction to a physical location.
  - The UI uses `useTransition` for instantaneous submission and relies on Next.js Server Actions rather than manual API calls.
- **Security Check:** Access to the Point of Sale is completely locked down by checking for the `transactions:write` permission on the Server Page load.

## Next Action
With Customers, Inventory, and POS Checkout running flawlessly, a business can officially run on this platform!

The next phase revolves around visibility. **Day 29 (Transaction History)** is perfect for building the ledger to view past sales, followed quickly by **Week 7 (Debts & Credit)** for managing unpaid tabs.
