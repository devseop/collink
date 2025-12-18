import { createRootRoute, Outlet } from '@tanstack/react-router';

const rootRoute = createRootRoute({
  component: () => {
    return <Outlet />;
  },
});

export default rootRoute;












