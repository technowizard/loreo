import type { AppRouteHandler } from '../../lib/types.js';
import { logger } from '@/lib/logger.js';
import { errorResponse, HttpStatus, successResponse } from '@/lib/response.js';

import type { GetHomeSuggestionsRoute } from './home.routes.js';

export const getHomeSuggestions: AppRouteHandler<GetHomeSuggestionsRoute> = async (c) => {
  const user = c.get('user');

  if (!user) {
    const response = errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);

    return c.json(response, response.status);
  }

  try {
    const { links } = c.get('repos');
    const homeSuggestions = await links.getHomeSuggestions(user.id);

    const response = successResponse(homeSuggestions, 'Suggestions fetched successfully');

    return c.json(response, response.status);
  } catch (error) {
    logger.error(`Error getting suggestions: ${error}`);

    const response = errorResponse('Failed to get suggestions', HttpStatus.UNAUTHORIZED);

    return c.json(response, response.status);
  }
};
