'use client';

import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createCustomer, archiveCustomer } from '@/modules/crm/mutations';
import { Users, UserPlus, Phone, StickyNote, Archive } from 'lucide-react';

export function CustomersClient({ customers, canWrite }: { customers: any[], canWrite: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  const [search, setSearch] = useState('');

  const handleCreate = () => {
    if (!name) return;
    startTransition(async () => {
      await createCustomer(name, phone || null, notes || null);
      setName('');
      setPhone('');
      setNotes('');
    });
  };

  const handleArchive = (id: string) => {
    if (confirm('Archive this customer?')) {
      startTransition(async () => {
        await archiveCustomer(id);
      });
    }
  };

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search)));

  return (
    <div className="space-y-6">
      {canWrite && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-gray-500" />
              New Customer
            </CardTitle>
            <CardDescription>
              Add a new customer to your database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-sm font-medium">Customer Name</label>
                <Input 
                  placeholder="John Doe" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  disabled={isPending}
                />
              </div>
              <div className="flex-1 space-y-2 w-full">
                <label className="text-sm font-medium">Phone Number</label>
                <Input 
                  placeholder="+1 555 123 4567" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  disabled={isPending}
                />
              </div>
              <div className="flex-1 space-y-2 w-full">
                <label className="text-sm font-medium">Notes</label>
                <Input 
                  placeholder="Loyal customer" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  disabled={isPending}
                />
              </div>
              <Button onClick={handleCreate} disabled={isPending || !name} className="w-full md:w-auto">
                Add Customer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                Customer Directory
              </CardTitle>
              <CardDescription>
                Search and manage your existing customers.
              </CardDescription>
            </div>
            <Input 
              placeholder="Search by name or phone..." 
              className="max-w-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No customers found.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950">
              {filtered.map(customer => (
                <div key={customer.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{customer.name}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {customer.phone}
                        </span>
                      )}
                      {customer.notes && (
                        <span className="flex items-center gap-1">
                          <StickyNote className="w-3 h-3" /> {customer.notes}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {canWrite && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleArchive(customer.id)}
                        disabled={isPending}
                      >
                        <Archive className="w-4 h-4 mr-2" /> Archive
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
