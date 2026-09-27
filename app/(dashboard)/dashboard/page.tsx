import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentSession } from '@/modules/auth/session';
import { redirect } from 'next/navigation';
import { getDashboardMetrics } from '@/modules/analytics/queries';
import { AlertTriangle, Package, Receipt, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardOverviewPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect('/sign-in');
  }
  if (!session.accountId) {
    redirect('/onboarding');
  }

  const metrics = await getDashboardMetrics(session.accountId);

  const formatMoney = (cents: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(cents / 100);

  const goodsRevenue = metrics.typeStats.find(t => t.type === 'good')?.revenue || 0;
  const servicesRevenue = metrics.typeStats.find(t => t.type === 'service')?.revenue || 0;

  return (
    <div className="max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Insights</h1>
        <p className="text-gray-500">Live operational metrics and alerts for your account.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100">Total Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-950 dark:text-blue-50">{formatMoney(metrics.revenue)}</div>
            <p className="text-xs text-blue-600/80 mt-1">Across {metrics.transactionCount} transactions</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sales by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Goods</span>
              <span className="font-semibold">{formatMoney(goodsRevenue)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Services</span>
              <span className="font-semibold">{formatMoney(servicesRevenue)}</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mt-2 overflow-hidden flex">
               <div className="bg-indigo-500 h-full" style={{ width: `${metrics.revenue > 0 ? (goodsRevenue/metrics.revenue)*100 : 0}%` }}></div>
               <div className="bg-teal-500 h-full" style={{ width: `${metrics.revenue > 0 ? (servicesRevenue/metrics.revenue)*100 : 0}%` }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-amber-100 dark:border-amber-900/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>Items running critically low on inventory.</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.lowStock.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Inventory levels are healthy.</p>
            ) : (
              <div className="space-y-4">
                {metrics.lowStock.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 px-2 py-1 rounded-md">
                      {item.currentStock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="w-5 h-5 text-gray-500" />
                Recent Sales
              </CardTitle>
              <CardDescription>Latest transactions recorded.</CardDescription>
            </div>
            <Link href="/dashboard/transactions" className="text-sm font-medium text-indigo-600 hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {metrics.recentTx.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No transactions yet.</p>
            ) : (
              <div className="space-y-4">
                {metrics.recentTx.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-mono text-gray-500">{tx.id.split('-')[0]}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</p>
                    </div>
                    <span className="font-semibold text-sm">
                      {formatMoney(tx.totalCents)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
