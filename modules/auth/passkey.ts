import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { db } from '@/lib/db/drizzle';
import { webauthnCredentials } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

const rpName = process.env.WEBAUTHN_RP_NAME || 'Business Platform';
const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
const origin = `http://${rpID}:3000`;

export async function getPasskeyRegistrationOptions(userId: string, email: string) {
  const existingCredentials = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.userId, userId));
  
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(userId),
    userName: email,
    attestationType: 'none',
    excludeCredentials: existingCredentials.map(cred => ({
      id: cred.id,
      type: 'public-key',
    })),
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'preferred',
    },
  });

  const cookieStore = await cookies();
  cookieStore.set('passkey_challenge', options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 5, 
    path: '/'
  });

  return options;
}

export async function verifyPasskeyRegistration(userId: string, body: any) {
  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get('passkey_challenge')?.value;

  if (!expectedChallenge) {
    throw new Error('Registration challenge not found or expired.');
  }

  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (verification.verified && verification.registrationInfo) {
    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
    
    await db.insert(webauthnCredentials).values({
      id: credentialID,
      userId,
      publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
      signCount: counter
    });

    cookieStore.delete('passkey_challenge');
    return true;
  }
  return false;
}

export async function getPasskeyAuthOptions() {
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
  });

  const cookieStore = await cookies();
  cookieStore.set('passkey_challenge', options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 5,
    path: '/'
  });

  return options;
}

export async function verifyPasskeyAuth(body: any) {
  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get('passkey_challenge')?.value;

  if (!expectedChallenge) {
    throw new Error('Authentication challenge not found or expired.');
  }

  const credentialIdStr = body.id;
  
  const results = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.id, credentialIdStr)).limit(1);
  if (results.length === 0) {
    throw new Error('Credential not found');
  }

  const credential = results[0];

  const verification = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    authenticator: {
      credentialID: credential.id,
      credentialPublicKey: new Uint8Array(Buffer.from(credential.publicKey, 'base64url')),
      counter: credential.signCount,
    }
  });

  if (verification.verified && verification.authenticationInfo) {
    await db.update(webauthnCredentials)
      .set({ signCount: verification.authenticationInfo.newCounter })
      .where(eq(webauthnCredentials.id, credential.id));
      
    cookieStore.delete('passkey_challenge');
    return credential.userId;
  }

  return null;
}
