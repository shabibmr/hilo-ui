'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('studio@hiloarte.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { user, loading, isConfigured } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const session = await signIn(email, password);
      if (session) router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <Loader2 className="w-8 h-8 animate-spin text-[#380b0c]" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-stone-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <span className="text-3xl font-serif font-bold tracking-wider text-[#380b0c]">
          Hilo Arte
        </span>
        <h2 className="mt-3 text-lg font-medium text-stone-700">
          Admin Management Portal
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Authorized administrative access only
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-stone-200 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2.5 text-rose-800 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {!isConfigured && (
            <p className="mb-5 text-sm text-stone-600 leading-relaxed">
              Supabase is not connected. Any password opens the sample studio. Changes stay in this browser.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5"
              >
                Admin Email
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hiloarte.com"
                  className="block w-full pl-10 pr-3 py-2.5 border border-stone-300 rounded-lg text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#380b0c] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-stone-300 rounded-lg text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#380b0c] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-[#380b0c] hover:bg-[#4d1012] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#380b0c] disabled:opacity-60 transition-colors shadow-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <a
              href="/hilo"
              className="text-xs text-stone-500 hover:text-stone-700 font-medium transition-colors"
            >
              &larr; Return to Storefront
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
