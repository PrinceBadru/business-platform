import { getCurrentSession } from '@/modules/auth/session';
import { redirect } from 'next/navigation';
import { getRecentActivity } from '@/modules/activity/queries';
import { ActivityClient } from './activity-client';

export const metadata = {
  title: 'Activity Log - Nexus Finance',
};

export default async function ActivityPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/sign-in');
  if (!session.accountId) redirect('/onboarding');

  const logs = await getRecentActivity(session.accountId, 100);

  return <ActivityClient logs={logs} />;
}
