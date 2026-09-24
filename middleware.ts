import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/settings', '/account'];

export async function middleware(req: NextRequest) {
  // Edge-compatible optimistic check
  const sessionToken = req.cookies.get('auth_session')?.value;
  
  const isProtected = PROTECTED_ROUTES.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  if (!sessionToken && isProtected) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // Note: Deep cryptographic validation against the database happens inside
  // Server Components (layout.tsx) and Server Actions (guard.ts) because
  // direct database connections via postgres.js are not supported in Edge.
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
