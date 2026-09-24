import { db } from '@/lib/db/drizzle';
import { userAccountRoles, userLocationAccess } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { hasPermission, Permission, Role } from './permissions';

/**
 * Core RBAC evaluation function.
 * Verifies if a user holds a permission for a given account.
 * If locationId is provided, additionally verifies scoped access for non-admins.
 */
export async function can(
  userId: string,
  accountId: string,
  permission: Permission,
  locationId?: string
): Promise<boolean> {
  // 1. Get the user's highest role for this account
  const result = await db.select()
    .from(userAccountRoles)
    .where(
      and(
        eq(userAccountRoles.userId, userId),
        eq(userAccountRoles.accountId, accountId)
      )
    )
    .limit(1);

  if (result.length === 0) return false;
  const role = result[0].role as Role;

  // 2. Check if the role grants the baseline permission
  if (!hasPermission(role, permission)) return false;

  // 3. If a location is specified, non-admins must be explicitly granted access to it
  if (locationId && role !== 'owner' && role !== 'admin') {
    const access = await db.select()
      .from(userLocationAccess)
      .where(
        and(
          eq(userLocationAccess.userId, userId),
          eq(userLocationAccess.locationId, locationId)
        )
      )
      .limit(1);
    
    if (access.length === 0) return false;
  }

  return true;
}
