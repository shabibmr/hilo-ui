'use client';

import { useCallback, useEffect, useState } from 'react';
import { contentRepository } from '@/lib/data/providers';
import type { SiteSettings } from '@/lib/data/types';

interface LiveState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Fetches on the client on every mount so the static export always shows live
 * catalogue data instead of whatever existed at build time.
 */
export function useLive<T>(load: () => Promise<T>, deps: unknown[]): LiveState<T> {
  const [attempt, setAttempt] = useState(0);
  // The result is tagged with the request that produced it, so loading is derived
  // (no synchronous setState in the effect) and stale results never leak across handles.
  const requestKey = JSON.stringify([...deps, attempt]);
  const [result, setResult] = useState<{
    key: string;
    data: T | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    let active = true;
    load()
      .then((data) => {
        if (active) setResult({ key: requestKey, data, error: null });
      })
      .catch((err: unknown) => {
        if (active) {
          setResult({
            key: requestKey,
            data: null,
            error: err instanceof Error ? err.message : 'Unable to reach the studio catalog.',
          });
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const current = result?.key === requestKey ? result : null;
  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: current === null,
    reload,
  };
}

// Header, footer and contact page all need site settings; share one request per minute.
const SETTINGS_TTL_MS = 60_000;
let settingsRequest: { at: number; promise: Promise<SiteSettings> } | null = null;

function fetchSiteSettings(): Promise<SiteSettings> {
  const now = Date.now();
  if (!settingsRequest || now - settingsRequest.at > SETTINGS_TTL_MS) {
    const promise = contentRepository.getSiteSettings();
    settingsRequest = { at: now, promise };
    // A failed request must not be cached.
    promise.catch(() => {
      if (settingsRequest?.promise === promise) settingsRequest = null;
    });
  }
  return settingsRequest.promise;
}

function clearSettingsCache() {
  settingsRequest = null;
}

export function useSiteSettings(): {
  settings: SiteSettings | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
} {
  const [attempt, setAttempt] = useState(0);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    clearSettingsCache();
    setSettings(null);
    setError(null);
    setLoading(true);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let active = true;
    fetchSiteSettings()
      .then((data) => {
        if (active) {
          setSettings(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setSettings(null);
          setError(err instanceof Error ? err.message : 'Unable to load site settings.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  return { settings, error, loading, reload };
}
