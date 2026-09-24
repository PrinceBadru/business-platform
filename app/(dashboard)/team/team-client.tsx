'use client';

import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { inviteTeamMember, removeTeamMember } from '@/modules/team/mutations';
import { Users, UserPlus, ShieldAlert, Trash } from 'lucide-react';
import type { Role } from '@/modules/rbac/permissions';

export function TeamClient({ members, canManage, currentUserId }: { members: any[], canManage: boolean, currentUserId: string }) {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('employee');

  const handleInvite = () => {
    if (!email || !name) return;
    startTransition(async () => {
      await inviteTeamMember(email, name, role);
      setEmail('');
      setName('');
      setRole('employee');
    });
  };

  const handleRemove = (userId: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      startTransition(async () => {
        await removeTeamMember(userId);
      });
    }
  };

  return (
    <div className="space-y-6">
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-gray-500" />
              Invite Team Member
            </CardTitle>
            <CardDescription>
              Add a new employee or manager to this business account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-sm font-medium">Full Name</label>
                <Input 
                  placeholder="Jane Doe" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  disabled={isPending}
                />
              </div>
              <div className="flex-1 space-y-2 w-full">
                <label className="text-sm font-medium">Email Address</label>
                <Input 
                  type="email"
                  placeholder="jane@example.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  disabled={isPending}
                />
              </div>
              <div className="flex-1 space-y-2 w-full">
                <label className="text-sm font-medium">Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as Role)}
                  disabled={isPending}
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 dark:border-gray-800 dark:bg-gray-950"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
              <Button onClick={handleInvite} disabled={isPending || !email || !name} className="w-full md:w-auto">
                Send Invite
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            Active Members
          </CardTitle>
          <CardDescription>
            Everyone who has access to this business account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-lg">
            {members.map(member => (
              <div key={member.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
                <div>
                  <p className="font-medium">{member.name || 'Unnamed'}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
                    {member.role}
                  </span>
                  
                  {canManage && member.id !== currentUserId && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleRemove(member.id)}
                      disabled={isPending}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  )}
                  {member.id === currentUserId && (
                    <span className="text-xs text-gray-400 italic px-3">You</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
