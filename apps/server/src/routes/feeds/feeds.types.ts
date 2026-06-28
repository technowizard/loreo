import type {
  createFeedSubscription,
  dismissFeedItem,
  listFeedItems,
  listFeedSubscriptions,
  refreshFeedSubscription,
  saveFeedItem,
  updateFeedSubscription
} from './feeds.routes.js';

export type ListFeedSubscriptionsRoute = typeof listFeedSubscriptions;
export type CreateFeedSubscriptionRoute = typeof createFeedSubscription;
export type UpdateFeedSubscriptionRoute = typeof updateFeedSubscription;
export type RefreshFeedSubscriptionRoute = typeof refreshFeedSubscription;
export type ListFeedItemsRoute = typeof listFeedItems;
export type SaveFeedItemRoute = typeof saveFeedItem;
export type DismissFeedItemRoute = typeof dismissFeedItem;
