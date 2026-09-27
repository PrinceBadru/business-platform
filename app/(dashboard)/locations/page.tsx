import { getCurrentSession } from '@/modules/auth/session';
import { redirect } from 'next/navigation';

export default async function LocationsPage() {
  const session = await getCurrentSession();
  if (!session || !session.accountId) {
    redirect('/sign-in');
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
        <p className="text-gray-500">Manage your physical business locations and warehouses.</p>
      </div>
      <div className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg text-center text-gray-500">
        Locations module is under construction.
      </div>
    </div>
  );
}
