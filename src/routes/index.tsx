import { createRoute, redirect } from '@tanstack/react-router';
import rootRoute from './root';
import { supabase } from '../lib/supabaseClient';
import { createProfile, getProfile } from '../api/profileAPI';

const indexRoute = createRoute({
 path: '/',
 getParentRoute: () => rootRoute,
 beforeLoad: async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    throw redirect({
      to: '/logIn',
      replace: true,
    });
  }

  let profile = await getProfile(session.user.id);

  if (!profile) {
    profile = await createProfile(session.user.id);
  }

  if (!profile.username) {
    throw redirect({
      to: '/users/$userId/setUsername',
      params: { userId: session.user.id },
      replace: true,
    });
  }

  if (!profile.isUserVisited) {
    throw redirect({
      to: '/onboarding',
      replace: true,
    });
  }

  throw redirect({
    to: '/users/$userId/profile',
    params: { userId: session.user.id },
    replace: true,
    search: { toast: undefined },
  });
 },
 component:  function IndexPage() {
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
 },  
});

export default indexRoute;
