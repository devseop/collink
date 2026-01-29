import { createRootRouteWithContext, Outlet, redirect } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';

type RouterContext = {
  auth: {
    user: User | null;
    isLoading: boolean;
  };
};

const publicRoutes = new Set(['/logIn', '/signUp']);

const rootRoute = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ location, context }) => {
    if (publicRoutes.has(location.pathname)) {
      return;
    }

    if (location.pathname.startsWith('/')) {
      const trimmed = location.pathname.replace(/^\/+|\/+$/g, '');

      if (trimmed && !trimmed.startsWith('users') && !trimmed.startsWith('templates')) {
        return;
      }
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










