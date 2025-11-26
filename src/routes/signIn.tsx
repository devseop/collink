import { createRoute } from '@tanstack/react-router';
import rootRoute from './root';
import { useAuth } from '../hooks/useAuth';

const signInRoute = createRoute({
  path: '/signIn',
  getParentRoute: () => rootRoute,
  component: function SignInPage() {
    const { signIn, signOut, user, isLoading } = useAuth();

    return (
      <div>
        <button disabled={isLoading} onClick={() => signIn('google')}>
          Sign In with Google
        </button>

        <button disabled={isLoading || !user} onClick={() => signOut()}>
          Sign Out
        </button>
      </div>
    );
  }, 
});

export default signInRoute;
