'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Activity, Search, User, Plus, Trash2, Edit2, Box, Package, Archive, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: any;
  createdAt: Date;
  user: { name: string | null; email: string | null; } | null;
};

export function ActivityClient({ logs }: { logs: AuditLog[] }) {
  const [search, setSearch] = useState('');

  const filtered = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) || 
    log.entityType.toLowerCase().includes(search.toLowerCase()) ||
    log.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    log.user?.email?.toLowerCase().includes(search.toLowerCase())
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
      if (details.priceCents !== undefined) updates.push(`price to ${new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(details.priceCents / 100)}`);
      if (details.costCents !== undefined) updates.push(`cost to ${new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(details.costCents / 100)}`);
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
          <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-4 md:ml-6 space-y-8 pb-4">
            {filtered.map((log, index) => {
              const isCreate = log.action.includes('create');
              const isArchive = log.action.includes('archive') || log.action.includes('delete');
              const isUpdate = log.action.includes('update') || log.action.includes('adjust');
              
              let Icon = Settings;
              let iconColor = 'text-gray-500';
              let iconBg = 'bg-gray-100 dark:bg-gray-800';
              let ringColor = 'ring-gray-50 dark:ring-gray-900';

              if (isCreate) {
                Icon = Plus;
                iconColor = 'text-green-600 dark:text-green-400';
                iconBg = 'bg-green-100 dark:bg-green-900/30';
                ringColor = 'ring-green-50 dark:ring-green-950';
              } else if (isArchive) {
                Icon = Archive;
                iconColor = 'text-red-600 dark:text-red-400';
                iconBg = 'bg-red-100 dark:bg-red-900/30';
                ringColor = 'ring-red-50 dark:ring-red-950';
              } else if (isUpdate) {
                Icon = Edit2;
                iconColor = 'text-blue-600 dark:text-blue-400';
                iconBg = 'bg-blue-100 dark:bg-blue-900/30';
                ringColor = 'ring-blue-50 dark:ring-blue-950';
              }

              if (log.entityType === 'offering') Icon = Package;
              if (log.entityType === 'stock_movement') Icon = Box;

              return (
                <div key={log.id} className="relative pl-8 md:pl-12 group">
                  <div className={`absolute -left-[17px] top-1 p-2 rounded-full ${iconBg} ring-8 ${ringColor} transition-transform group-hover:scale-110`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  
                  <div className="bg-white dark:bg-gray-950 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        <span className="font-bold text-gray-900 dark:text-white mr-1">
                          {log.user?.name || log.user?.email || 'System'}
                        </span>
                        performed
                        <span className="font-bold ml-1">{formatAction(log.action)}</span>
                        <span className="text-gray-500 mx-1">on</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                          {log.entityType}
                        </span>
                      </p>
                      <span className="text-xs font-medium text-gray-400 shrink-0 whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-900/50 px-4 py-3 rounded-xl border border-gray-100/50 dark:border-gray-800/50">
                        {formatDetails(log.action, log.details)}
                      </div>
                    )}
                    
                    {log.entityId && (
                      <p className="mt-3 text-[11px] font-mono text-gray-400">
                        REF: {log.entityId}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            
            {filtered.length === 0 && (
              <div className="pl-8 py-12 text-center text-gray-500 italic relative">
                <div className="absolute -left-[9px] top-12 w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                No activity found matching your search.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
