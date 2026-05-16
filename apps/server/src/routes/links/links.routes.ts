import { createRoute, z } from '@hono/zod-openapi';

import { createLinkSchema, selectLinksListSchema, selectLinksSchema } from '@/db/schemas/index.js';

import { jsonContent, jsonContentRequired } from '@/lib/openapi.js';
import {
  errorResponseSchema,
  HttpStatus,
  paginatedSuccessResponseSchema,
  successResponseSchema
} from '@/lib/response.js';

import { currentUser } from '@/middlewares/current-user.js';
import { createLinkRateLimit } from '@/middlewares/rate-limit.js';

const tags = ['Links'];

export const getLinks = createRoute({
  tags,
  method: 'get',
  path: '/links',
  middleware: [currentUser],
  request: {
    query: z.object({
      archived: z.boolean().optional(),
      groups: z.string().optional(),
      cursor: z.string().optional(),
      favorite: z.boolean().optional(),
      filter: z.string().optional(),
      limit: z.string().optional(),
      priority: z.string().optional(),
      q: z.string().optional().describe('Search query for title, url, and excerpt'),
      readLength: z.string().optional(),
      sort: z.string().optional(),
      tags: z.string().optional()
    })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      paginatedSuccessResponseSchema(selectLinksListSchema),
      'Links fetched successfully'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), '')
  }
});

export const getLinkById = createRoute({
  tags,
  method: 'get',
  path: '/links/:id',
  middleware: [currentUser],
  request: {
    params: z.object({ id: z.string() })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(selectLinksSchema),
      'Link fetched successfully'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), ''),
    [HttpStatus.NOT_FOUND]: jsonContent(errorResponseSchema(HttpStatus.NOT_FOUND), '')
  }
});

export const getUpcomingLinks = createRoute({
  tags,
  method: 'get',
  path: '/links/:id/upcoming',
  middleware: [currentUser],
  request: {
    params: z.object({ id: z.string() })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(z.array(selectLinksSchema)),
      'Upcoming articles fetched successfully'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      ''
    )
  }
});

export const createLink = createRoute({
  tags,
  method: 'post',
  path: '/links',
  middleware: [currentUser, createLinkRateLimit],
  request: {
    body: jsonContentRequired(createLinkSchema, '')
  },
  responses: {
    [HttpStatus.ACCEPTED]: jsonContent(
      successResponseSchema(
        z.object({
          id: z.string(),
          url: z.string()
        }),
        HttpStatus.ACCEPTED
      ),
      'User Registration Success'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), ''),
    [HttpStatus.CONFLICT]: jsonContent(
      errorResponseSchema(HttpStatus.CONFLICT),
      'URL already exists in library'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      ''
    )
  }
});

export const refetchLink = createRoute({
  tags,
  method: 'post',
  path: '/links/refetch/:id',
  middleware: [currentUser],
  request: {
    params: z.object({ id: z.string() })
  },
  responses: {
    [HttpStatus.ACCEPTED]: jsonContent(
      successResponseSchema(
        z.object({
          id: z.string(),
          processingStatus: z.string(),
          url: z.string()
        }),
        HttpStatus.ACCEPTED
      ),
      'Link enqueued for reprocessing'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(errorResponseSchema(HttpStatus.NOT_FOUND), ''),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      ''
    )
  }
});

export const updateLink = createRoute({
  tags,
  method: 'patch',
  path: '/links/:id',
  middleware: [currentUser],
  request: {
    body: jsonContentRequired(
      z.object({
        priority: z.string().optional(),
        readingProgress: z.number().optional(),
        timeSpentReading: z.number().optional(),
        isFavorite: z.boolean().optional(),
        isArchived: z.boolean().optional(),
        isRead: z.boolean().optional()
      }),
      'Link updated successfully'
    ),
    params: z.object({ id: z.string() })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(successResponseSchema(selectLinksSchema), 'Link update success'),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), ''),
    [HttpStatus.NOT_FOUND]: jsonContent(errorResponseSchema(HttpStatus.NOT_FOUND), ''),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      ''
    )
  }
});

export const deleteLink = createRoute({
  tags,
  method: 'delete',
  path: '/links/:id',
  middleware: [currentUser],
  request: {
    params: z.object({ id: z.string() })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(z.object({ id: z.string() })),
      'Link deleted successfully'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), ''),
    [HttpStatus.NOT_FOUND]: jsonContent(errorResponseSchema(HttpStatus.NOT_FOUND), '')
  }
});

export const updateLinkTags = createRoute({
  tags,
  method: 'put',
  path: '/links/:id/tags',
  middleware: [currentUser],
  request: {
    params: z.object({ id: z.string() }),
    body: jsonContentRequired(
      z.object({
        tags: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            groupId: z.string()
          })
        )
      }),
      'Replace all tags on link'
    )
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(
        z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            groupId: z.string()
          })
        )
      ),
      'Link tags updated successfully'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Invalid request'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(
      errorResponseSchema(HttpStatus.NOT_FOUND),
      'Link not found'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      ''
    )
  }
});

export const searchLinks = createRoute({
  tags,
  method: 'get',
  path: '/search',
  middleware: [currentUser],
  request: {
    query: z.object({
      q: z.string().min(1).describe('Search query for suggestions'),
      limit: z.number().optional().default(5).describe('Maximum number of suggestions')
    })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(
        z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            url: z.string(),
            excerpt: z.string().nullable()
          })
        )
      ),
      'Search suggestions fetched successfully'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), '')
  }
});

export type GetLinksRoute = typeof getLinks;
export type GetLinkByIdRoute = typeof getLinkById;
export type GetUpcomingLinksRoute = typeof getUpcomingLinks;
export type CreateLinkRoute = typeof createLink;
export type RefetchLinkRoute = typeof refetchLink;
export type UpdateLinkRoute = typeof updateLink;
export type DeleteLinkRoute = typeof deleteLink;
export type SearchLinksRoute = typeof searchLinks;
export type UpdateLinkTagsRoute = typeof updateLinkTags;
