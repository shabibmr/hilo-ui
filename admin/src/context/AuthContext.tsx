'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getSession,
  isSupabaseConfigured,
  onAuthChange,
  signOut as apiSignOut,
  type Session,
  type User,
} from '@/lib/api';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  isConfigured: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    let isMounted = true;

    getSession()
      .then((session) => {
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      })
      .catch((err) => {
        console.error('Could not restore session:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Listen for auth state changes
    const unsubscribe = onAuthChange((session) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await apiSignOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOut,
        isConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
