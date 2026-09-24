import { getCurrentSession } from '@/modules/auth/session';
import { getTransactions } from '@/modules/transactions/queries';
import { TransactionsClient } from './transactions-client';
import { redirect } from 'next/navigation';
import { can } from '@/modules/rbac/can';

export default async function TransactionsPage() {
  const session = await getCurrentSession();
  if (!session || !session.accountId) {
    redirect('/sign-in');
  }

  const canRead = await can(session.userId, session.accountId, 'transactions:read');
  if (!canRead) {
    return <div className="p-10 text-red-500">You do not have permission to view transactions.</div>;
  }

  const canWrite = await can(session.userId, session.accountId, 'transactions:write');
  const txs = await getTransactions(session.accountId);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
        <p className="text-gray-500">View past sales and revenue events.</p>
      </div>
      
      <TransactionsClient transactions={txs} canWrite={canWrite} />
    </div>
  );
}
