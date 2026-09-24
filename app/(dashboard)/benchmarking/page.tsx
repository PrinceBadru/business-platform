import { getCurrentSession } from '@/modules/auth/session';
import { getAccountSettings } from '@/modules/account/queries';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Lock, BarChart3, Globe } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function BenchmarkingPage() {
  const session = await getCurrentSession();
  if (!session || !session.accountId) {
    redirect('/sign-in');
  }

  const account = await getAccountSettings(session.accountId);
  const settings = account?.settings as any;
  const enabled = settings?.benchmarkingEnabled === true;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Industry Benchmarking</h1>
        <p className="text-gray-500">Compare your performance against similar businesses in our anonymized cohort.</p>
      </div>

      {!enabled ? (
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
            <Link href="/dashboard/settings">
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
  );
}
