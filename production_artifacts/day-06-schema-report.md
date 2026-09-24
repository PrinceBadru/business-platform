# Day 06: Core Schema Report

## Objective
Implement the Drizzle schema and initial migration for all core entities (accounts, locations, users, RBAC mappings, inventory, CRM, financial transactions, and jobs), complying with the architectural baseline.

## Actions Completed
- **Schema Creation:** Defined 16 robust entities in `lib/db/schema.ts` including UUIDs, timestamps with default triggers, enum types, and foreign key relations with deliberate delete behaviors.
- **Constraints applied:**
  - Standardized timestamps (`created_at`, `updated_at`).
  - Imposed `integer` for all monetary values (`cents`), safeguarded by `check` constraints ensuring positive/valid values.
  - Imposed `check` constraints for positive quantities (`quantity > 0`).
- **Indexing Rules Followed:** Every single composite index is strictly led by either `account_id` or `location_id` as specified by the architecture invariant.
- **Testing:** Implemented `tests/schema.test.ts` to verify entity exports and type integrity.
- **Migration Generation:** Generated the raw SQL migration file via `drizzle-kit generate`.

## Testing & Evidence
- ✅ Migration generated correctly with 16 tables.
- ✅ Vitest suite passed.
- ✅ TypeScript / Next.js Build passed completely green.

## Known Issues & Next Action
- **No RLS Yet:** The data model is physically complete, but PostgreSQL Row-Level Security (RLS) has deliberately not been applied yet to maintain clear migration boundaries.
- **Next Action (Day 7):** Implement transaction-scoped PostgreSQL RLS using `SET LOCAL app.current_account` and the `withTenantTx` wrapper.
