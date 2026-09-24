import { users, userAccountRoles, userLocationAccess, locations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';

export async function getTeamMembers(accountId: string) {
  return withTenantContext(accountId, async (tx) => {
    // users table is global, but userAccountRoles is isolated by RLS.
    const roles = await tx.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: userAccountRoles.role,
    })
    .from(userAccountRoles)
    .innerJoin(users, eq(userAccountRoles.userId, users.id));

    // Get all location access for this account
    const accesses = await tx.select({
      userId: userLocationAccess.userId,
      locationId: userLocationAccess.locationId,
      locationName: locations.name
    })
    .from(userLocationAccess)
    .innerJoin(locations, eq(userLocationAccess.locationId, locations.id));

    return roles.map(member => ({
      ...member,
      locations: accesses.filter(a => a.userId === member.id)
    }));
  });
}
