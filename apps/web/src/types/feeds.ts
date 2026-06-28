export type FeedSubscriptionStatus = 'active' | 'paused';
export type FeedItemState = 'new' | 'dismissed' | 'saved';

export type FeedSubscription = {
  autoSave: boolean;
  createdAt: string;
  description: string | null;
  etag: string | null;
  failureCount: number;
  feedUrl: string;
  id: string;
  imageUrl: string | null;
  lastError: string | null;
  lastFetchedAt: string | null;
  lastModified: string | null;
  lastSuccessfulFetchAt: string | null;
  nextFetchAfter: string | null;
  normalizedFeedUrl: string;
  siteUrl: string | null;
  status: FeedSubscriptionStatus;
  title: string;
  updatedAt: string;
  userId: string;
};

export type FeedItem = {
  author: string | null;
  createdAt: string;
  discoveredAt: string;
  dismissedAt: string | null;
  excerpt: string | null;
  guid: string | null;
  id: string;
  imageUrl: string | null;
  linkId: string | null;
  normalizedUrl: string;
  publishedAt: string | null;
  savedAt: string | null;
  state: FeedItemState;
  subscriptionId: string;
  title: string;
  updatedAt: string;
  url: string;
  userId: string;
};

export type CreateFeedSubscriptionBody = {
  autoSave?: boolean;
  feedUrl: string;
};

export type UpdateFeedSubscriptionBody = Partial<Pick<FeedSubscription, 'autoSave' | 'status'>>;

export type CreateFeedSubscriptionResult = {
  autoSaved: number;
  createdSubscription: boolean;
  fetched: boolean;
  pruned: number;
  staged: number;
  subscription: FeedSubscription;
};

export type RefreshFeedSubscriptionResult = {
  jobId?: string;
  subscriptionId: string;
};

export type SaveFeedItemResult = {
  item: FeedItem;
  linkId: string;
  reusedLink: boolean;
};

export type FeedItemFilters = {
  state?: FeedItemState;
  subscriptionId?: string;
};
