import { mapDbError, tagGroupDbErrorRules } from '@/lib/db-error.js';
import { demoModeForbiddenResponse, isDemoMode } from '@/lib/demo-mode.js';
import { logger } from '@/lib/logger.js';
import { errorResponse, HttpStatus, successResponse } from '@/lib/response.js';
import type { AppRouteHandler } from '@/lib/types.js';

import type {
  BulkDeleteTagsRoute,
  BulkMoveTagsRoute,
  CreateTagGroupRoute,
  CreateTagRoute,
  DeleteTagGroupRoute,
  DeleteTagRoute,
  GetTagGroupsRoute,
  GetTagsByGroupRoute,
  GetUserTagsRoute,
  MoveTagRoute,
  UpdateTagGroupRoute,
  UpdateTagRoute
} from './tags.routes.js';

export const getTagGroups: AppRouteHandler<GetTagGroupsRoute> = async (c) => {
  const user = c.get('user');
  const { tags } = c.get('repos');

  try {
    const groups = await tags.findGroupsWithTags(user.id);
    const response = successResponse(groups, 'Tag groups fetched successfully');
    return c.json(response, response.status);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error fetching tag groups: ${errorMessage}`);
    const response = errorResponse('An error occurred when fetching tag groups');
    return c.json(response, response.status);
  }
};

export const getUserTags: AppRouteHandler<GetUserTagsRoute> = async (c) => {
  const user = c.get('user');
  const { tags } = c.get('repos');

  try {
    const result = await tags.findTagsByUserId(user.id);
    const response = successResponse(result, 'User tags fetched successfully');
    return c.json(response, response.status);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error fetching user tags: ${errorMessage}`);
    const response = errorResponse('An error occurred when fetching user tags');
    return c.json(response, response.status);
  }
};

export const getTagsByGroup: AppRouteHandler<GetTagsByGroupRoute> = async (c) => {
  const user = c.get('user');
  const { groupId } = c.req.valid('param');
  const { tags } = c.get('repos');

  try {
    const result = await tags.findTagsByGroup(groupId, user.id);
    const response = successResponse(result, `Tags for group '${groupId}' fetched successfully`);
    return c.json(response, response.status);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error fetching tags for group ${groupId}: ${errorMessage}`);
    const response = errorResponse(`An error occurred when fetching tags for group '${groupId}'`);
    return c.json(response, response.status);
  }
};

export const createTag: AppRouteHandler<CreateTagRoute> = async (c) => {
  if (isDemoMode()) {
    const response = demoModeForbiddenResponse();
    return c.json(response, response.status);
  }

  const user = c.get('user');
  const { groupId, name } = c.req.valid('json');
  const { tags } = c.get('repos');

  try {
    const newTag = await tags.createTag({ groupId, name, userId: user.id });
    const response = successResponse(newTag, 'Tag created successfully', HttpStatus.CREATED);
    return c.json(response, response.status);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error creating tag: ${errorMessage}`);

    if (errorMessage.includes('already exists')) {
      const response = errorResponse('Tag already exists', HttpStatus.CONFLICT);
      return c.json(response, response.status);
    }

    if (errorMessage.includes('does not exist')) {
      const response = errorResponse('Invalid group', HttpStatus.BAD_REQUEST);
      return c.json(response, response.status);
    }

    const response = errorResponse(
      'An error occurred when creating tag',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
    return c.json(response, response.status);
  }
};

export const updateTag: AppRouteHandler<UpdateTagRoute> = async (c) => {
  if (isDemoMode()) {
    const response = demoModeForbiddenResponse();
    return c.json(response, response.status);
  }

  const user = c.get('user');
  const { tagId } = c.req.valid('param');
  const body = c.req.valid('json');
  const { tags } = c.get('repos');

  try {
    const updates: { groupId?: string; name?: string } = {};
    if (body.name) updates.name = body.name;
    if (body.groupId) updates.groupId = body.groupId;

    if (!updates.name && !updates.groupId) {
      const response = errorResponse('Missing required fields', HttpStatus.BAD_REQUEST);
      return c.json(response, response.status);
    }

    const existing = await tags.findTagById(tagId, user.id);
    if (!existing) {
      const response = errorResponse('Tag not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const updatedTag = await tags.updateTag(tagId, user.id, updates);
    if (!updatedTag) {
      const response = errorResponse('Tag not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const response = successResponse(updatedTag, 'Tag updated successfully');
    return c.json(response, response.status);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error updating tag: ${errorMessage}`);

    if (errorMessage.includes('already exists')) {
      const response = errorResponse('Tag already exists', HttpStatus.CONFLICT);
      return c.json(response, response.status);
    }

    if (errorMessage.includes('does not exist')) {
      const response = errorResponse('Invalid group', HttpStatus.BAD_REQUEST);
      return c.json(response, response.status);
    }

    const response = errorResponse('An error occurred when updating tag');
    return c.json(response, response.status);
  }
};

export const deleteTag: AppRouteHandler<DeleteTagRoute> = async (c) => {
  if (isDemoMode()) {
    const response = demoModeForbiddenResponse();
    return c.json(response, response.status);
  }

  const user = c.get('user');
  const { tagId } = c.req.valid('param');
  const { tags } = c.get('repos');

  try {
    const existing = await tags.findTagById(tagId, user.id);
    if (!existing) {
      const response = errorResponse('Tag not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    await tags.deleteTag(tagId, user.id);
    const response = successResponse(null, 'Tag deleted successfully');
    return c.json(response, response.status);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error deleting tag: ${errorMessage}`);

    if (errorMessage.includes('not found')) {
      const response = errorResponse('Tag not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const response = errorResponse('An error occurred when deleting tag');
    return c.json(response, response.status);
  }
};

export const createTagGroup: AppRouteHandler<CreateTagGroupRoute> = async (c) => {
  if (isDemoMode()) {
    const response = demoModeForbiddenResponse();
    return c.json(response, response.status);
  }

  const user = c.get('user');
  const { tags } = c.get('repos');

  try {
    const { color, description, name } = c.req.valid('json');
    const newGroup = await tags.createGroup({
      color,
      description,
      name,
      userId: user.id
    });
    const response = successResponse(
      newGroup,
      'Tag group created successfully',
      HttpStatus.CREATED
    );
    return c.json(response, response.status);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error creating tag group: ${errorMessage}`);

    const mappedError = mapDbError(error, tagGroupDbErrorRules.create);
    if (mappedError) {
      const response = errorResponse(mappedError.message, mappedError.status as 400 | 409 | 500);
      return c.json(response, response.status);
    }

    const response = errorResponse('An error occurred when creating tag group');
    return c.json(response, response.status);
  }
};

export const updateTagGroup: AppRouteHandler<UpdateTagGroupRoute> = async (c) => {
  if (isDemoMode()) {
    const response = demoModeForbiddenResponse();
    return c.json(response, response.status);
  }

  const user = c.get('user');
  const { tags } = c.get('repos');

  try {
    const { id } = c.req.valid('param');
    const updateRequest = c.req.valid('json');

    const updatedGroup = await tags.updateGroup(id, user.id, updateRequest);
    if (!updatedGroup) {
      const response = errorResponse('Tag group not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const response = successResponse(updatedGroup, 'Tag group updated successfully');
    return c.json(response, response.status);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error updating tag group: ${errorMessage}`);
    const response = errorResponse('An error occurred when updating tag group');
    return c.json(response, response.status);
  }
};

export const deleteTagGroup: AppRouteHandler<DeleteTagGroupRoute> = async (c) => {
  if (isDemoMode()) {
    const response = demoModeForbiddenResponse();
    return c.json(response, response.status);
  }

  const user = c.get('user');
  const { tags } = c.get('repos');

  try {
    const { id } = c.req.valid('param');
    const success = await tags.deleteTagGroup(id, user.id);

    if (!success) {
      const response = errorResponse('Tag group not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const response = successResponse({ id }, 'Tag group deleted successfully');
    return c.json(response, response.status);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error deleting tag group: ${errorMessage}`);
    const response = errorResponse('An error occurred when deleting tag group');
    return c.json(response, response.status);
  }
};

export const moveTag: AppRouteHandler<MoveTagRoute> = async (c) => {
  if (isDemoMode()) {
    const response = demoModeForbiddenResponse();
    return c.json(response, response.status);
  }

  const user = c.get('user');
  const { tagId } = c.req.valid('param');
  const { targetGroupId } = c.req.valid('json');
  const { tags } = c.get('repos');

  try {
    const movedTag = await tags.updateTag(tagId, user.id, {
      groupId: targetGroupId
    });
    if (!movedTag) {
      const response = errorResponse('Tag not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const response = successResponse(movedTag, 'Tag moved successfully');
    return c.json(response, response.status);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error moving tag: ${errorMessage}`);

    if (errorMessage.includes('does not exist')) {
      const response = errorResponse('Invalid group', HttpStatus.BAD_REQUEST);
      return c.json(response, response.status);
    }

    if (errorMessage.includes('already exists')) {
      const response = errorResponse('Tag already exists in target group', HttpStatus.CONFLICT);
      return c.json(response, response.status);
    }

    const response = errorResponse('An error occurred when moving tag');
    return c.json(response, response.status);
  }
};

export const bulkDeleteTags: AppRouteHandler<BulkDeleteTagsRoute> = async (c) => {
  if (isDemoMode()) {
    const response = demoModeForbiddenResponse();
    return c.json(response, response.status);
  }

  const user = c.get('user');
  const { tagIds } = c.req.valid('json');
  const { tags } = c.get('repos');

  try {
    if (tagIds.length === 0) {
      const response = errorResponse('No tags specified for deletion', HttpStatus.BAD_REQUEST);
      return c.json(response, response.status);
    }

    const affectedLinks = await tags.countLinksByTagIds(tagIds, user.id);
    await tags.bulkDeleteTagRelations(tagIds, user.id);
    const deletedTags = await tags.bulkDeleteTags(tagIds, user.id);

    const response = successResponse({ deletedTags, affectedLinks }, 'Tags deleted successfully');
    return c.json(response, response.status);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error bulk deleting tags: ${errorMessage}`);
    const response = errorResponse('An error occurred when deleting tags');
    return c.json(response, response.status);
  }
};

export const bulkMoveTags: AppRouteHandler<BulkMoveTagsRoute> = async (c) => {
  if (isDemoMode()) {
    const response = demoModeForbiddenResponse();
    return c.json(response, response.status);
  }

  const user = c.get('user');
  const { fromGroupId, tagIds, toGroupId } = c.req.valid('json');
  const { tags } = c.get('repos');

  try {
    let tagsToMove: string[];

    if (tagIds && tagIds.length > 0) {
      tagsToMove = tagIds;
    } else if (fromGroupId) {
      const groupTags = await tags.findTagsByGroup(fromGroupId, user.id);
      tagsToMove = groupTags.map((t) => t.id);
    } else {
      const response = errorResponse(
        'Either fromGroupId or tagIds must be provided',
        HttpStatus.BAD_REQUEST
      );
      return c.json(response, response.status);
    }

    if (tagsToMove.length === 0) {
      const response = errorResponse('No tags found to move', HttpStatus.BAD_REQUEST);
      return c.json(response, response.status);
    }

    const movedTags = await tags.bulkUpdateTagGroup(tagsToMove, user.id, toGroupId);
    const response = successResponse({ movedTags }, 'Tags moved successfully');
    return c.json(response, response.status);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error bulk moving tags: ${errorMessage}`);

    if (errorMessage.includes('does not exist')) {
      const response = errorResponse(errorMessage, HttpStatus.BAD_REQUEST);
      return c.json(response, response.status);
    }

    if (errorMessage.includes('already exists')) {
      const response = errorResponse(errorMessage, HttpStatus.CONFLICT);
      return c.json(response, response.status);
    }

    const response = errorResponse('An error occurred when moving tags');
    return c.json(response, response.status);
  }
};
