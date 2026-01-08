
import { createRoute, Outlet } from '@tanstack/react-router';

import rootRoute from '../root';

const templatesRoute = createRoute({
  path: 'templates',
  getParentRoute: () => rootRoute,
  component: () => {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Outlet />
      </div>
    );
  }
});

export default templatesRoute;
