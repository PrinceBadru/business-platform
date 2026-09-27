import { getCurrentSession } from '@/modules/auth/session';
import { redirect } from 'next/navigation';

export default async function BillingPage() {
  const session = await getCurrentSession();
  if (!session || !session.accountId) {
    redirect('/sign-in');
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
        <p className="text-gray-500">Manage your subscription, payment methods, and invoices.</p>
      </div>
      <div className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg text-center text-gray-500">
        Billing module is under construction.
      </div>
    </div>
  );
}
