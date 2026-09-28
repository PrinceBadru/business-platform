'use client';

import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createOffering, archiveOffering, adjustStock } from '@/modules/inventory/mutations';
import { Package, Plus, Archive, Box, ArrowDownToLine } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function InventoryClient({ 
  offerings, 
  canWrite, 
  businessType,
  suppliers = [] 
}: { 
  offerings: any[], 
  canWrite: boolean, 
  businessType: string,
  suppliers?: { id: string; name: string }[] 
}) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  
  const [name, setName] = useState('');
  
  const initialType = businessType === 'services' ? 'service' : 'good';
  const [itemType, setItemType] = useState<'good'|'service'>(initialType);
  const [priceStr, setPriceStr] = useState('');
  const [costStr, setCostStr] = useState('');
  const [supplierId, setSupplierId] = useState('');
  
  const [adjustItemId, setAdjustItemId] = useState<string | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('supplier_delivery');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAdjustStock = () => {
    if (!adjustItemId || !adjustQuantity) return;
    const qty = parseInt(adjustQuantity, 10);
    if (isNaN(qty) || qty === 0) return;
    
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await adjustStock(adjustItemId, qty, adjustReason);
        setAdjustItemId(null);
        setAdjustQuantity('');
        setAdjustReason('supplier_delivery');
      } catch (err: any) {
        setErrorMsg(err.message || 'An unexpected error occurred while adjusting stock.');
      }
    });
  };

  const handleCreate = () => {
    if (!name || !priceStr) return;
    const priceCents = Math.round(parseFloat(priceStr) * 100);
    const costCents = costStr ? Math.round(parseFloat(costStr) * 100) : 0;
    
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await createOffering({
          name,
          itemType,
          tracksStock: itemType === 'good',
          priceCents,
          costCents,
          supplierId: supplierId || undefined,
        });
        setName('');
        setPriceStr('');
        setCostStr('');
        setSupplierId('');
      } catch (err: any) {
        setErrorMsg(err.message || 'An unexpected error occurred while creating item.');
      }
    });
  };

  const handleArchive = (id: string) => {
    if (confirm('Archive this item?')) {
      startTransition(async () => {
        await archiveOffering(id);
      });
    }
  };

  const activeOfferings = offerings.filter(o => o.isActive);
  const filtered = activeOfferings.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  const formatMoney = (cents: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(cents / 100);

  return (
    <div className="space-y-6">
      {canWrite && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-gray-500" />
              New Offering
            </CardTitle>
            <CardDescription>
              Add a new product or service to your catalog.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMsg && (
              <div className="mb-4 p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-200">
                {errorMsg}
              </div>
            )}
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input 
                  placeholder="Haircut / Widget" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  disabled={isPending}
                />
              </div>
              {businessType === 'hybrid' && (
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={itemType}
                    onChange={e => setItemType(e.target.value as 'good'|'service')}
                    disabled={isPending}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 dark:border-gray-800 dark:bg-gray-950"
                  >
                    <option value="good">Physical Good</option>
                    <option value="service">Service</option>
                  </select>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Price ($)</label>
                <Input 
                  type="number"
                  step="0.01"
                  placeholder="25.00" 
                  value={priceStr} 
                  onChange={e => setPriceStr(e.target.value)} 
                  disabled={isPending}
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Cost ($)</label>
                <Input 
                  type="number"
                  step="0.01"
                  placeholder="10.00" 
                  value={costStr} 
                  onChange={e => setCostStr(e.target.value)} 
                  disabled={isPending}
                />
              </div>
              {itemType === 'good' && (
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Supplier</label>
                  <select
                    value={supplierId}
                    onChange={e => setSupplierId(e.target.value)}
                    disabled={isPending}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 dark:border-gray-800 dark:bg-gray-950"
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <Button onClick={handleCreate} disabled={isPending || !name || !priceStr || (itemType === 'good' && !supplierId)} className="w-full md:w-auto">
                Add Item
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
                <Package className="w-5 h-5 text-gray-500" />
                Catalog
              </CardTitle>
            </div>
            <Input 
              placeholder="Search catalog..." 
              className="max-w-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-lg">
            {filtered.map(item => (
              <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                    <Box className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{item.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{item.itemType} • {formatMoney(item.priceCents)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {item.tracksStock && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Stock: {item.currentStock}</span>
                      {canWrite && (
                        <Dialog open={adjustItemId === item.id} onOpenChange={(open) => !open && setAdjustItemId(null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setAdjustItemId(item.id)}>
                              <ArrowDownToLine className="w-4 h-4 mr-1" /> Receive
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Receive Stock for {item.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Quantity Received</label>
                                <Input 
                                  type="number" 
                                  value={adjustQuantity} 
                                  onChange={e => setAdjustQuantity(e.target.value)}
                                  placeholder="e.g. 50"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Reason</label>
                                <select
                                  value={adjustReason}
                                  onChange={e => setAdjustReason(e.target.value)}
                                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 dark:border-gray-800 dark:bg-gray-950"
                                >
                                  <option value="supplier_delivery">Supplier Delivery</option>
                                  <option value="customer_return">Customer Return</option>
                                  <option value="inventory_correction">Inventory Correction (Count)</option>
                                </select>
                              </div>
                              {errorMsg && (
                                <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-200">
                                  {errorMsg}
                                </div>
                              )}
                              <Button className="w-full" onClick={handleAdjustStock} disabled={isPending || !adjustQuantity}>
                                {isPending ? 'Updating...' : 'Update Stock Ledger'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  )}
                  {canWrite && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => handleArchive(item.id)}
                      disabled={isPending}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
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
