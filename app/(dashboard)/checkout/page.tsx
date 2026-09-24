import { getCurrentSession } from '@/modules/auth/session';
import { getOfferings } from '@/modules/inventory/queries';
import { getCustomers } from '@/modules/crm/queries';
import { getAccountLocations } from '@/modules/account/queries';
import { CheckoutClient } from './checkout-client';
import { redirect } from 'next/navigation';
import { can } from '@/modules/rbac/can';

export default async function CheckoutPage() {
  const session = await getCurrentSession();
  if (!session || !session.accountId) {
    redirect('/sign-in');
  }

  // Pre-evaluate to ensure only users with transactions:write can access the POS
  const canWrite = await can(session.userId, session.accountId, 'transactions:write');
  if (!canWrite) {
    return <div className="p-10 text-red-500">You do not have permission to access the Point of Sale.</div>;
  }

  const [offerings, customers, locations] = await Promise.all([
    getOfferings(session.accountId),
    getCustomers(session.accountId),
    getAccountLocations(session.accountId)
  ]);

  const activeOfferings = offerings.filter(o => o.isActive);
  const activeCustomers = customers.filter(c => !c.isArchived);
  const activeLocations = locations.filter(l => !l.isArchived);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Point of Sale</h1>
        <p className="text-gray-500">Process new sales and service deliveries.</p>
      </div>
      
      <CheckoutClient 
        offerings={activeOfferings} 
        customers={activeCustomers} 
        locations={activeLocations} 
      />
    </div>
  );
}
