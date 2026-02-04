import { createRootRouteWithContext, Outlet, redirect } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';
import { getCurrentHostname, isAuthBypassEnabled } from '../utils/authBypass';

type RouterContext = {
  auth: {
    user: User | null;
    isLoading: boolean;
  };
};

const publicRoutes = new Set(['/', '/logIn', '/signUp']);
const reservedPublicSegments = new Set(['logIn', 'signUp', 'onboarding', 'users', 'templates']);

const isPublicTemplatePath = (pathname: string) => {
  const trimmed = pathname.replace(/^\/+|\/+$/g, '');
  if (!trimmed) return false;
  if (trimmed.includes('/')) return false;
  if (reservedPublicSegments.has(trimmed)) return false;
  return true;
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ location, context }) => {
    if (isAuthBypassEnabled(getCurrentHostname())) {
      return;
    }

    if (publicRoutes.has(location.pathname)) {
      return;
    }

    if (isPublicTemplatePath(location.pathname)) {
      return;
    }

    if (!context.auth.user) {
      throw redirect({
        to: '/logIn',
        replace: true,
      });
    }
  },

  component: () => {
    return <Outlet />;
  },
});

export type { RouterContext };
export default rootRoute;







