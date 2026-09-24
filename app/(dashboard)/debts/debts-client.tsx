'use client';

import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { collectDebtPayment } from '@/modules/debts/mutations';
import { Banknote, Search, CheckCircle } from 'lucide-react';

export function DebtsClient({ debts, canWrite }: { debts: any[], canWrite: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});

  const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  
  const filtered = debts.filter(d => 
    d.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePay = (debtId: string, remainingCents: number) => {
    const input = paymentAmounts[debtId];
    if (!input) return;
    const amountCents = Math.round(parseFloat(input) * 100);
    if (amountCents <= 0 || amountCents > remainingCents) {
      alert("Invalid payment amount");
      return;
    }

    startTransition(async () => {
      try {
        await collectDebtPayment(debtId, amountCents);
        setPaymentAmounts(prev => ({ ...prev, [debtId]: '' }));
      } catch (e: any) {
        alert(e.message);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-gray-500" />
            Outstanding Credit
          </CardTitle>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search customer..." 
              className="pl-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-lg">
          {filtered.map(debt => (
            <div key={debt.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
              <div>
                <p className="font-semibold text-lg">{debt.customerName}</p>
                <p className="text-sm text-gray-500">
                  Total: {formatMoney(debt.amountCents)} • Date: {new Date(debt.dateIncurred).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {debt.status === 'paid' ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle className="w-4 h-4" /> Paid off
                  </span>
                ) : (
                  <>
                    <div className="text-right mr-4">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">Owes: {formatMoney(debt.remainingCents)}</p>
                    </div>
                    {canWrite && (
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number"
                          placeholder="Amount"
                          className="w-24 h-9"
                          value={paymentAmounts[debt.id] || ''}
                          onChange={e => setPaymentAmounts(prev => ({ ...prev, [debt.id]: e.target.value }))}
                          disabled={isPending}
                        />
                        <Button 
                          size="sm" 
                          onClick={() => handlePay(debt.id, debt.remainingCents)}
                          disabled={isPending || !paymentAmounts[debt.id]}
                        >
                          Collect
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No debts found.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
