
import { createRoute, Outlet } from '@tanstack/react-router';

import rootRoute from '../root';

const usersRoute = createRoute({
  path: 'users',
  getParentRoute: () => rootRoute,
  component: () => {
    return (
      <div className="flex flex-col h-full p-5">
        <Outlet />
      </div>
    );
  }
});

export default usersRoute;
