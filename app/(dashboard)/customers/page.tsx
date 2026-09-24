import { getCurrentSession } from '@/modules/auth/session';
import { getCustomers } from '@/modules/crm/queries';
import { CustomersClient } from './customers-client';
import { redirect } from 'next/navigation';
import { can } from '@/modules/rbac/can';

export default async function CustomersPage() {
  const session = await getCurrentSession();
  if (!session || !session.accountId) {
    redirect('/sign-in');
  }

  // Pre-evaluate write rights so we can disable/hide forms if necessary
  const canWrite = await can(session.userId, session.accountId, 'transactions:write');
  const allCustomers = await getCustomers(session.accountId);
  const activeCustomers = allCustomers.filter(c => !c.isArchived);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-gray-500">Manage your customer relationships and contact history.</p>
      </div>

      <CustomersClient customers={activeCustomers} canWrite={canWrite} />
    </div>
  );
}
