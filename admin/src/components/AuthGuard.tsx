'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

// Optional comma-separated allowlist. This only gates the UI; the real boundary is
// RLS on Supabase, so also disable public sign-ups in the Supabase dashboard.
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isConfigured, signOut } = useAuth();
  const router = useRouter();

  const allowed =
    !!user &&
    (!isConfigured || ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes((user.email ?? '').toLowerCase()));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (!allowed) {
      signOut().finally(() => router.replace('/login'));
    }
  }, [user, loading, allowed, router, signOut]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 text-stone-600">
        <Loader2 className="w-8 h-8 animate-spin text-[#380b0c] mb-3" />
        <span className="text-sm font-medium tracking-wide text-stone-500">Loading Hilo Admin...</span>
      </div>
    );
  }

  if (!allowed) {
    return null; // Redirecting in the effect
  }

  return <>{children}</>;
}
