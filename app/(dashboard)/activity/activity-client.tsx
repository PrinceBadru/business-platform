'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Activity, Search, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: any;
  createdAt: Date;
  user: { name: string | null; email: string; } | null;
};

export function ActivityClient({ logs }: { logs: AuditLog[] }) {
  const [search, setSearch] = useState('');

  const filtered = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) || 
    log.entityType.toLowerCase().includes(search.toLowerCase()) ||
    log.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    log.user?.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatAction = (action: string) => {
    return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatDetails = (action: string, details: any) => {
    if (!details || Object.keys(details).length === 0) return null;
    
    if (action === 'stock_adjustment') {
      const qty = details.quantityAdded;
      const reason = details.reason ? details.reason.split('_').map((w:string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Unknown';
      return `Adjusted stock by ${qty > 0 ? '+' : ''}${qty} (${reason})`;
    }
    
    if (action === 'updated_offering') {
      const updates = [];
      if (details.priceCents !== undefined) updates.push(`price to ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(details.priceCents / 100)}`);
      if (details.costCents !== undefined) updates.push(`cost to ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(details.costCents / 100)}`);
      if (details.name !== undefined) updates.push(`name to "${details.name}"`);
      return updates.length > 0 ? `Updated ${updates.join(', ')}` : 'Updated offering details';
    }
    
    // Generic fallback for any other JSON details
    const parts = Object.entries(details).map(([k, v]) => {
      const key = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      return `${key}: ${v}`;
    });
    return parts.join(' • ');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-gray-500">Track all actions performed within your account.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-500" />
              Audit Trail
            </CardTitle>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search events or users..." 
                className="pl-8"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950">
            {filtered.map(log => (
              <div key={log.id} className="p-4 flex gap-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                <div className="mt-1 bg-gray-100 dark:bg-gray-800 p-2 rounded-full h-fit">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {log.user?.name || log.user?.email || 'System'}
                    </span>
                    {' '}performed{' '}
                    <span className="font-semibold">{formatAction(log.action)}</span>
                    {' '}on{' '}
                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                      {log.entityType}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    {log.entityId && ` • ID: ${log.entityId.substring(0, 8)}...`}
                  </p>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-md mt-2 border border-gray-100 dark:border-gray-800">
                      {formatDetails(log.action, log.details)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-gray-500 italic">
                No activity found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
