import { NextRequest, NextResponse } from 'next/server';
import { invalidateSession, deleteSessionCookie, SESSION_COOKIE_NAME } from '@/modules/auth/session';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await invalidateSession(token);
  }

  await deleteSessionCookie();

  return NextResponse.redirect(new URL('/sign-in', req.url));
}
