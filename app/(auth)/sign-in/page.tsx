'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { signInWithPassword } from '@/modules/auth/actions';
import Link from 'next/link';
import { PasskeyButton } from '@/components/auth/passkey-button';

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState(signInWithPassword, {});

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>Enter your email or username and password</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or Username</Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                placeholder="you@example.com or your_username"
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {state?.error && (
              <p className="text-sm font-medium text-red-500">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between before:h-[1px] before:flex-1 before:bg-gray-200 after:h-[1px] after:flex-1 after:bg-gray-200 dark:before:bg-gray-800 dark:after:bg-gray-800">
            <span className="px-4 text-xs text-gray-500 uppercase">Or</span>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/api/auth/google">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Sign in with Google
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/api/auth/microsoft">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 21 21">
                  <path fill="#f25022" d="M0 0h10v10H0z"/>
                  <path fill="#7fba00" d="M11 0h10v10H11z"/>
                  <path fill="#00a4ef" d="M0 11h10v10H0z"/>
                  <path fill="#ffb900" d="M11 11h10v10H11z"/>
                </svg>
                Sign in with Microsoft
              </Link>
            </Button>
            <PasskeyButton className="w-full" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="font-semibold text-gray-900 hover:underline dark:text-gray-50">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
