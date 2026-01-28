import { createRootRouteWithContext, Outlet, redirect } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';

type RouterContext = {
  auth: {
    user: User | null;
    isLoading: boolean;
  };
};

const publicRoutes = new Set(['/signIn']);

const rootRoute = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ location, context }) => {
    if (publicRoutes.has(location.pathname)) {
      return;
    }

    if (!context.auth.user) {
      throw redirect({
        to: '/signIn',
        replace: true,
        search: {},
      });
    }
  },
  component: () => {
    return <Outlet />;
  },
});

export type { RouterContext };
export default rootRoute;











