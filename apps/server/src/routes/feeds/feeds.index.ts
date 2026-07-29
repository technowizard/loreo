import { createRouter } from '@/lib/create-app.js';

import * as handlers from './feeds.handlers.js';
import * as routes from './feeds.routes.js';

const router = createRouter()
  .openapi(routes.listFeedSubscriptions, handlers.listFeedSubscriptions)
  .openapi(routes.createFeedSubscription, handlers.createFeedSubscription)
  .openapi(routes.getFeedSubscriptionSummary, handlers.getFeedSubscriptionSummary)
  .openapi(routes.updateFeedSubscription, handlers.updateFeedSubscription)
  .openapi(routes.deleteFeedSubscription, handlers.deleteFeedSubscription)
  .openapi(routes.refreshFeedSubscription, handlers.refreshFeedSubscription)
  .openapi(routes.listFeedItems, handlers.listFeedItems)
  .openapi(routes.saveFeedItem, handlers.saveFeedItem)
  .openapi(routes.dismissFeedItem, handlers.dismissFeedItem);

export default router;
