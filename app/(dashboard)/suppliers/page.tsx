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
