'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
          <CardDescription>Enter your email and password to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
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
          
          <PasskeyButton className="mt-4 w-full" />

        </CardContent>
        <CardFooter className="flex justify-center border-t p-4">
          <p className="text-sm text-gray-500">
            Don't have an account? <Link href="/sign-up" className="font-semibold text-gray-900 hover:underline dark:text-gray-50">Sign up</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
