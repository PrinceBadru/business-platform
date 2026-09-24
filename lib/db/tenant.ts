import { db } from './drizzle';
import { sql } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import type { ExtractTablesWithRelations } from 'drizzle-orm';

// Defining the exact transaction type to ensure strict type checking
type Transaction = PgTransaction<PostgresJsQueryResultHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>;

/**
 * Wraps database operations in a transaction and applies Row-Level Security
 * by setting a transaction-scoped local configuration variable.
 * 
 * IMPORTANT: Because this uses `SET LOCAL`, the variable is strictly scoped
 * to the PostgreSQL transaction. When the transaction commits or rolls back,
 * the setting is cleared automatically. This prevents tenant leakage across
 * connection pools.
 * 
 * @param accountId The UUID of the authenticated tenant.
 * @param callback The database operations to execute within the RLS-isolated transaction.
 */
export async function withTenantContext<T>(
  accountId: string,
  callback: (tx: Transaction) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    // Inject the tenant context into the PostgreSQL session locally.
    // The RLS policies will read this via current_setting('app.current_account').
    // Using set_config allows safe parameterization. The 'true' argument makes it local to the transaction.
    await tx.execute(sql`
      SELECT set_config('app.current_account', ${accountId}, true);
    `);

    // Execute the user's business logic
    return callback(tx as any);
  });
}
