import { verifyPasskeyAuth } from '@/modules/auth/passkey';
import { createSession, setSessionCookie } from '@/modules/auth/session';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = await verifyPasskeyAuth(body);
    
    if (userId) {
      const { token, expiresAt } = await createSession(userId);
      await setSessionCookie(token, expiresAt);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
