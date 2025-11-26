
import { createRoute, Outlet } from '@tanstack/react-router';

import rootRoute from '../root';

const usersRoute = createRoute({
  path: 'users',
  getParentRoute: () => rootRoute,
  component: () => {
    return (
      <div className="flex flex-col items-center justify-center h-full mx-4 mt-[76px]">
        <Outlet />
      </div>
    );
  }
});

export default usersRoute;
