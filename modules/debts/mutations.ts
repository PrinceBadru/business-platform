'use server';

import { debts, debtPayments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant';
import { requirePermission } from '@/modules/rbac/guard';
import { getCurrentSession } from '@/modules/auth/session';
import { revalidatePath } from 'next/cache';

export async function collectDebtPayment(debtId: string, amountCents: number) {
  return requirePermission('transactions:write')(async () => {
    const session = await getCurrentSession();
    if (!session?.accountId) throw new Error('No active account');
    const accountId = session.accountId;
    const userId = session.userId;

    if (amountCents <= 0) throw new Error('Amount must be positive');

    await withTenantContext(accountId, async (tx) => {
      // 1. Fetch debt to verify remaining
      const [debt] = await tx.select().from(debts).where(eq(debts.id, debtId));
      if (!debt || debt.remainingCents < amountCents) {
        throw new Error('Payment exceeds remaining debt');
      }

      // 2. Record payment
      await tx.insert(debtPayments).values({
        accountId,
        debtId,
        amountCents,
        createdBy: userId,
      });

      // 3. Update debt remaining and status
      const newRemaining = debt.remainingCents - amountCents;
      const newStatus = newRemaining === 0 ? 'paid' : 'partially_paid';
      
      await tx.update(debts)
        .set({ 
          remainingCents: newRemaining,
          status: newStatus
        })
        .where(eq(debts.id, debtId));
    });

    revalidatePath('/dashboard/debts');
    return { success: true };
  });
}
