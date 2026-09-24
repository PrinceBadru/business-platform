'use server';

import { db } from '@/lib/db/drizzle';
import { jobs } from '@/lib/db/schema';

export async function enqueueJob(type: string, payload: any, accountId?: string) {
  await db.insert(jobs).values({
    type,
    payload,
    accountId
  });
}
