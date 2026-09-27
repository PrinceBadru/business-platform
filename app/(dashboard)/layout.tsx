import { ReactNode } from 'react';
import { getCurrentSession } from '@/modules/auth/session';
import { db } from '@/lib/db/drizzle';
import { accounts, userAccountRoles, users } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      <Sidebar 
        accounts={userAccounts} 
        activeAccountId={activeAccountId} 
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Topbar userName={user?.name ?? undefined} />
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
