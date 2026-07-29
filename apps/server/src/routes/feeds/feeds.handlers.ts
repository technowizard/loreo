import { enqueueFeedPollJob } from '@/queues/feed-poll.queue.js';

import { demoModeForbiddenResponse, isDemoMode } from '@/lib/demo-mode.js';
import { HttpStatus, errorResponse, successResponse } from '@/lib/response.js';
import type { AppRouteHandler } from '@/lib/types.js';

import { createFeedIngestionService } from '@/services/feed-ingestion.service.js';
import { saveLink } from '@/services/link-save.service.js';

import type {
  CreateFeedSubscriptionRoute,
  DeleteFeedSubscriptionRoute,
  DismissFeedItemRoute,
  GetFeedSubscriptionSummaryRoute,
  ListFeedItemsRoute,
  ListFeedSubscriptionsRoute,
  RefreshFeedSubscriptionRoute,
  SaveFeedItemRoute,
  UpdateFeedSubscriptionRoute
} from './feeds.types.js';

function requireFeedRepos(c: Parameters<AppRouteHandler<ListFeedSubscriptionsRoute>>[0]) {
  const repos = c.get('repos');
  if (!repos.feedItems || !repos.feedSubscriptions) {
    throw new Error('Feed repositories are not configured');
  }
  return { ...repos, feedItems: repos.feedItems, feedSubscriptions: repos.feedSubscriptions };
}

export const listFeedSubscriptions: AppRouteHandler<ListFeedSubscriptionsRoute> = async (c) => {
  const user = c.get('user');
  const repos = requireFeedRepos(c);

  try {
    const subscriptions = await repos.feedSubscriptions.findManyByUserId(user.id);
    const response = successResponse(subscriptions, 'Feed subscriptions fetched successfully');
    return c.json(response, response.status);
  } catch {
    const response = errorResponse(
      'An error occurred when fetching feed subscriptions',
      HttpStatus.BAD_REQUEST
    );
    return c.json(response, response.status);
  }
};

export const createFeedSubscription: AppRouteHandler<CreateFeedSubscriptionRoute> = async (c) => {
  if (isDemoMode()) return c.json(demoModeForbiddenResponse(), HttpStatus.FORBIDDEN);

  const user = c.get('user');
  const repos = requireFeedRepos(c);
  const { autoSave, feedUrl } = c.req.valid('json');

  try {
    const ingestion = createFeedIngestionService({ repos });
    const result = await ingestion.addSubscription({ autoSave, feedUrl, user });
    const response = successResponse(result, 'Feed subscription added', HttpStatus.ACCEPTED);
    return c.json(response, response.status);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred when adding feed';
    const response = errorResponse(message, HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }
};

export const getFeedSubscriptionSummary: AppRouteHandler<GetFeedSubscriptionSummaryRoute> = async (
  c
) => {
  const user = c.get('user');
  const repos = requireFeedRepos(c);
  const { id } = c.req.valid('param');

  try {
    const subscription = await repos.feedSubscriptions.findById(id, user.id);
    if (!subscription) {
      const response = errorResponse('Feed subscription not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const summary = await repos.feedItems.summarizeBySubscription(id, user.id);
    const response = successResponse(summary, 'Feed subscription summary fetched successfully');
    return c.json(response, response.status);
  } catch {
    const response = errorResponse(
      'An error occurred when fetching feed subscription summary',
      HttpStatus.BAD_REQUEST
    );
    return c.json(response, response.status);
  }
};

export const updateFeedSubscription: AppRouteHandler<UpdateFeedSubscriptionRoute> = async (c) => {
  if (isDemoMode()) return c.json(demoModeForbiddenResponse(), HttpStatus.FORBIDDEN);

  const user = c.get('user');
  const repos = requireFeedRepos(c);
  const { id } = c.req.valid('param');
  const updates = c.req.valid('json');

  try {
    const subscription = await repos.feedSubscriptions.update(id, user.id, updates);
    if (!subscription) {
      const response = errorResponse('Feed subscription not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const response = successResponse(subscription, 'Feed subscription updated');
    return c.json(response, response.status);
  } catch {
    const response = errorResponse(
      'An error occurred when updating feed subscription',
      HttpStatus.BAD_REQUEST
    );
    return c.json(response, response.status);
  }
};

export const deleteFeedSubscription: AppRouteHandler<DeleteFeedSubscriptionRoute> = async (c) => {
  if (isDemoMode()) return c.json(demoModeForbiddenResponse(), HttpStatus.FORBIDDEN);

  const user = c.get('user');
  const repos = requireFeedRepos(c);
  const { id } = c.req.valid('param');

  try {
    const deleted = await repos.feedSubscriptions.delete(id, user.id);
    if (!deleted) {
      const response = errorResponse('Feed subscription not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const response = successResponse({ id }, 'Feed subscription deleted successfully');
    return c.json(response, response.status);
  } catch {
    const response = errorResponse(
      'An error occurred when deleting feed subscription',
      HttpStatus.BAD_REQUEST
    );
    return c.json(response, response.status);
  }
};

export const refreshFeedSubscription: AppRouteHandler<RefreshFeedSubscriptionRoute> = async (c) => {
  if (isDemoMode()) return c.json(demoModeForbiddenResponse(), HttpStatus.FORBIDDEN);

  const user = c.get('user');
  const repos = requireFeedRepos(c);
  const { id } = c.req.valid('param');

  try {
    const subscription = await repos.feedSubscriptions.findById(id, user.id);
    if (!subscription) {
      const response = errorResponse('Feed subscription not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const job = await enqueueFeedPollJob({
      force: true,
      reason: 'manual',
      subscriptionId: id,
      userId: user.id
    });
    const response = successResponse(
      { jobId: job.id?.toString(), subscriptionId: id },
      'Feed refresh queued',
      HttpStatus.ACCEPTED
    );
    return c.json(response, response.status);
  } catch {
    const response = errorResponse(
      'An error occurred when refreshing feed subscription',
      HttpStatus.BAD_REQUEST
    );
    return c.json(response, response.status);
  }
};

export const listFeedItems: AppRouteHandler<ListFeedItemsRoute> = async (c) => {
  const user = c.get('user');
  const repos = requireFeedRepos(c);
  const { cursor, limit, sort, state, subscriptionId } = c.req.valid('query');
  const pageLimit = Math.max(1, Math.min(limit ? Number(limit) : 24, 60));

  try {
    const page = await repos.feedItems.findManyForReview({
      cursor,
      limit: pageLimit,
      sort,
      state,
      subscriptionId,
      userId: user.id
    });
    return c.json(
      {
        message: 'Feed items fetched successfully',
        pagination: {
          hasMore: page.hasMore,
          limit: pageLimit,
          nextCursor: page.nextCursor,
          total: page.total,
          totalReturned: page.items.length
        },
        result: page.items,
        status: HttpStatus.OK
      },
      HttpStatus.OK
    );
  } catch {
    const response = errorResponse(
      'An error occurred when fetching feed items',
      HttpStatus.BAD_REQUEST
    );
    return c.json(response, response.status);
  }
};

export const saveFeedItem: AppRouteHandler<SaveFeedItemRoute> = async (c) => {
  if (isDemoMode()) return c.json(demoModeForbiddenResponse(), HttpStatus.FORBIDDEN);

  const user = c.get('user');
  const repos = requireFeedRepos(c);
  const { id } = c.req.valid('param');

  try {
    const item = await repos.feedItems.findById(id, user.id);
    if (!item) {
      const response = errorResponse('Feed item not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const saved = await saveLink({ repos, user, url: item.url });
    const updated = await repos.feedItems.save(item.id, user.id, saved.link.id);
    if (!updated) {
      const response = errorResponse('Feed item not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const response = successResponse(
      { item: updated, linkId: saved.link.id, reusedLink: !saved.created },
      'Feed item saved'
    );
    return c.json(response, response.status);
  } catch {
    const response = errorResponse(
      'An error occurred when saving feed item',
      HttpStatus.BAD_REQUEST
    );
    return c.json(response, response.status);
  }
};

export const dismissFeedItem: AppRouteHandler<DismissFeedItemRoute> = async (c) => {
  if (isDemoMode()) return c.json(demoModeForbiddenResponse(), HttpStatus.FORBIDDEN);

  const user = c.get('user');
  const repos = requireFeedRepos(c);
  const { id } = c.req.valid('param');

  try {
    const item = await repos.feedItems.dismiss(id, user.id);
    if (!item) {
      const response = errorResponse('Feed item not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const response = successResponse(item, 'Feed item dismissed');
    return c.json(response, response.status);
  } catch {
    const response = errorResponse(
      'An error occurred when dismissing feed item',
      HttpStatus.BAD_REQUEST
    );
    return c.json(response, response.status);
  }
};
