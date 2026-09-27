'use client';

import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Receipt, Search, RotateCcw } from 'lucide-react';
import { processRefund } from '@/modules/transactions/mutations';

export function TransactionsClient({ transactions, canWrite }: { transactions: any[], canWrite: boolean }) {
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  const formatMoney = (cents: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(cents / 100);
  
  const filtered = transactions.filter(t => {
    const term = search.toLowerCase();
    return (
      (t.customerName?.toLowerCase().includes(term)) ||
      (t.cashierName?.toLowerCase().includes(term)) ||
      (t.id.toLowerCase().includes(term))
    );
  });

  const handleRefund = (txId: string) => {
    if (confirm("Are you sure you want to refund this transaction? This will reverse the revenue and restore the stock.")) {
      startTransition(async () => {
        try {
          await processRefund(txId);
        } catch (e: any) {
          alert("Failed to refund: " + e.message);
        }
      });
    }
  };

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
                <th className="px-4 py-3 text-right">Actions</th>
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
                    {tx.transactionType === 'refund' && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        Refund
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {tx.customerName || <span className="text-gray-400 italic">Walk-in</span>}
                  </td>
                  <td className="px-4 py-3">{tx.cashierName || 'System'}</td>
                  <td className="px-4 py-3">{tx.locationName}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                    {tx.transactionType === 'refund' ? '-' : ''}{formatMoney(tx.totalCents)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canWrite && tx.transactionType !== 'refund' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRefund(tx.id)}
                        disabled={isPending}
                        className="h-8 text-gray-500 hover:text-red-600"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" /> Refund
                      </Button>
                    )}
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
