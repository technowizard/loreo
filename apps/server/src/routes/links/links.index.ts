import { createRouter } from '@/lib/create-app.js';

import * as handlers from './links.handlers.js';
import * as routes from './links.routes.js';

const router = createRouter()
  .openapi(routes.getLinks, handlers.getLinks)
  .openapi(routes.getLinkById, handlers.getLinkById)
  .openapi(routes.getUpcomingLinks, handlers.getUpcomingLinks)
  .openapi(routes.createLink, handlers.createLink)
  .openapi(routes.updateLink, handlers.updateLink)
  .openapi(routes.deleteLink, handlers.deleteLink)
  .openapi(routes.refetchLink, handlers.refetchLink)
  .openapi(routes.searchLinks, handlers.searchLinks)
  .openapi(routes.updateLinkTags, handlers.updateLinkTags);

export default router;
