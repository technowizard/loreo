import { createRouter } from '@/lib/create-app.js';

import * as handlers from './admin.handlers.js';
import * as routes from './admin.routes.js';

const router = createRouter()
  .openapi(routes.listUsers, handlers.listUsers)
  .openapi(routes.getUser, handlers.getUser)
  .openapi(routes.updateUser, handlers.updateUser)
  .openapi(routes.resetPassword, handlers.resetPassword)
  .openapi(routes.softDeleteUser, handlers.softDeleteUser)
  .openapi(routes.restoreUser, handlers.restoreUser)
  .openapi(routes.listConnections, handlers.listConnections);

export default router;
