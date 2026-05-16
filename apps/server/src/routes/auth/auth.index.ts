import { createRouter } from '../../lib/create-app.js';

import * as handlers from './auth.handlers.js';
import * as routes from './auth.routes.js';

const router = createRouter()
  .openapi(routes.create, handlers.create)
  .openapi(routes.login, handlers.login)
  .openapi(routes.logout, handlers.logout)
  .openapi(routes.getUser, handlers.getUser)
  .openapi(routes.updateEmail, handlers.updateEmail)
  .openapi(routes.changePassword, handlers.changePassword)
  .openapi(routes.getSettings, handlers.getSettings)
  .openapi(routes.updateSettings, handlers.updateSettings)
  .openapi(routes.uploadAvatar, handlers.uploadAvatar)
  .openapi(routes.updateAccount, handlers.updateAccount);

export default router;
