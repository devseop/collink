import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import type { Provider } from '@supabase/supabase-js';

export type AuthProvider = Extract<Provider, 'google' | 'apple' | 'kakao'>;

export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // redirectTo: 'http://localhost:3000/',
          redirectTo: window.location.origin
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
