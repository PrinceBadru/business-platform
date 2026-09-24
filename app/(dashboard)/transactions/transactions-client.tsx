'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Receipt, Search } from 'lucide-react';

export function TransactionsClient({ transactions }: { transactions: any[] }) {
  const [search, setSearch] = useState('');

  const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  
  const filtered = transactions.filter(t => {
    const term = search.toLowerCase();
    return (
      (t.customerName?.toLowerCase().includes(term)) ||
      (t.cashierName?.toLowerCase().includes(term)) ||
      (t.id.toLowerCase().includes(term))
    );
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-gray-500" />
            Ledger
          </CardTitle>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search customer, cashier, or ID..." 
              className="pl-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Cashier</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {tx.id.split('-')[0]}...
                  </td>
                  <td className="px-4 py-3">
                    {tx.customerName || <span className="text-gray-400 italic">Walk-in</span>}
                  </td>
                  <td className="px-4 py-3">{tx.cashierName || 'System'}</td>
                  <td className="px-4 py-3">{tx.locationName}</td>
                  <td className="px-4 py-3 text-right font-bold">
                    {formatMoney(tx.totalCents)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
