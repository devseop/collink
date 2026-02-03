import type { User } from '@supabase/supabase-js';

const AUTH_BYPASS_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === 'true';

const isPrivateIpv4 = (hostname: string) => {
  if (hostname.startsWith('10.')) return true;
  if (hostname.startsWith('192.168.')) return true;
  const match = hostname.match(/^172\.(\d{1,3})\./);
  if (!match) return false;
  const secondOctet = Number(match[1]);
  return secondOctet >= 16 && secondOctet <= 31;
};

const isLocalhost = (hostname: string) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

export const getCurrentHostname = () =>
  typeof window !== 'undefined' ? window.location.hostname : '';

export const isAuthBypassEnabled = (hostname: string) => {
  if (!AUTH_BYPASS_ENABLED) return false;
  if (!hostname) return false;
  return isLocalhost(hostname) || isPrivateIpv4(hostname);
};

export const previewUser = { id: 'preview-user' } as User;
