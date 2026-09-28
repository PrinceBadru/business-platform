'use client';

import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createSupplier, archiveSupplier, getSupplierDeliveries } from '@/modules/suppliers/mutations';
import { Truck, Store, Archive, Calendar, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function SuppliersClient({ suppliers, canWrite }: { suppliers: any[], canWrite: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  
  const [search, setSearch] = useState('');
  
  const [openSupplierId, setOpenSupplierId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(supplier => (
                <Dialog 
                  key={supplier.id} 
                  open={openSupplierId === supplier.id} 
                  onOpenChange={(open) => {
                    if (open) {
                      setOpenSupplierId(supplier.id);
                      setLoadingDeliveries(true);
                      getSupplierDeliveries(supplier.id).then(data => {
                        setDeliveries(data);
                        setLoadingDeliveries(false);
                      });
                    } else {
                      setOpenSupplierId(null);
                      setDeliveries([]);
                    }
                  }}
                >
                  <div className="group relative flex flex-col bg-white dark:bg-gray-950 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer">
                    <DialogTrigger asChild>
                      <div className="absolute inset-0 z-0"></div>
                    </DialogTrigger>
                    
                    <div className="flex justify-between items-start mb-4 z-10">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <Store className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      {canWrite && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(supplier.id);
                          }}
                          disabled={isPending}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex-1 mt-2 pointer-events-none">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-50">{supplier.name}</h3>
                      {supplier.contactInfo && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{supplier.contactInfo}</p>
                      )}
                    </div>
                  </div>

                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl flex items-center gap-2">
                        <Store className="w-5 h-5" />
                        {supplier.name} - Activity & Deliveries
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="py-4">
                      <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wider mb-4">Recent Deliveries</h4>
                      {loadingDeliveries ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                        </div>
                      ) : deliveries.length === 0 ? (
                        <div className="text-center py-8 border border-dashed rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500">
                          <Package className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <p>No delivery records found for this supplier.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {deliveries.map((delivery) => (
                            <div key={delivery.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                                  <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                  <p className="font-medium">Delivered: {delivery.offeringName}</p>
                                  <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(delivery.date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">+{delivery.quantityAdded}</p>
                                <p className="text-xs text-gray-500 uppercase">Units</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
