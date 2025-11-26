import { createRoute } from '@tanstack/react-router';
import usersRoute from './users.route';

const usersProfileRoute = createRoute({
  path: '$userId/profile',
  getParentRoute: () => usersRoute,
  component: function UsersProfilePage() {
    return (
      <div>
        <h1>Users Profile</h1>
      </div>  
    );
  }
});

export default usersProfileRoute;