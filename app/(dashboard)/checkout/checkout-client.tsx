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
  const formatMoney = (cents: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(cents / 100);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Products Grid */}
      <div className="flex-1 flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold tracking-tight">Point of Sale</h2>
          <div className="text-sm font-medium text-gray-500 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-800">
            {offerings.length} items available
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pb-6 pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {offerings.map((item: any) => {
              const inCart = cart.find(i => i.offeringId === item.id);
              return (
                <div 
                  key={item.id} 
                  className={`
                    relative flex flex-col justify-between h-40 p-4 rounded-2xl cursor-pointer transition-all duration-150 select-none active:scale-95
                    ${inCart 
                      ? 'bg-primary/5 border-2 border-primary shadow-sm' 
                      : 'bg-white dark:bg-gray-950 border-2 border-transparent shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-800'
                    }
                  `}
                  onClick={() => addToCart(item)}
                >
                  {inCart && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                      {inCart.quantity}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-50 text-lg leading-tight line-clamp-2">{item.name}</p>
                    {item.tracksStock && (
                      <p className={`text-xs mt-1 font-medium ${item.currentStock < 10 ? 'text-red-500' : 'text-gray-500'}`}>
                        {item.currentStock} in stock
                      </p>
                    )}
                  </div>
                  <div className="mt-auto pt-4">
                    <p className="text-xl font-extrabold text-primary">{formatMoney(item.priceCents)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-full lg:w-[420px] flex flex-col h-[calc(100vh-8rem)]">
        <Card className="flex flex-col h-full shadow-2xl border-gray-200 dark:border-gray-800 overflow-hidden">
          <CardHeader className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold">Current Order</span>
              </div>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2" onClick={() => setCart([])}>
                  Clear
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          
          <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20 space-y-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <select
                  value={locationId}
                  onChange={e => setLocationId(e.target.value)}
                  className="w-full h-10 rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm font-medium focus:ring-primary focus:border-primary"
                >
                  <option value="" disabled>Select Location</option>
                  {locations.map((loc: any) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <select
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  className="w-full h-10 rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm font-medium focus:ring-primary focus:border-primary"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <CardContent className="flex-1 overflow-y-auto p-0 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4 p-8">
                <ShoppingCart className="w-16 h-16 opacity-20" />
                <p className="text-lg font-medium text-gray-500">Tap items to add to order</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {cart.map(item => (
                  <div key={item.offeringId} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{item.name}</p>
                      <p className="text-sm font-medium text-gray-500">{formatMoney(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 shadow-inner">
                      <Button variant="ghost" className="h-10 w-10 p-0 rounded-md hover:bg-white dark:hover:bg-gray-700 shadow-sm" onClick={() => updateQuantity(item.offeringId, -1)}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-lg font-bold w-10 text-center">{item.quantity}</span>
                      <Button variant="ghost" className="h-10 w-10 p-0 rounded-md hover:bg-white dark:hover:bg-gray-700 shadow-sm" onClick={() => updateQuantity(item.offeringId, 1)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
            <div className="flex justify-between items-end mb-4">
              <span className="text-gray-500 font-medium">Total Amount</span>
              <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {formatMoney(totalCents)}
              </span>
            </div>

            {success && (
              <div className="mb-4 bg-green-500 text-white p-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle className="w-5 h-5" /> Payment Successful!
              </div>
            )}

            <div className="space-y-3">
              <Button 
                className="w-full h-16 text-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]" 
                onClick={() => handleCheckout(false)} 
                disabled={isPending || cart.length === 0 || !locationId}
              >
                {isPending ? 'Processing...' : 'Charge Cash'}
              </Button>
              <Button 
                variant="outline"
                className="w-full h-12 text-lg font-bold border-2 border-gray-300 dark:border-gray-700 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-[0.98]" 
                onClick={() => handleCheckout(true)} 
                disabled={isPending || cart.length === 0 || !locationId || !customerId}
              >
                Add to Customer Tab
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
