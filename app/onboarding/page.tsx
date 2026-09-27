'use client';

import { useActionState } from 'react';
import { createBusinessAccount } from '@/modules/onboarding/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const businessTypes = [
  {
    value: 'retail',
    label: 'Retail',
    description: 'Physical or online product sales with inventory tracking.',
  },
  {
    value: 'services',
    label: 'Services',
    description: 'Service-based business (consulting, repairs, etc.).',
  },
  {
    value: 'hybrid',
    label: 'Hybrid',
    description: 'Both products and services.',
  },
];

export default function OnboardingPage() {
  const [state, formAction, isPending] = useActionState(createBusinessAccount, {});

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">Set Up Your Business</CardTitle>
          <CardDescription>
            You&apos;re almost there. Tell us about your business to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                name="businessName"
                placeholder="e.g. Acme Retail"
                required
              />
            </div>

            {/* Business Type */}
            <div className="space-y-2">
              <Label>Business Type</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {businessTypes.map((type) => (
                  <label
                    key={type.value}
                    className="flex cursor-pointer flex-col gap-1 rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition hover:border-indigo-400 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-indigo-950/30"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="businessType"
                        value={type.value}
                        className="accent-indigo-600"
                        required
                      />
                      <span className="font-semibold text-sm">{type.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 pl-5">
                      {type.description}
                    </p>
                  </label>
                ))}
              </div>
            </div>

            {/* Default Location */}
            <div className="space-y-2">
              <Label htmlFor="locationName">First Location Name</Label>
              <Input
                id="locationName"
                name="locationName"
                placeholder="e.g. Main Store, HQ, Warehouse"
              />
              <p className="text-xs text-gray-500">
                You can add more locations later from Settings.
              </p>
            </div>

            {state?.error && (
              <p className="text-sm font-medium text-red-500">{state.error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Business & Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
