'use client';

import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createSupplier, archiveSupplier } from '@/modules/suppliers/mutations';
import { Truck, Store, Archive } from 'lucide-react';

export function SuppliersClient({ suppliers, canWrite }: { suppliers: any[], canWrite: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  
  const [search, setSearch] = useState('');

  const handleCreate = () => {
    if (!name) return;
    startTransition(async () => {
      await createSupplier(name, contactInfo || null);
      setName('');
      setContactInfo('');
    });
  };

  const handleArchive = (id: string) => {
    if (confirm('Archive this supplier?')) {
      startTransition(async () => {
        await archiveSupplier(id);
      });
    }
  };

  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {canWrite && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-gray-500" />
              New Supplier
            </CardTitle>
            <CardDescription>
              Add a vendor to your business network.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-sm font-medium">Company Name</label>
                <Input 
                  placeholder="Acme Distribution Corp" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  disabled={isPending}
                />
              </div>
              <div className="flex-2 space-y-2 w-full min-w-[300px]">
                <label className="text-sm font-medium">Contact Information</label>
                <Input 
                  placeholder="Email, phone, or address" 
                  value={contactInfo} 
                  onChange={e => setContactInfo(e.target.value)} 
                  disabled={isPending}
                />
              </div>
              <Button onClick={handleCreate} disabled={isPending || !name} className="w-full md:w-auto">
                Add Supplier
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
                <Truck className="w-5 h-5 text-gray-500" />
                Vendor Directory
              </CardTitle>
              <CardDescription>
                Search and manage active vendors.
              </CardDescription>
            </div>
            <Input 
              placeholder="Search suppliers..." 
              className="max-w-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No suppliers found.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950">
              {filtered.map(supplier => (
                <div key={supplier.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{supplier.name}</p>
                    {supplier.contactInfo && (
                      <p className="text-sm text-gray-500 mt-1">{supplier.contactInfo}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {canWrite && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleArchive(supplier.id)}
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
