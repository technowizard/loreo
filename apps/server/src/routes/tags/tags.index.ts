import { createRouter } from '@/lib/create-app.js';

import * as handlers from './tags.handlers.js';
import * as routes from './tags.routes.js';

const router = createRouter()
  .openapi(routes.getTagGroups, handlers.getTagGroups)
  .openapi(routes.createTagGroup, handlers.createTagGroup)
  .openapi(routes.deleteTagGroup, handlers.deleteTagGroup)
  .openapi(routes.updateTagGroup, handlers.updateTagGroup)
  .openapi(routes.getTagsByGroup, handlers.getTagsByGroup)
  .openapi(routes.getUserTags, handlers.getUserTags)
  .openapi(routes.createTag, handlers.createTag)
  .openapi(routes.bulkDeleteTags, handlers.bulkDeleteTags)
  .openapi(routes.bulkMoveTags, handlers.bulkMoveTags)
  .openapi(routes.updateTag, handlers.updateTag)
  .openapi(routes.deleteTag, handlers.deleteTag)
  .openapi(routes.moveTag, handlers.moveTag);

export default router;
