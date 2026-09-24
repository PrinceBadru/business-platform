# Day 31: Customer Management (CRM)

## Objective
Implement a secure, multi-tenant Customer Relationship Management (CRM) directory that allows users (Employees, Managers, Admins) to track and manage customer identities, contact info, and notes seamlessly within the application shell.

## Actions Completed
- **CRM Database Isolation:** Configured `/modules/crm/queries.ts` and `/modules/crm/mutations.ts` to explicitly route through `withTenantContext`. This physically guarantees that a cashier or manager can only view and manage customers belonging to their active business account.
- **Role-Based Guards:** The `createCustomer` and `archiveCustomer` Server Actions are guarded by the `transactions:write` permission. This deliberately aligns customer creation with checkout/sales capabilities, reflecting real-world point-of-sale operational needs.
- **Frontend Directory UI:** Scaffolded `/dashboard/customers` with live, client-side filtering by name and phone number. 
- **Optimistic Server Mutations:** Utilized Next.js Server Actions within a `useTransition` hook, allowing lightning-fast data submission with built-in loading states, immediately invalidating the cache and updating the UI upon success.
- **Sidebar Integration:** Mapped the "Customers" route into the global Navigation Shell utilizing Lucide's `Contact` icon.

## Next Action
With Customers actively flowing into the system, the platform is now fully equipped to track who is buying goods and services. 
The next logical progression is building the actual **Offerings, Suppliers, and Inventory Domain (Week 5)** to define *what* these customers are actually purchasing!
