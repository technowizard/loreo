import { and, desc, eq, isNull, lte, or } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import type * as schema from '@/db/schemas/index.js';
import { feedSubscriptionsTable } from '@/db/schemas/index.js';

type DrizzleClient = NodePgDatabase<typeof schema>;

export type FeedSubscriptionStatus = 'active' | 'paused';

export interface FeedSubscriptionData {
  id: string;
  userId: string;
  feedUrl: string;
  normalizedFeedUrl: string;
  siteUrl: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  autoSave: boolean;
  status: FeedSubscriptionStatus;
  lastFetchedAt: Date | null;
  lastSuccessfulFetchAt: Date | null;
  nextFetchAfter: Date | null;
  lastError: string | null;
  failureCount: number;
  etag: string | null;
  lastModified: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type CreateFeedSubscriptionData = Pick<
  FeedSubscriptionData,
  'feedUrl' | 'normalizedFeedUrl' | 'title' | 'userId'
> &
  Partial<
    Pick<
      FeedSubscriptionData,
      | 'autoSave'
      | 'description'
      | 'etag'
      | 'imageUrl'
      | 'lastModified'
      | 'nextFetchAfter'
      | 'siteUrl'
    >
  >;

type UpdateFeedSubscriptionData = Partial<
  Pick<
    FeedSubscriptionData,
    | 'autoSave'
    | 'description'
    | 'etag'
    | 'failureCount'
    | 'feedUrl'
    | 'imageUrl'
    | 'lastError'
    | 'lastFetchedAt'
    | 'lastModified'
    | 'lastSuccessfulFetchAt'
    | 'nextFetchAfter'
    | 'siteUrl'
    | 'status'
    | 'title'
  >
>;

const subscriptionColumns = {
  id: feedSubscriptionsTable.id,
  userId: feedSubscriptionsTable.userId,
  feedUrl: feedSubscriptionsTable.feedUrl,
  normalizedFeedUrl: feedSubscriptionsTable.normalizedFeedUrl,
  siteUrl: feedSubscriptionsTable.siteUrl,
  title: feedSubscriptionsTable.title,
  description: feedSubscriptionsTable.description,
  imageUrl: feedSubscriptionsTable.imageUrl,
  autoSave: feedSubscriptionsTable.autoSave,
  status: feedSubscriptionsTable.status,
  lastFetchedAt: feedSubscriptionsTable.lastFetchedAt,
  lastSuccessfulFetchAt: feedSubscriptionsTable.lastSuccessfulFetchAt,
  nextFetchAfter: feedSubscriptionsTable.nextFetchAfter,
  lastError: feedSubscriptionsTable.lastError,
  failureCount: feedSubscriptionsTable.failureCount,
  etag: feedSubscriptionsTable.etag,
  lastModified: feedSubscriptionsTable.lastModified,
  createdAt: feedSubscriptionsTable.createdAt,
  updatedAt: feedSubscriptionsTable.updatedAt
};

export interface FeedSubscriptionsRepository {
  create(data: CreateFeedSubscriptionData): Promise<FeedSubscriptionData>;
  delete(id: string, userId: string): Promise<boolean>;
  findById(id: string, userId: string): Promise<FeedSubscriptionData | null>;
  findByNormalizedUrl(
    normalizedFeedUrl: string,
    userId: string
  ): Promise<FeedSubscriptionData | null>;
  findDue(now: Date, limit?: number): Promise<FeedSubscriptionData[]>;
  findManyByUserId(userId: string): Promise<FeedSubscriptionData[]>;
  update(
    id: string,
    userId: string,
    updates: UpdateFeedSubscriptionData
  ): Promise<FeedSubscriptionData | null>;
  updateFetchMetadata(
    id: string,
    userId: string,
    updates: Pick<
      UpdateFeedSubscriptionData,
      | 'etag'
      | 'failureCount'
      | 'lastError'
      | 'lastFetchedAt'
      | 'lastModified'
      | 'lastSuccessfulFetchAt'
      | 'nextFetchAfter'
    >
  ): Promise<FeedSubscriptionData | null>;
}

export function createDrizzleFeedSubscriptionsAdapter(
  db: DrizzleClient
): FeedSubscriptionsRepository {
  async function findById(id: string, userId: string): Promise<FeedSubscriptionData | null> {
    const [row] = await db
      .select(subscriptionColumns)
      .from(feedSubscriptionsTable)
      .where(and(eq(feedSubscriptionsTable.id, id), eq(feedSubscriptionsTable.userId, userId)))
      .limit(1);

    return (row as FeedSubscriptionData | undefined) ?? null;
  }

  async function update(
    id: string,
    userId: string,
    updates: UpdateFeedSubscriptionData
  ): Promise<FeedSubscriptionData | null> {
    const [row] = await db
      .update(feedSubscriptionsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(feedSubscriptionsTable.id, id), eq(feedSubscriptionsTable.userId, userId)))
      .returning(subscriptionColumns);

    return (row as FeedSubscriptionData | undefined) ?? null;
  }

  return {
    findById,
    update,

    async create(data) {
      const [row] = await db
        .insert(feedSubscriptionsTable)
        .values({
          autoSave: data.autoSave ?? false,
          description: data.description ?? null,
          etag: data.etag ?? null,
          feedUrl: data.feedUrl,
          imageUrl: data.imageUrl ?? null,
          lastModified: data.lastModified ?? null,
          nextFetchAfter: data.nextFetchAfter ?? null,
          normalizedFeedUrl: data.normalizedFeedUrl,
          siteUrl: data.siteUrl ?? null,
          title: data.title,
          userId: data.userId
        })
        .returning(subscriptionColumns);

      if (!row) throw new Error('Failed to create feed subscription');
      return row as FeedSubscriptionData;
    },

    async delete(id, userId) {
      const rows = await db
        .delete(feedSubscriptionsTable)
        .where(and(eq(feedSubscriptionsTable.id, id), eq(feedSubscriptionsTable.userId, userId)))
        .returning({ id: feedSubscriptionsTable.id });

      return rows.length > 0;
    },

    async findByNormalizedUrl(normalizedFeedUrl, userId) {
      const [row] = await db
        .select(subscriptionColumns)
        .from(feedSubscriptionsTable)
        .where(
          and(
            eq(feedSubscriptionsTable.normalizedFeedUrl, normalizedFeedUrl),
            eq(feedSubscriptionsTable.userId, userId)
          )
        )
        .limit(1);

      return (row as FeedSubscriptionData | undefined) ?? null;
    },

    async findDue(now, limit = 50) {
      const rows = await db
        .select(subscriptionColumns)
        .from(feedSubscriptionsTable)
        .where(
          and(
            eq(feedSubscriptionsTable.status, 'active'),
            or(
              isNull(feedSubscriptionsTable.nextFetchAfter),
              lte(feedSubscriptionsTable.nextFetchAfter, now)
            )
          )
        )
        .orderBy(feedSubscriptionsTable.nextFetchAfter, feedSubscriptionsTable.createdAt)
        .limit(limit);

      return rows as FeedSubscriptionData[];
    },

    async findManyByUserId(userId) {
      const rows = await db
        .select(subscriptionColumns)
        .from(feedSubscriptionsTable)
        .where(eq(feedSubscriptionsTable.userId, userId))
        .orderBy(desc(feedSubscriptionsTable.createdAt));

      return rows as FeedSubscriptionData[];
    },

    updateFetchMetadata: update
  };
}
