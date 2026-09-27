import { db } from '@/lib/db/drizzle';
import { auditLogs, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requirePermission } from '@/modules/rbac/guard';

export async function getRecentActivity(accountId: string, limit: number = 50) {
  return requirePermission('dashboard:read')(async () => {
    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        }
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.accountId, accountId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    return logs;
  });
}
