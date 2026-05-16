import { logger } from '@/lib/logger.js';
import { errorResponse, HttpStatus, successResponse } from '@/lib/response.js';
import type { AppRouteHandler } from '@/lib/types.js';

import type { Highlight } from '@/types/highlights.js';

import type {
  CreateHighlightRoute,
  DeleteHighlightRoute,
  GetHighlightsByLinkIdRoute,
  UpdateHighlightRoute
} from './highlights.routes.js';

export const createHighlight: AppRouteHandler<CreateHighlightRoute> = async (c) => {
  const user = c.get('user');
  const { highlights, links } = c.get('repos');
  const { linkId } = c.req.valid('param');
  const { color, endOffset, note, startOffset, text } = c.req.valid('json');

  try {
    const link = await links.findById(linkId, user.id);

    if (!link) {
      const response = errorResponse('Link not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const newHighlight = await highlights.create({
      color: color || 'yellow',
      endOffset,
      linkId,
      note: note || null,
      startOffset,
      text,
      userId: user.id
    });

    if (!newHighlight) {
      const response = errorResponse('Failed to create highlight');
      return c.json(response, response.status);
    }

    logger.info(`Highlight created with id: ${newHighlight.id} for link: ${linkId}`);

    const response = successResponse(
      newHighlight,
      'Highlight created successfully',
      HttpStatus.CREATED
    );
    return c.json(response, response.status);
  } catch (error) {
    const errorMessage = `Error creating highlight: ${(error as Error).message}`;
    logger.error(errorMessage);
    const response = errorResponse(errorMessage);
    return c.json(response, response.status);
  }
};

export const updateHighlight: AppRouteHandler<UpdateHighlightRoute> = async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const { color, note } = c.req.valid('json');
  const { highlights } = c.get('repos');

  try {
    const updates: Partial<Highlight> = {};

    if (color !== undefined) updates.color = color;
    if (note !== undefined) updates.note = note;

    const updatedHighlight = await highlights.update(id, user.id, updates);

    if (!updatedHighlight) {
      const response = errorResponse('Highlight not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    logger.info(`Highlight updated with id: ${id}`);

    const response = successResponse(
      updatedHighlight,
      'Highlight updated successfully',
      HttpStatus.OK
    );
    return c.json(response, response.status);
  } catch (error) {
    const errorMessage = `Error updating highlight: ${(error as Error).message}`;
    logger.error(errorMessage);
    const response = errorResponse(errorMessage, HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }
};

export const deleteHighlight: AppRouteHandler<DeleteHighlightRoute> = async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const { highlights } = c.get('repos');

  try {
    const success = await highlights.delete(id, user.id);

    if (!success) {
      const response = errorResponse('Highlight not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    logger.info(`Highlight deleted with id: ${id}`);

    const response = successResponse({ id }, 'Highlight deleted successfully', HttpStatus.OK);
    return c.json(response, response.status);
  } catch (error) {
    const errorMessage = `Error deleting highlight: ${(error as Error).message}`;
    logger.error(errorMessage);
    const response = errorResponse(errorMessage, HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }
};

export const getHighlightsByLinkId: AppRouteHandler<GetHighlightsByLinkIdRoute> = async (c) => {
  const user = c.get('user');
  const { linkId } = c.req.valid('param');
  const { highlights, links } = c.get('repos');

  try {
    const link = await links.findById(linkId, user.id);

    if (!link) {
      const response = errorResponse('Link not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const result = await highlights.findByLinkId(linkId, user.id);

    logger.info(`Fetched ${result.length} highlights for link: ${linkId}`);

    const response = successResponse(result, 'Highlights fetched successfully', HttpStatus.OK);
    return c.json(response, response.status);
  } catch (error) {
    const errorMessage = `Error fetching highlights: ${(error as Error).message}`;
    logger.error(errorMessage);
    const response = errorResponse(errorMessage, HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }
};
