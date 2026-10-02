import { getCurrentSession } from '@/modules/auth/session';
import { getAccountSettings } from '@/modules/account/queries';
import { getDashboardMetrics } from '@/modules/analytics/queries';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Lock, BarChart3, Globe, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function InsightsPage() {
  const session = await getCurrentSession();
  if (!session || !session.accountId) {
    redirect('/sign-in');
  }

  const account = await getAccountSettings(session.accountId);
  const settings = account?.settings as any;
  const benchmarkingEnabled = settings?.benchmarkingEnabled === true;

  const metrics = await getDashboardMetrics(session.accountId);

  const formatMoney = (cents: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(cents / 100);

  return (
    <div className="max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insights & Reports</h1>
        <p className="text-gray-500">In-depth breakdown of your business anomalies, active alerts, and industry standing.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card className="shadow-md border-red-100 dark:border-red-900/30 bg-red-50/10 dark:bg-red-950/10">
          <CardHeader className="border-b border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20">
            <CardTitle className="flex items-center gap-2 text-lg text-red-700 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Active Intelligent Alerts & Anomalies
            </CardTitle>
            <CardDescription className="text-red-600/70 dark:text-red-400/70">
              Anomalies and trends detected by the insights engine over your historical data.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {metrics.activeAlerts.length === 0 ? (
               <div className="p-8 text-center text-sm text-gray-500">
                 No active anomalies detected in your account. Operations are looking healthy!
               </div>
            ) : (
              <div className="divide-y divide-red-100 dark:divide-red-900/30">
                {metrics.activeAlerts.map(alert => (
                  <div key={alert.id} className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors">
                    <div>
                      <h4 className="font-bold text-red-900 dark:text-red-300 capitalize">
                        {alert.metricKey.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-sm text-red-700/80 dark:text-red-400/80 mt-1">
                        Triggered by {alert.triggerType} (Severity: {alert.severity})
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm bg-white dark:bg-black/20 p-2 rounded-md shadow-sm border border-red-100 dark:border-red-900/30">
                      <div className="text-center">
                        <span className="block text-gray-500 text-xs uppercase tracking-wider">Current</span>
                        <span className="font-black text-gray-900 dark:text-white">{(alert.computedValue as any)?.cents ? formatMoney((alert.computedValue as any).cents) : JSON.stringify(alert.computedValue)}</span>
                      </div>
                      <div className="w-px h-8 bg-gray-200 dark:bg-gray-800"></div>
                      <div className="text-center">
                        <span className="block text-gray-500 text-xs uppercase tracking-wider">Baseline</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{(alert.baselineValue as any)?.cents ? formatMoney((alert.baselineValue as any).cents) : JSON.stringify(alert.baselineValue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Detailed Reports</CardTitle>
            <CardDescription>Generate and download comprehensive reports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <h4 className="font-medium mb-1">Monthly Financial Summary</h4>
              <p className="text-sm text-gray-500 mb-3">Complete breakdown of revenue, COGS, and gross margin.</p>
              <Button variant="outline" size="sm">Generate Report</Button>
            </div>
            <div className="p-4 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <h4 className="font-medium mb-1">Inventory Valuation</h4>
              <p className="text-sm text-gray-500 mb-3">Current stock levels, values, and turnover rates.</p>
              <Button variant="outline" size="sm">Generate Report</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight">Industry Benchmarking</h2>
          {!benchmarkingEnabled ? (
            <Card className="bg-gray-50 dark:bg-gray-900/50 border-dashed">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2">
                  <Lock className="w-6 h-6 text-gray-400" />
                </div>
                <CardTitle>Benchmarking is Disabled</CardTitle>
                <CardDescription>
                  To view cohort data, you must opt-in to anonymized data sharing.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pt-4">
                <Link href="/settings">
                  <Button>Enable in Settings</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gray-500" />
                    Average Revenue (L4)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-50">$8,450.00</div>
                  <p className="text-sm text-gray-500 mt-1">Cohort average for {account?.businessType} businesses.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-gray-500" />
                    Your Percentile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-50">Top 35%</div>
                  <p className="text-sm text-gray-500 mt-1">Based on safe placeholder calculation.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
