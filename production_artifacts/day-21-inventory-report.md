# Day 21: Offerings & Inventory Domain

## Objective
Implement the unified offerings domain mapping both physical Goods (which track stock) and pure Services. The catalog serves as the foundational data source for checking out customers and performing stock operations.

## Actions Completed
- **Inventory Queries & Mutations:** Created `modules/inventory/queries.ts` and `modules/inventory/mutations.ts`.
  - All DB requests are strictly bound to the `withTenantContext` execution sandbox.
  - Server Actions validate that money (cost and price) is parsed securely into integer cents and rejects negative numbers explicitly before writing to the database.
  - Guarded strictly by the `offerings:write` RBAC permission.
- **Unified Catalog UI:** Scaffolded `/dashboard/inventory` mapping the `item_type` explicitly between `good` and `service`. 
  - Real-time client search filters across the active catalog.
  - Utilizes Next.js `useTransition` for instantaneous, optimistic UI blocking during submission without manual API fetching.
  - Automatic `tracksStock` flag derivation based on item type.

## Next Action
With the Inventory (Offerings) established, the business is structurally prepared to manage items, pricing, and stock. 
The immediate next step (Day 22) would be **Suppliers**, or moving right into **Stock Movements** (Day 23) to allow adjusting those stock numbers.
