import { createRoute, z } from '@hono/zod-openapi';

import {
  insertTagGroupsSchema,
  selectTagGroupsSchema,
  selectTagsSchema
} from '@/db/schemas/index.js';

import { jsonContent, jsonContentRequired } from '@/lib/openapi.js';
import { errorResponseSchema, HttpStatus, successResponseSchema } from '@/lib/response.js';

import { currentUser } from '@/middlewares/current-user.js';

const tags = ['Tags'];

export const getTagGroups = createRoute({
  tags,
  method: 'get',
  path: '/tags/groups',
  middleware: [currentUser],
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(
        z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            description: z.string().nullable(),
            color: z.string(),
            tags: z.array(selectTagsSchema)
          })
        )
      ),
      'Tag group fetched'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      'Failed to fetch tag group'
    )
  }
});

export const createTagGroup = createRoute({
  tags,
  method: 'post',
  path: '/tags/groups',
  middleware: [currentUser],
  request: {
    body: jsonContentRequired(
      z.object({
        color: z.string(),
        description: z.string().or(z.null()),
        name: z.string()
      }),
      ''
    )
  },
  responses: {
    [HttpStatus.CREATED]: jsonContent(
      successResponseSchema(selectTagGroupsSchema, HttpStatus.CREATED),
      'Create Tag Group Success'
    ),
    [HttpStatus.FORBIDDEN]: jsonContent(
      errorResponseSchema(HttpStatus.FORBIDDEN),
      'Demo mode blocked'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), ''),
    [HttpStatus.CONFLICT]: jsonContent(errorResponseSchema(HttpStatus.CONFLICT), ''),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      ''
    )
  }
});

export const updateTagGroup = createRoute({
  tags,
  method: 'put',
  path: '/tags/groups/:id',
  middleware: [currentUser],
  request: {
    params: z.object({ id: z.string() }),
    body: jsonContentRequired(
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        color: z.string().optional()
      }),
      ''
    )
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(insertTagGroupsSchema),
      'Update Tag Group Success'
    ),
    [HttpStatus.FORBIDDEN]: jsonContent(
      errorResponseSchema(HttpStatus.FORBIDDEN),
      'Demo mode blocked'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), ''),
    [HttpStatus.NOT_FOUND]: jsonContent(errorResponseSchema(HttpStatus.NOT_FOUND), ''),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      ''
    )
  }
});

export const deleteTagGroup = createRoute({
  tags,
  method: 'delete',
  path: '/tags/groups/:id',
  middleware: [currentUser],
  request: {
    params: z.object({ id: z.string() })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(z.object({ id: z.string() })),
      'User Registration Success'
    ),
    [HttpStatus.FORBIDDEN]: jsonContent(
      errorResponseSchema(HttpStatus.FORBIDDEN),
      'Demo mode blocked'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(errorResponseSchema(HttpStatus.NOT_FOUND), ''),
    [HttpStatus.CONFLICT]: jsonContent(errorResponseSchema(HttpStatus.CONFLICT), ''),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      ''
    )
  }
});

export const getUserTags = createRoute({
  tags,
  method: 'get',
  path: '/tags',
  middleware: [currentUser],
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(z.array(selectTagsSchema)),
      'Tags retrieved successfully'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      'Failed to fetch tags'
    )
  }
});

export const getTagsByGroup = createRoute({
  tags,
  method: 'get',
  path: '/tags/groups/:groupId',
  middleware: [currentUser],
  request: {
    params: z.object({ groupId: z.string() })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(z.array(selectTagsSchema)),
      'Tags retrieved successfully'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      'Failed to fetch tags from group'
    )
  }
});

export const createTag = createRoute({
  tags,
  method: 'post',
  path: '/tags',
  middleware: [currentUser],
  request: {
    body: jsonContentRequired(z.object({ groupId: z.string(), name: z.string() }), '')
  },
  responses: {
    [HttpStatus.CREATED]: jsonContent(
      successResponseSchema(selectTagsSchema, HttpStatus.CREATED),
      'Create Tag Success'
    ),
    [HttpStatus.FORBIDDEN]: jsonContent(
      errorResponseSchema(HttpStatus.FORBIDDEN),
      'Demo mode blocked'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), ''),
    [HttpStatus.CONFLICT]: jsonContent(errorResponseSchema(HttpStatus.CONFLICT), ''),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      ''
    )
  }
});

export const updateTag = createRoute({
  tags,
  method: 'put',
  path: '/tags/:tagId',
  middleware: [currentUser],
  request: {
    params: z.object({ tagId: z.string() }),
    body: jsonContentRequired(
      z.object({
        groupId: z.string().optional(),
        name: z.string().optional()
      }),
      ''
    )
  },
  responses: {
    [HttpStatus.OK]: jsonContent(successResponseSchema(selectTagsSchema), 'Update Tag Success'),
    [HttpStatus.FORBIDDEN]: jsonContent(
      errorResponseSchema(HttpStatus.FORBIDDEN),
      'Demo mode blocked'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(errorResponseSchema(HttpStatus.BAD_REQUEST), ''),
    [HttpStatus.NOT_FOUND]: jsonContent(errorResponseSchema(HttpStatus.NOT_FOUND), ''),
    [HttpStatus.CONFLICT]: jsonContent(errorResponseSchema(HttpStatus.CONFLICT), ''),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      ''
    )
  }
});

export const deleteTag = createRoute({
  tags,
  method: 'delete',
  path: '/tags/:tagId',
  middleware: [currentUser],
  request: {
    params: z.object({ tagId: z.string() })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(successResponseSchema(z.null()), 'User Registration Success'),
    [HttpStatus.FORBIDDEN]: jsonContent(
      errorResponseSchema(HttpStatus.FORBIDDEN),
      'Demo mode blocked'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(errorResponseSchema(HttpStatus.NOT_FOUND), ''),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      ''
    )
  }
});

export const moveTag = createRoute({
  tags,
  method: 'post',
  path: '/tags/:tagId/move',
  middleware: [currentUser],
  request: {
    params: z.object({ tagId: z.string() }),
    body: jsonContentRequired(
      z.object({
        targetGroupId: z.string()
      }),
      'Move tag to another group'
    )
  },
  responses: {
    [HttpStatus.OK]: jsonContent(successResponseSchema(selectTagsSchema), 'Tag moved successfully'),
    [HttpStatus.FORBIDDEN]: jsonContent(
      errorResponseSchema(HttpStatus.FORBIDDEN),
      'Demo mode blocked'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Invalid target group'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(errorResponseSchema(HttpStatus.NOT_FOUND), 'Tag not found'),
    [HttpStatus.CONFLICT]: jsonContent(
      errorResponseSchema(HttpStatus.CONFLICT),
      'Tag already exists in target group'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      ''
    )
  }
});

export const bulkDeleteTags = createRoute({
  tags,
  method: 'delete',
  path: '/tags/bulk',
  middleware: [currentUser],
  request: {
    body: jsonContentRequired(
      z.object({
        tagIds: z.array(z.string())
      }),
      'Bulk delete tags'
    )
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(
        z.object({
          deletedTags: z.number(),
          affectedLinks: z.number()
        })
      ),
      'Tags deleted successfully'
    ),
    [HttpStatus.FORBIDDEN]: jsonContent(
      errorResponseSchema(HttpStatus.FORBIDDEN),
      'Demo mode blocked'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Invalid request'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      ''
    )
  }
});

export const bulkMoveTags = createRoute({
  tags,
  method: 'post',
  path: '/tags/move-batch',
  middleware: [currentUser],
  request: {
    body: jsonContentRequired(
      z.object({
        fromGroupId: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
        toGroupId: z.string()
      }),
      'Bulk move tags'
    )
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(
        z.object({
          movedTags: z.number()
        })
      ),
      'Tags moved successfully'
    ),
    [HttpStatus.FORBIDDEN]: jsonContent(
      errorResponseSchema(HttpStatus.FORBIDDEN),
      'Demo mode blocked'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Invalid request'
    ),
    [HttpStatus.CONFLICT]: jsonContent(
      errorResponseSchema(HttpStatus.CONFLICT),
      'Duplicate tag name in target group'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      ''
    )
  }
});

export type GetTagGroupsRoute = typeof getTagGroups;
export type CreateTagGroupRoute = typeof createTagGroup;
export type UpdateTagGroupRoute = typeof updateTagGroup;
export type DeleteTagGroupRoute = typeof deleteTagGroup;
export type GetUserTagsRoute = typeof getUserTags;
export type GetTagsByGroupRoute = typeof getTagsByGroup;
export type CreateTagRoute = typeof createTag;
export type UpdateTagRoute = typeof updateTag;
export type DeleteTagRoute = typeof deleteTag;
export type MoveTagRoute = typeof moveTag;
export type BulkDeleteTagsRoute = typeof bulkDeleteTags;
export type BulkMoveTagsRoute = typeof bulkMoveTags;
