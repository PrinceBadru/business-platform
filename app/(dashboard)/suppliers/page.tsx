import { getCurrentSession } from '@/modules/auth/session';
import { getSuppliers } from '@/modules/suppliers/queries';
import { SuppliersClient } from './suppliers-client';
import { redirect } from 'next/navigation';
import { can } from '@/modules/rbac/can';

export default async function SuppliersPage() {
  const session = await getCurrentSession();
  if (!session || !session.accountId) {
    redirect('/sign-in');
  }

  const canWrite = await can(session.userId, session.accountId, 'offerings:write');
  
  // Conditionally disable based on business type
  const { getAccountSettings } = await import('@/modules/account/queries');
  const account = await getAccountSettings(session.accountId);
  if (account?.businessType === 'services') {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold mb-2">Module Disabled</h2>
        <p className="text-gray-500">The Suppliers module is not available for pure service businesses.</p>
      </div>
    );
  }

  const allSuppliers = await getSuppliers(session.accountId);
  const activeSuppliers = allSuppliers.filter(s => !s.isArchived);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
        <p className="text-gray-500">Manage the vendors who supply your physical goods and services.</p>
      </div>

      <SuppliersClient suppliers={activeSuppliers} canWrite={canWrite} />
    </div>
  );
}
