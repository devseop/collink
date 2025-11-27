import { createRouter } from '@tanstack/react-router';
import rootRoute from './root';
import signInRoute from './signIn';
import indexRoute from './index';
import usersRoute from './users/users.route';
import userSetUsernameRoute from './users/userSetUsername.route';
import usersProfileRoute from './users/usersProfile.route';
import templatesRoute from './templates/templates.route';
import selectTemplatesRoute from './templates/selectTemplates.route';
import editTemplatesRoute from './templates/editTemplates.route';
import publicTemplateRoute from './publicTemplate.route';
import previewTemplatesRoute from './templates/previewTemplates.route';
import completedTemplatesRoute from './templates/completedTemplates.route';

const routerTree = rootRoute.addChildren([
  indexRoute,
  signInRoute,
  publicTemplateRoute,
  usersRoute.addChildren([userSetUsernameRoute, usersProfileRoute]),
  templatesRoute.addChildren([selectTemplatesRoute, editTemplatesRoute, previewTemplatesRoute]),
  completedTemplatesRoute,
]);

const router = createRouter({
  routeTree: routerTree,
});

export default router;
