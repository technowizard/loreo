import { createRoute, z } from '@hono/zod-openapi';

import { jsonContent, jsonContentRequired } from '@/lib/openapi.js';
import { errorResponseSchema, HttpStatus, successResponseSchema } from '@/lib/response.js';

import { currentUser } from '@/middlewares/current-user.js';
import { addFeedRateLimit, refreshFeedRateLimit } from '@/middlewares/rate-limit.js';

const tags = ['Feeds'];

const feedSubscriptionSchema = z.object({
  autoSave: z.boolean(),
  createdAt: z.date(),
  description: z.string().nullable(),
  etag: z.string().nullable(),
  failureCount: z.number(),
  feedUrl: z.string(),
  id: z.string(),
  imageUrl: z.string().nullable(),
  lastError: z.string().nullable(),
  lastFetchedAt: z.date().nullable(),
  lastModified: z.string().nullable(),
  lastSuccessfulFetchAt: z.date().nullable(),
  nextFetchAfter: z.date().nullable(),
  normalizedFeedUrl: z.string(),
  siteUrl: z.string().nullable(),
  status: z.enum(['active', 'paused']),
  title: z.string(),
  updatedAt: z.date(),
  userId: z.string()
});

const feedItemSchema = z.object({
  author: z.string().nullable(),
  createdAt: z.date(),
  discoveredAt: z.date(),
  dismissedAt: z.date().nullable(),
  excerpt: z.string().nullable(),
  guid: z.string().nullable(),
  id: z.string(),
  imageUrl: z.string().nullable(),
  linkId: z.string().nullable(),
  normalizedUrl: z.string(),
  publishedAt: z.date().nullable(),
  savedAt: z.date().nullable(),
  state: z.enum(['new', 'dismissed', 'saved']),
  subscriptionId: z.string(),
  title: z.string(),
  updatedAt: z.date(),
  url: z.string(),
  userId: z.string()
});

export const listFeedSubscriptions = createRoute({
  tags,
  method: 'get',
  path: '/feeds/subscriptions',
  middleware: [currentUser],
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(z.array(feedSubscriptionSchema)),
      'Feed subscriptions fetched successfully'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), '')
  }
});

export const createFeedSubscription = createRoute({
  tags,
  method: 'post',
  path: '/feeds/subscriptions',
  middleware: [currentUser, addFeedRateLimit],
  request: {
    body: jsonContentRequired(
      z.object({ autoSave: z.boolean().optional(), feedUrl: z.string().url() }),
      'Add feed subscription'
    )
  },
  responses: {
    [HttpStatus.ACCEPTED]: jsonContent(
      successResponseSchema(
        z.object({
          autoSaved: z.number(),
          createdSubscription: z.boolean(),
          fetched: z.boolean(),
          pruned: z.number(),
          staged: z.number(),
          subscription: feedSubscriptionSchema
        }),
        HttpStatus.ACCEPTED
      ),
      'Feed subscription added'
    ),
    [HttpStatus.FORBIDDEN]: jsonContent(errorResponseSchema(HttpStatus.FORBIDDEN), ''),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), '')
  }
});

export const updateFeedSubscription = createRoute({
  tags,
  method: 'patch',
  path: '/feeds/subscriptions/:id',
  middleware: [currentUser],
  request: {
    params: z.object({ id: z.string() }),
    body: jsonContentRequired(
      z.object({
        autoSave: z.boolean().optional(),
        status: z.enum(['active', 'paused']).optional()
      }),
      'Update feed subscription'
    )
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(feedSubscriptionSchema),
      'Feed subscription updated'
    ),
    [HttpStatus.FORBIDDEN]: jsonContent(errorResponseSchema(HttpStatus.FORBIDDEN), ''),
    [HttpStatus.NOT_FOUND]: jsonContent(errorResponseSchema(HttpStatus.NOT_FOUND), ''),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), '')
  }
});

export const refreshFeedSubscription = createRoute({
  tags,
  method: 'post',
  path: '/feeds/subscriptions/:id/refresh',
  middleware: [currentUser, refreshFeedRateLimit],
  request: {
    params: z.object({ id: z.string() })
  },
  responses: {
    [HttpStatus.ACCEPTED]: jsonContent(
      successResponseSchema(
        z.object({ jobId: z.string().optional(), subscriptionId: z.string() }),
        HttpStatus.ACCEPTED
      ),
      'Feed refresh queued'
    ),
    [HttpStatus.FORBIDDEN]: jsonContent(errorResponseSchema(HttpStatus.FORBIDDEN), ''),
    [HttpStatus.NOT_FOUND]: jsonContent(errorResponseSchema(HttpStatus.NOT_FOUND), ''),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), '')
  }
});

export const listFeedItems = createRoute({
  tags,
  method: 'get',
  path: '/feeds/items',
  middleware: [currentUser],
  request: {
    query: z.object({
      state: z.enum(['new', 'dismissed', 'saved']).optional(),
      subscriptionId: z.string().optional()
    })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(z.array(feedItemSchema)),
      'Feed items fetched successfully'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), '')
  }
});

export const saveFeedItem = createRoute({
  tags,
  method: 'post',
  path: '/feeds/items/:id/save',
  middleware: [currentUser],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(
        z.object({ item: feedItemSchema, linkId: z.string(), reusedLink: z.boolean() })
      ),
      'Feed item saved'
    ),
    [HttpStatus.FORBIDDEN]: jsonContent(errorResponseSchema(HttpStatus.FORBIDDEN), ''),
    [HttpStatus.NOT_FOUND]: jsonContent(errorResponseSchema(HttpStatus.NOT_FOUND), ''),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), '')
  }
});

export const dismissFeedItem = createRoute({
  tags,
  method: 'post',
  path: '/feeds/items/:id/dismiss',
  middleware: [currentUser],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    [HttpStatus.OK]: jsonContent(successResponseSchema(feedItemSchema), 'Feed item dismissed'),
    [HttpStatus.FORBIDDEN]: jsonContent(errorResponseSchema(HttpStatus.FORBIDDEN), ''),
    [HttpStatus.NOT_FOUND]: jsonContent(errorResponseSchema(HttpStatus.NOT_FOUND), ''),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), '')
  }
});
