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
import { signUpWithPassword } from '@/modules/auth/actions';
import Link from 'next/link';

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUpWithPassword, {});

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Enter your information to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="Jane Doe" />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
                  @
                </span>
                <Input
                  id="username"
                  name="username"
                  placeholder="your_username"
                  autoComplete="username"
                  className="pl-7"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                3–50 characters; letters, numbers, and underscores only. Used to sign in when your
                email is not unique across businesses.
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>

            {state?.error && (
              <p className="text-sm font-medium text-red-500">{state.error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-semibold text-gray-900 hover:underline dark:text-gray-50">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
