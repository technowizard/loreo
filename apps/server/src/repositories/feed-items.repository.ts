import { and, desc, eq, inArray, lt, ne, or } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import type * as schema from '@/db/schemas/index.js';
import { feedItemsTable } from '@/db/schemas/index.js';

type DrizzleClient = NodePgDatabase<typeof schema>;

export type FeedItemState = 'new' | 'dismissed' | 'saved';

export interface FeedItemData {
  id: string;
  subscriptionId: string;
  userId: string;
  linkId: string | null;
  guid: string | null;
  url: string;
  normalizedUrl: string;
  title: string;
  excerpt: string | null;
  author: string | null;
  publishedAt: Date | null;
  imageUrl: string | null;
  state: FeedItemState;
  discoveredAt: Date;
  savedAt: Date | null;
  dismissedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateFeedItemData = Pick<
  FeedItemData,
  'normalizedUrl' | 'subscriptionId' | 'title' | 'url' | 'userId'
> &
  Partial<
    Pick<
      FeedItemData,
      | 'author'
      | 'discoveredAt'
      | 'excerpt'
      | 'guid'
      | 'imageUrl'
      | 'linkId'
      | 'publishedAt'
      | 'state'
    >
  >;

type UpdateFeedItemData = Partial<
  Pick<
    FeedItemData,
    | 'author'
    | 'dismissedAt'
    | 'discoveredAt'
    | 'excerpt'
    | 'guid'
    | 'imageUrl'
    | 'linkId'
    | 'normalizedUrl'
    | 'publishedAt'
    | 'savedAt'
    | 'state'
    | 'title'
    | 'url'
  >
>;

const itemColumns = {
  id: feedItemsTable.id,
  subscriptionId: feedItemsTable.subscriptionId,
  userId: feedItemsTable.userId,
  linkId: feedItemsTable.linkId,
  guid: feedItemsTable.guid,
  url: feedItemsTable.url,
  normalizedUrl: feedItemsTable.normalizedUrl,
  title: feedItemsTable.title,
  excerpt: feedItemsTable.excerpt,
  author: feedItemsTable.author,
  publishedAt: feedItemsTable.publishedAt,
  imageUrl: feedItemsTable.imageUrl,
  state: feedItemsTable.state,
  discoveredAt: feedItemsTable.discoveredAt,
  savedAt: feedItemsTable.savedAt,
  dismissedAt: feedItemsTable.dismissedAt,
  createdAt: feedItemsTable.createdAt,
  updatedAt: feedItemsTable.updatedAt
};

export interface FeedItemsRepository {
  create(data: CreateFeedItemData): Promise<FeedItemData>;
  dismiss(id: string, userId: string, dismissedAt?: Date): Promise<FeedItemData | null>;
  findById(id: string, userId: string): Promise<FeedItemData | null>;
  findBySubscriptionAndIdentity(input: {
    guid?: string | null;
    normalizedUrl: string;
    subscriptionId: string;
    userId: string;
  }): Promise<FeedItemData | null>;
  findManyForReview(input: {
    state?: FeedItemState;
    subscriptionId?: string;
    userId: string;
  }): Promise<FeedItemData[]>;
  pruneForSubscription(input: {
    before: Date;
    keepLatest: number;
    subscriptionId: string;
    userId: string;
  }): Promise<number>;
  reconcileSavedByUrl(input: {
    linkId: string;
    normalizedUrl: string;
    savedAt?: Date;
    userId: string;
  }): Promise<FeedItemData[]>;
  save(id: string, userId: string, linkId: string, savedAt?: Date): Promise<FeedItemData | null>;
  upsertByIdentity(data: CreateFeedItemData): Promise<FeedItemData>;
}

export function createDrizzleFeedItemsAdapter(db: DrizzleClient): FeedItemsRepository {
  async function findById(id: string, userId: string): Promise<FeedItemData | null> {
    const [row] = await db
      .select(itemColumns)
      .from(feedItemsTable)
      .where(and(eq(feedItemsTable.id, id), eq(feedItemsTable.userId, userId)))
      .limit(1);

    return (row as FeedItemData | undefined) ?? null;
  }

  async function update(
    id: string,
    userId: string,
    updates: UpdateFeedItemData
  ): Promise<FeedItemData | null> {
    const [row] = await db
      .update(feedItemsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(feedItemsTable.id, id), eq(feedItemsTable.userId, userId)))
      .returning(itemColumns);

    return (row as FeedItemData | undefined) ?? null;
  }

  return {
    findById,

    async create(data) {
      const [row] = await db
        .insert(feedItemsTable)
        .values({
          author: data.author ?? null,
          discoveredAt: data.discoveredAt ?? new Date(),
          excerpt: data.excerpt ?? null,
          guid: data.guid ?? null,
          imageUrl: data.imageUrl ?? null,
          linkId: data.linkId ?? null,
          normalizedUrl: data.normalizedUrl,
          publishedAt: data.publishedAt ?? null,
          state: data.state ?? 'new',
          subscriptionId: data.subscriptionId,
          title: data.title,
          url: data.url,
          userId: data.userId
        })
        .returning(itemColumns);

      if (!row) throw new Error('Failed to create feed item');
      return row as FeedItemData;
    },

    async dismiss(id, userId, dismissedAt = new Date()) {
      return update(id, userId, { dismissedAt, state: 'dismissed' });
    },

    async findBySubscriptionAndIdentity({ guid, normalizedUrl, subscriptionId, userId }) {
      const identityCondition = guid
        ? or(eq(feedItemsTable.guid, guid), eq(feedItemsTable.normalizedUrl, normalizedUrl))
        : eq(feedItemsTable.normalizedUrl, normalizedUrl);

      const [row] = await db
        .select(itemColumns)
        .from(feedItemsTable)
        .where(
          and(
            eq(feedItemsTable.subscriptionId, subscriptionId),
            eq(feedItemsTable.userId, userId),
            identityCondition
          )
        )
        .limit(1);

      return (row as FeedItemData | undefined) ?? null;
    },

    async findManyForReview({ state, subscriptionId, userId }) {
      const conditions = [eq(feedItemsTable.userId, userId)];

      if (state) conditions.push(eq(feedItemsTable.state, state));
      if (subscriptionId) conditions.push(eq(feedItemsTable.subscriptionId, subscriptionId));

      const rows = await db
        .select(itemColumns)
        .from(feedItemsTable)
        .where(and(...conditions))
        .orderBy(desc(feedItemsTable.publishedAt), desc(feedItemsTable.discoveredAt));

      return rows as FeedItemData[];
    },

    async pruneForSubscription({ before, keepLatest, subscriptionId, userId }) {
      const oldRows = await db
        .delete(feedItemsTable)
        .where(
          and(
            eq(feedItemsTable.subscriptionId, subscriptionId),
            eq(feedItemsTable.userId, userId),
            ne(feedItemsTable.state, 'saved'),
            lt(feedItemsTable.discoveredAt, before)
          )
        )
        .returning({ id: feedItemsTable.id });

      const excessRows = await db
        .select({ id: feedItemsTable.id })
        .from(feedItemsTable)
        .where(
          and(
            eq(feedItemsTable.subscriptionId, subscriptionId),
            eq(feedItemsTable.userId, userId),
            ne(feedItemsTable.state, 'saved')
          )
        )
        .orderBy(desc(feedItemsTable.discoveredAt), desc(feedItemsTable.createdAt))
        .offset(keepLatest);

      if (excessRows.length === 0) return oldRows.length;

      const removedExcess = await db
        .delete(feedItemsTable)
        .where(
          inArray(
            feedItemsTable.id,
            excessRows.map((row) => row.id)
          )
        )
        .returning({ id: feedItemsTable.id });

      return oldRows.length + removedExcess.length;
    },

    async reconcileSavedByUrl({ linkId, normalizedUrl, savedAt = new Date(), userId }) {
      const rows = await db
        .update(feedItemsTable)
        .set({ linkId, savedAt, state: 'saved', updatedAt: new Date() })
        .where(
          and(eq(feedItemsTable.userId, userId), eq(feedItemsTable.normalizedUrl, normalizedUrl))
        )
        .returning(itemColumns);

      return rows as FeedItemData[];
    },

    async save(id, userId, linkId, savedAt = new Date()) {
      return update(id, userId, { linkId, savedAt, state: 'saved' });
    },

    async upsertByIdentity(data) {
      const existing = await this.findBySubscriptionAndIdentity({
        guid: data.guid,
        normalizedUrl: data.normalizedUrl,
        subscriptionId: data.subscriptionId,
        userId: data.userId
      });

      if (!existing) return this.create(data);

      const updated = await update(existing.id, data.userId, {
        author: data.author ?? existing.author,
        excerpt: data.excerpt ?? existing.excerpt,
        guid: data.guid ?? existing.guid,
        imageUrl: data.imageUrl ?? existing.imageUrl,
        normalizedUrl: data.normalizedUrl,
        publishedAt: data.publishedAt ?? existing.publishedAt,
        title: data.title,
        url: data.url
      });

      if (!updated) throw new Error('Failed to update feed item');
      return updated;
    }
  };
}
