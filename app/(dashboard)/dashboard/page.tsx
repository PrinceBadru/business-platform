import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentSession } from '@/modules/auth/session';
import { redirect } from 'next/navigation';
import { getDashboardMetrics } from '@/modules/analytics/queries';
import { AlertTriangle, Package, Receipt, TrendingUp, RefreshCw, CheckCircle, Clock } from 'lucide-react';
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
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Insights</h1>
          <p className="text-gray-500">Live operational metrics and alerts for your account.</p>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          {metrics.meta.freshnessStatus === 'updating' ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Updating...
            </span>
          ) : metrics.meta.freshnessStatus === 'insufficient_data' ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full font-medium">
              <Clock className="w-4 h-4" />
              Waiting for data
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium">
              <CheckCircle className="w-4 h-4" />
              Fresh (v{metrics.meta.formulaVersion})
            </span>
          )}
          <span className="text-gray-400 text-xs">
            as of {new Date(metrics.meta.computedAt).toLocaleTimeString()}
          </span>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-900 border-0 shadow-lg group">
          <div className="absolute inset-0 bg-white/10 dark:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-white/90">Total Revenue</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black text-white tracking-tight">{formatMoney(metrics.revenue)}</div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-sm text-indigo-100 font-medium bg-black/10 inline-flex px-2 py-1 rounded-md">
                Across {metrics.transactionCount} transactions
              </p>
              {metrics.grossMarginPercent > 0 && (
                <p className="text-sm text-green-100 font-bold bg-green-900/50 inline-flex px-2 py-1 rounded-md">
                  {(metrics.grossMarginPercent * 100).toFixed(1)}% GM
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 group hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sales by Type</CardTitle>
            <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg group-hover:bg-primary/10 transition-colors">
              <Package className="w-4 h-4 text-gray-400 group-hover:text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Goods</span>
                <span className="text-sm font-bold">{formatMoney(goodsRevenue)}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${metrics.revenue > 0 ? (goodsRevenue/metrics.revenue)*100 : 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Services</span>
                <span className="text-sm font-bold">{formatMoney(servicesRevenue)}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                <div className="bg-teal-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${metrics.revenue > 0 ? (servicesRevenue/metrics.revenue)*100 : 0}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-amber-50 dark:bg-amber-900/10 rounded-bl-full -z-0"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Inventory Health</CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-2">
            <div className="flex flex-col">
              <span className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                {metrics.lowStock.length}
              </span>
              <span className="text-sm font-medium text-gray-500 mt-1">Items critically low</span>
            </div>
            {metrics.lowStock.length > 0 && (
              <div className="mt-4 inline-flex items-center text-xs font-bold text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-400 px-3 py-1.5 rounded-md">
                Requires immediate restock
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md border-gray-100 dark:border-gray-800">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md">
                <AlertTriangle className="w-4 h-4" />
              </div>
              Low Stock Action List
            </CardTitle>
            <CardDescription>Items that need to be reordered soon.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {metrics.lowStock.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mb-3">
                  <Package className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Inventory is healthy</p>
                <p className="text-sm text-gray-500">No items are running critically low.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {metrics.lowStock.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white">{item.name}</span>
                        <p className="text-xs text-gray-500">Threshold: {item.reorderThreshold || 0}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-900">
                      {item.currentStock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md border-gray-100 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md">
                  <Receipt className="w-4 h-4" />
                </div>
                Recent Activity
              </CardTitle>
              <CardDescription>Latest transactions recorded.</CardDescription>
            </div>
            <Link href="/dashboard/transactions" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full">
              View All
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {metrics.recentTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-gray-500 italic">No transactions yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {metrics.recentTx.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">#{tx.id.split('-')[0]}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</p>
                      </div>
                    </div>
                    <span className="font-black text-gray-900 dark:text-white">
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
