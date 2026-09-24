import { getCurrentSession } from '@/modules/auth/session';
import { getTeamMembers } from '@/modules/team/queries';
import { TeamClient } from './team-client';
import { redirect } from 'next/navigation';
import { can } from '@/modules/rbac/can';

export default async function TeamPage() {
  const session = await getCurrentSession();
  if (!session || !session.accountId) {
    redirect('/sign-in');
  }

  // Pre-evaluate if the current user has the manage rights (to hide/show the invite form safely)
  const canManage = await can(session.userId, session.accountId, 'users:manage');
  const members = await getTeamMembers(session.accountId);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <p className="text-gray-500">Manage your employees, managers, and their access levels.</p>
      </div>

      <TeamClient members={members} canManage={canManage} currentUserId={session.userId} />
    </div>
  );
}
