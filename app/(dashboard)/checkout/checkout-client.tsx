'use client';

import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { processCheckout } from '@/modules/checkout/mutations';
import { ShoppingCart, Plus, Minus, CheckCircle } from 'lucide-react';

export function CheckoutClient({ offerings, customers, locations }: any) {
  const [isPending, startTransition] = useTransition();
  const [cart, setCart] = useState<{offeringId: string, quantity: number, name: string, price: number}[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>(locations[0]?.id || '');
  const [success, setSuccess] = useState(false);

  const addToCart = (offering: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.offeringId === offering.id);
      if (existing) {
        return prev.map(i => i.offeringId === offering.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { offeringId: offering.id, quantity: 1, name: offering.name, price: offering.priceCents }];
    });
  };

  const updateQuantity = (offeringId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.offeringId === offeringId) {
        return { ...i, quantity: Math.max(0, i.quantity + delta) };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const handleCheckout = (recordAsDebt: boolean = false) => {
    if (cart.length === 0 || !locationId) return;
    startTransition(async () => {
      try {
        await processCheckout(
          locationId, 
          customerId || null, 
          cart.map(i => ({ offeringId: i.offeringId, quantity: i.quantity })),
          recordAsDebt
        );
        setSuccess(true);
        setCart([]);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err: any) {
        alert('Checkout failed: ' + err.message);
      }
    });
  };

  const totalCents = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Products Grid */}
      <div className="flex-1 space-y-4">
        <h2 className="text-xl font-bold">Catalog</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {offerings.map((item: any) => (
            <Card 
              key={item.id} 
              className="cursor-pointer hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
              onClick={() => addToCart(item)}
            >
              <CardContent className="p-4 text-center space-y-2">
                <p className="font-semibold">{item.name}</p>
                <div className="inline-flex px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-sm font-medium">
                  {formatMoney(item.priceCents)}
                </div>
                {item.tracksStock && <p className="text-xs text-gray-500">Stock: {item.currentStock}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-full lg:w-96">
        <Card className="sticky top-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Current Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Store Location</label>
              <select
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
              >
                <option value="" disabled>Select Location</option>
                {locations.map((loc: any) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Customer (Optional)</label>
              <select
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
              >
                <option value="">Walk-in Customer</option>
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3 min-h-[150px]">
              {cart.length === 0 ? (
                <p className="text-sm text-center text-gray-500 mt-4">Cart is empty</p>
              ) : (
                cart.map(item => (
                  <div key={item.offeringId} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatMoney(item.price)} each</p>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-md p-1 border border-gray-100 dark:border-gray-800">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.offeringId, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm w-4 text-center font-medium">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.offeringId, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <div className="flex justify-between items-center font-bold text-xl">
                <span>Total</span>
                <span>{formatMoney(totalCents)}</span>
              </div>
            </div>

            {success && (
              <div className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 p-3 rounded-md flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Checkout successful!
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button 
              className="w-full text-lg h-12" 
              onClick={() => handleCheckout(false)} 
              disabled={isPending || cart.length === 0 || !locationId}
            >
              {isPending ? 'Processing...' : 'Charge ' + formatMoney(totalCents)}
            </Button>
            <Button 
              variant="outline"
              className="w-full text-lg h-12 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900" 
              onClick={() => handleCheckout(true)} 
              disabled={isPending || cart.length === 0 || !locationId || !customerId}
            >
              Record as Credit (Tab)
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
