import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import { getCurrentHostname, isAuthBypassEnabled, previewUser } from '../utils/authBypass';
import type { Provider } from '@supabase/supabase-js';

export type AuthProvider = Extract<Provider, 'google' | 'apple' | 'kakao'>;

export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    if (isAuthBypassEnabled(getCurrentHostname())) {
      setUser(previewUser);
      setLoading(false);
      return;
    }

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

  const signIn = useCallback(
    async (provider: AuthProvider) => {
      setLoading(true);
      if (isAuthBypassEnabled(getCurrentHostname())) {
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }
    },
    [setLoading]
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    if (isAuthBypassEnabled(getCurrentHostname())) {
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
    }
    setLoading(false);
  }, [setLoading]);

  return {
    user,
    isLoading,
    signIn,
    signOut,
  };
}
