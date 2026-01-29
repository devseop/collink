import { createRouter } from '@tanstack/react-router';
import rootRoute from './root';
import logInRoute from './logIn';
import signUpRoute from './signUp';
import indexRoute from './index';
import onboardingRoute from './onboarding.route';
import usersRoute from './users/users.route';
import userSetUsernameRoute from './users/userSetUsername.route';
import usersProfileRoute from './users/usersProfile.route';
import templatesRoute from './templates/templates.route';
import selectTemplatesRoute from './templates/selectTemplates.route';
import editTemplatesRoute from './templates/editTemplates.route';
import publicTemplateRoute from './publicTemplate.route';
import completedTemplatesRoute from './templates/completedTemplates.route';

const routerTree = rootRoute.addChildren([
  indexRoute,
  onboardingRoute,
  logInRoute,
  signUpRoute,
  publicTemplateRoute,
  usersRoute.addChildren([userSetUsernameRoute, usersProfileRoute]),
  templatesRoute.addChildren([selectTemplatesRoute, editTemplatesRoute]),
  completedTemplatesRoute,
]);

const router = createRouter({
  routeTree: routerTree,
  context: {
    auth: {
      user: null,
      isLoading: true,
    },
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default router;
