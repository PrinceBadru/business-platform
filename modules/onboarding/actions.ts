'use server';

import { db } from '@/lib/db/drizzle';
import { accounts, locations, userAccountRoles, userLocationAccess, sessions } from '@/lib/db/schema';
import { getCurrentSession } from '@/modules/auth/session';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

export type OnboardingState = {
  error?: string;
};

export async function createBusinessAccount(
  prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const session = await getCurrentSession();
  if (!session) redirect('/sign-in');

  const businessName = (formData.get('businessName') as string)?.trim();
  const businessType = formData.get('businessType') as 'retail' | 'services' | 'hybrid';
  const locationName = (formData.get('locationName') as string)?.trim() || 'Main Location';

  if (!businessName) return { error: 'Business name is required.' };
  if (!['retail', 'services', 'hybrid'].includes(businessType)) {
    return { error: 'Please select a valid business type.' };
  }

  // 1. Create the account (tenant)
  const [account] = await db.insert(accounts).values({
    name: businessName,
    businessType,
  }).returning();

  // 2. Create a default location
  const [location] = await db.insert(locations).values({
    accountId: account.id,
    name: locationName,
  }).returning();

  // 3. Assign the user as owner of this account
  await db.insert(userAccountRoles).values({
    userId: session.userId,
    accountId: account.id,
    role: 'owner',
  });

  // 4. Grant the user access to the default location
  await db.insert(userLocationAccess).values({
    userId: session.userId,
    accountId: account.id,
    locationId: location.id,
  });

  // 5. Bind the active account to the session
  await db.update(sessions)
    .set({ accountId: account.id })
    .where(eq(sessions.id, session.id));

  redirect('/dashboard');
}
