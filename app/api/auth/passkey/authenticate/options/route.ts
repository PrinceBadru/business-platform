import { getPasskeyAuthOptions } from '@/modules/auth/passkey';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const options = await getPasskeyAuthOptions();
    return NextResponse.json(options);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
