import { createRoute, z } from '@hono/zod-openapi';

import { selectHighlightsSchema } from '@/db/schemas/index.js';

import { jsonContent, jsonContentRequired } from '@/lib/openapi.js';
import { errorResponseSchema, HttpStatus, successResponseSchema } from '@/lib/response.js';

import { currentUser } from '@/middlewares/current-user.js';

const tags = ['Highlights'];

export const createHighlight = createRoute({
  tags,
  method: 'post',
  path: '/highlights/:linkId',
  middleware: [currentUser],
  request: {
    params: z.object({ linkId: z.string() }),
    body: jsonContentRequired(
      z.object({
        color: z.string(),
        endOffset: z.number(),
        note: z.string().or(z.null()).optional(),
        startOffset: z.number(),
        text: z.string()
      }),
      ''
    )
  },
  responses: {
    [HttpStatus.CREATED]: jsonContent(
      successResponseSchema(selectHighlightsSchema, HttpStatus.CREATED),
      'Create higlight success'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Missing required fields'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(
      errorResponseSchema(HttpStatus.NOT_FOUND),
      'Highlight not found'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      'Failed to create highlight'
    )
  }
});

export const updateHighlight = createRoute({
  tags,
  method: 'put',
  path: '/highlights/:id',
  middleware: [currentUser],
  request: {
    body: jsonContentRequired(
      z.object({
        color: z.string().optional(),
        note: z.string().or(z.null()).optional()
      }),
      'Highlight updated successfully'
    ),
    params: z.object({ id: z.string() })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(selectHighlightsSchema),
      'Highlight updated successfully'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Highlight not found'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(
      errorResponseSchema(HttpStatus.NOT_FOUND),
      'Highlight not found'
    )
  }
});

export const deleteHighlight = createRoute({
  tags,
  method: 'delete',
  path: '/highlights/:id',
  middleware: [currentUser],
  request: {
    params: z.object({ id: z.string() })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(z.object({ id: z.string() })),
      'Highlight deleted successfully'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), ''),
    [HttpStatus.NOT_FOUND]: jsonContent(errorResponseSchema(HttpStatus.NOT_FOUND), '')
  }
});

export const getHighlightsByLinkId = createRoute({
  tags,
  method: 'get',
  path: '/highlights/link/:linkId',
  middleware: [currentUser],
  request: {
    params: z.object({
      linkId: z.string()
    })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(z.array(selectHighlightsSchema)),
      'Highlights fetched successfully'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), ''),
    [HttpStatus.NOT_FOUND]: jsonContent(errorResponseSchema(HttpStatus.NOT_FOUND), '')
  }
});

export type CreateHighlightRoute = typeof createHighlight;
export type UpdateHighlightRoute = typeof updateHighlight;
export type DeleteHighlightRoute = typeof deleteHighlight;
export type GetHighlightsByLinkIdRoute = typeof getHighlightsByLinkId;
