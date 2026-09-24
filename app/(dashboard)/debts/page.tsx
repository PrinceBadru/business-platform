import { getCurrentSession } from '@/modules/auth/session';
import { getDebts } from '@/modules/debts/queries';
import { DebtsClient } from './debts-client';
import { redirect } from 'next/navigation';
import { can } from '@/modules/rbac/can';

export default async function DebtsPage() {
  const session = await getCurrentSession();
  if (!session || !session.accountId) {
    redirect('/sign-in');
  }

  const canWrite = await can(session.userId, session.accountId, 'transactions:write');
  const debts = await getDebts(session.accountId);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Debts & Credit</h1>
        <p className="text-gray-500">Manage unpaid customer tabs and collect payments.</p>
      </div>
      
      <DebtsClient debts={debts} canWrite={canWrite} />
    </div>
  );
}
