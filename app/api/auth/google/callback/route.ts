import { google } from "@/lib/auth/oauth";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { users, identityProviders, sessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { setSessionCookie } from "@/modules/auth/session";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value ?? null;
  const storedCodeVerifier = cookieStore.get("google_code_verifier")?.value ?? null;

  if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
    return NextResponse.redirect(new URL("/sign-in?error=invalid_oauth_state", request.url));
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
    
    const googleUserResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      }
    });
    const googleUser = await googleUserResponse.json();

    if (!googleUser.email) {
      return NextResponse.redirect(new URL("/sign-in?error=missing_email", request.url));
    }

    // Check if user exists via identity provider
    const [existingProvider] = await db.select()
      .from(identityProviders)
      .where(
        and(
          eq(identityProviders.provider, "google"),
          eq(identityProviders.providerId, googleUser.sub)
        )
      );

    let userId: string;

    if (existingProvider) {
      userId = existingProvider.userId;
    } else {
      // Check if user exists by email
      const [existingUser] = await db.select().from(users).where(eq(users.email, googleUser.email));
      
      if (existingUser) {
        userId = existingUser.id;
        // Link the new provider to existing user
        await db.insert(identityProviders).values({
          userId,
          provider: "google",
          providerId: googleUser.sub,
        });
      } else {
        // Create new user
        const [newUser] = await db.insert(users).values({
          email: googleUser.email,
          name: googleUser.name,
          username: googleUser.email.split("@")[0] + "_" + randomBytes(2).toString("hex"),
        }).returning({ id: users.id });
        
        userId = newUser.id;
        
        await db.insert(identityProviders).values({
          userId,
          provider: "google",
          providerId: googleUser.sub,
        });
      }
    }

    // Create a new session
    const [session] = await db.insert(sessions).values({
      userId,
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days
    }).returning({ id: sessions.id });

    await setSessionCookie(session.id, session.expiresAt);

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (e: any) {
    console.error("OAuth error", e);
    return NextResponse.redirect(new URL("/sign-in?error=oauth_failed", request.url));
  }
}
