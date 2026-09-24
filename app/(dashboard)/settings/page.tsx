import { getCurrentSession } from '@/modules/auth/session';
import { getAccountSettings, getAccountLocations } from '@/modules/account/queries';
import { SettingsClient } from './settings-client';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await getCurrentSession();
  if (!session || !session.accountId) {
    redirect('/sign-in');
  }

  const account = await getAccountSettings(session.accountId);
  const locations = await getAccountLocations(session.accountId);

  if (!account) {
    return <div>Account not found</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500">Manage your business profile and locations.</p>
      </div>

      <SettingsClient account={account} locations={locations} />
    </div>
  );
}
