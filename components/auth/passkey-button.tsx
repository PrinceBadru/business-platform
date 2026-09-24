'use client';

import { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function PasskeyButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handlePasskeySignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('/api/auth/passkey/authenticate/options');
      const options = await resp.json();

      if (options.error) throw new Error(options.error);

      // Trigger native browser WebAuthn prompt
      const authResp = await startAuthentication(options);
      
      const verificationResp = await fetch('/api/auth/passkey/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authResp)
      });
      
      const verification = await verificationResp.json();
      
      if (verification.success) {
        router.push('/dashboard');
      } else {
        throw new Error(verification.error || 'Failed to authenticate');
      }
    } catch (err: any) {
      setError(err.message || 'Passkey authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {error && <p className="mb-2 text-sm text-center text-red-500">{error}</p>}
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={handlePasskeySignIn} 
        disabled={loading}
        type="button"
      >
        {loading ? 'Waiting for passkey...' : 'Sign in with Passkey'}
      </Button>
    </div>
  );
}
