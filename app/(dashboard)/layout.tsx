import { ReactNode } from 'react';
import { getCurrentSession } from '@/modules/auth/session';
import { db } from '@/lib/db/drizzle';
import { accounts, userAccountRoles, users, userLocationAccess, locations } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // 1. Authenticate Request
  const session = await getCurrentSession();
  if (!session) {
    redirect('/sign-in');
  }

  // 2. Load User Context
  const userRoles = await db.select().from(userAccountRoles).where(eq(userAccountRoles.userId, session.userId));
  const accountIds = userRoles.map(r => r.accountId);
  
  let userAccounts: typeof accounts.$inferSelect[] = [];
  if (accountIds.length > 0) {
    userAccounts = await db.select().from(accounts).where(inArray(accounts.id, accountIds));
  }

  const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, session.userId)).limit(1);

  // 3. Resolve Active Tenant — redirect new users to onboarding
  if (accountIds.length === 0) {
    redirect('/onboarding');
  }

  const activeAccountId = session.accountId || accountIds[0] || null;
  const activeRole = userRoles.find(r => r.accountId === activeAccountId)?.role || 'employee';

  // 4. Load Locations for Active Account
  let userLocations: { id: string; name: string }[] = [];
  if (activeAccountId) {
    const access = await db
      .select({
        id: locations.id,
        name: locations.name,
      })
      .from(userLocationAccess)
      .innerJoin(locations, eq(locations.id, userLocationAccess.locationId))
      .where(
        and(
          eq(userLocationAccess.userId, session.userId),
          eq(userLocationAccess.accountId, activeAccountId)
        )
      );
    userLocations = access;
  }

  // 5. Fallback location
  const activeLocationId = session.locationId || (userLocations.length > 0 ? userLocations[0].id : null);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      <Sidebar 
        accounts={userAccounts} 
        activeAccountId={activeAccountId} 
        activeRole={activeRole}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          userName={user?.name ?? undefined} 
          locations={userLocations}
          activeLocationId={activeLocationId}
          activeRole={activeRole}
        />
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
