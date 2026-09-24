import { getCurrentSession } from '@/modules/auth/session';
import { getOfferings } from '@/modules/inventory/queries';
import { InventoryClient } from './inventory-client';
import { redirect } from 'next/navigation';
import { can } from '@/modules/rbac/can';

export default async function InventoryPage() {
  const session = await getCurrentSession();
  if (!session || !session.accountId) {
    redirect('/sign-in');
  }

  const canWrite = await can(session.userId, session.accountId, 'offerings:write');
  const allOfferings = await getOfferings(session.accountId);

  const { getAccountSettings } = await import('@/modules/account/queries');
  const account = await getAccountSettings(session.accountId);
  const businessType = account?.businessType || 'hybrid';

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Offerings & Inventory</h1>
        <p className="text-gray-500">Manage your catalog of goods and services.</p>
      </div>

      <InventoryClient offerings={allOfferings} canWrite={canWrite} businessType={businessType} />
    </div>
  );
}
