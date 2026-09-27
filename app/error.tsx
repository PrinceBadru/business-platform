'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error('Global Error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950 px-4">
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Something went wrong!</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>
      </div>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="default">
          Try again
        </Button>
        <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
