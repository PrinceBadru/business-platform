import { getCurrentSession } from '@/modules/auth/session';
import { db } from '@/lib/db/drizzle';
import { locations, userAccountRoles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import LocationsClient from './locations-client';

export default async function LocationsPage() {
  const session = await getCurrentSession();
  if (!session?.accountId) redirect('/sign-in');

  // Check role — only owners/admins can create/archive locations
  const [role] = await db
    .select()
    .from(userAccountRoles)
    .where(
      and(
        eq(userAccountRoles.userId, session.userId),
        eq(userAccountRoles.accountId, session.accountId)
      )
    )
    .limit(1);

  const canManage = role?.role === 'owner' || role?.role === 'admin';

  // Load all locations for this account
  const accountLocations = await db
    .select()
    .from(locations)
    .where(eq(locations.accountId, session.accountId));

  return (
    <LocationsClient
      locations={accountLocations}
      canManage={canManage}
      activeLocationId={session.locationId ?? null}
    />
  );
}
