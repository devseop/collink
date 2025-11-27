import { createRoute } from '@tanstack/react-router';
import templatesRoute from './templates.route';
import router from '../router';
import { useAuth } from '../../hooks/useAuth';
import { useCallback } from 'react';
import { useGetProfile } from '../../hooks/users/useGetProfile';

const completedTemplatesRoute = createRoute({
  path: 'completed',
  getParentRoute: () => templatesRoute,
  component: function CompletedTemplatesPage() {
    const { user } = useAuth();
    const { data: profile } = useGetProfile(user?.id ?? '');

    const handleGoToProfile = useCallback(() => {
      if (!user) return;

      router.navigate({ to: `/users/${user.id}/profile` });
    }, [user]);
    
    return (
      <div>
        <h1>Completed Templates!!!</h1>
        <p>link url is @{profile?.username}</p>
        <button onClick={handleGoToProfile}>Back to Profile</button>
      </div>
    );
  },
});

export default completedTemplatesRoute;