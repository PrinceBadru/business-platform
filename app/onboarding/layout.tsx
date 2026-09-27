import { ReactNode } from 'react';
import { getCurrentSession } from '@/modules/auth/session';
import { redirect } from 'next/navigation';

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();

  // Must be signed in to see onboarding
  if (!session) {
    redirect('/sign-in');
  }

  // If they already have an account, skip onboarding
  if (session.accountId) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
