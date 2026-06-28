import type { FeedItemFilters } from '@/types/feeds';

export const feedKeys = {
  all: ['feeds'] as const,
  subscriptions: () => [...feedKeys.all, 'subscriptions'] as const,
  items: () => [...feedKeys.all, 'items'] as const,
  itemList: (filters?: FeedItemFilters) => [...feedKeys.items(), { filters }] as const
};
