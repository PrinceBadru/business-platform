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
      <div className="w-full lg:w-[380px] flex flex-col h-[calc(100vh-6rem)] max-h-[800px]">
        <Card className="flex flex-col h-full shadow-xl border-0 ring-1 ring-gray-200 dark:ring-gray-800 overflow-hidden bg-white/60 dark:bg-gray-950/60 backdrop-blur-xl">
          <CardHeader className="bg-white/80 dark:bg-gray-950/80 border-b border-gray-100 dark:border-gray-800 px-5 py-4 shrink-0">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xl font-extrabold tracking-tight">Current Order</span>
              </div>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full h-8 px-4 font-medium transition-colors" onClick={() => setCart([])}>
                  Clear All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          
          <div className="px-5 py-3 bg-gray-50/50 dark:bg-gray-900/30 space-y-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <select
                  value={locationId}
                  onChange={e => setLocationId(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none shadow-sm"
                >
                  <option value="" disabled>Store Location...</option>
                  {locations.map((loc: any) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              
              <div className="relative">
                <select
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none shadow-sm"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <CardContent className="flex-1 overflow-y-auto p-0 min-h-0 custom-scrollbar bg-gray-50/30 dark:bg-gray-900/10">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-24 h-24 mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <ShoppingCart className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">Your cart is empty</h3>
                <p className="text-sm text-gray-500 max-w-[200px]">Tap on any product in the catalog to add it to the order.</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {cart.map(item => (
                  <div key={item.offeringId} className="group flex items-center justify-between p-4 bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-gray-900 dark:text-gray-50 line-clamp-1">{item.name}</p>
                      <p className="text-sm font-medium text-primary mt-0.5">{formatMoney(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 rounded-full p-1 border border-gray-100 dark:border-gray-800">
                      <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-white dark:hover:bg-gray-800 shadow-sm transition-colors text-gray-600 dark:text-gray-400" onClick={() => updateQuantity(item.offeringId, -1)}>
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <span className="text-sm font-bold w-6 text-center select-none text-gray-900 dark:text-gray-100">{item.quantity}</span>
                      <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-white dark:hover:bg-gray-800 shadow-sm transition-colors text-gray-600 dark:text-gray-400" onClick={() => updateQuantity(item.offeringId, 1)}>
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          <div className="bg-white dark:bg-gray-950 p-5 shrink-0 border-t border-dashed border-gray-200 dark:border-gray-800 z-10 relative">
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-gray-50 dark:bg-gray-900 rounded-full border-b border-r border-gray-200 dark:border-gray-800"></div>
            <div className="absolute -top-3 -right-3 w-6 h-6 bg-gray-50 dark:bg-gray-900 rounded-full border-b border-l border-gray-200 dark:border-gray-800"></div>
            
            <div className="flex justify-between items-end mb-4">
              <span className="text-gray-500 font-medium text-sm">Total Due</span>
              <span className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                {formatMoney(totalCents)}
              </span>
            </div>

            {success && (
              <div className="mb-4 bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 p-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold animate-in fade-in zoom-in-95 duration-300">
                <CheckCircle className="w-5 h-5" /> Payment Processed Successfully!
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <Button 
                className="w-full h-12 text-lg font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all rounded-lg" 
                onClick={() => handleCheckout(false)} 
                disabled={isPending || cart.length === 0 || !locationId}
              >
                {isPending ? 'Processing...' : 'Charge Cash'}
              </Button>
              <Button 
                variant="outline"
                className="w-full h-10 text-sm font-bold border-2 border-gray-200 dark:border-gray-800 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 whitespace-nowrap" 
                onClick={() => handleCheckout(true)} 
                disabled={isPending || cart.length === 0 || !locationId || !customerId}
              >
                Record as Credit
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
