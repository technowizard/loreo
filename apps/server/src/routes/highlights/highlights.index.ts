import { createRouter } from '@/lib/create-app.js';

import * as handlers from './highlights.handlers.js';
import * as routes from './highlights.routes.js';

const router = createRouter()
  .openapi(routes.createHighlight, handlers.createHighlight)
  .openapi(routes.getHighlightsByLinkId, handlers.getHighlightsByLinkId)
  .openapi(routes.updateHighlight, handlers.updateHighlight)
  .openapi(routes.deleteHighlight, handlers.deleteHighlight);

export default router;
