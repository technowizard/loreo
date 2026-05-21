import type { ContentExtractionJobData } from '@/queues/content-extraction.queue.js';
import { enqueueContentExtraction } from '@/queues/content-extraction.queue.js';

import { demoModeForbiddenResponse, isDemoMode } from '@/lib/demo-mode.js';
import { logger } from '@/lib/logger.js';
import { toCursorPaginatedResponse } from '@/lib/pagination.js';
import { errorResponse, HttpStatus, successResponse } from '@/lib/response.js';
import type { AppRouteHandler } from '@/lib/types.js';
import { isValidUrl } from '@/lib/url-validator.js';

import type { CursorPaginationOptions } from '@/types/pagination.js';
import type { Tag } from '@/types/tags.js';

import type {
  CreateLinkRoute,
  DeleteLinkRoute,
  GetLinkByIdRoute,
  GetLinksRoute,
  GetUpcomingLinksRoute,
  RefetchLinkRoute,
  SearchLinksRoute,
  UpdateLinkRoute,
  UpdateLinkTagsRoute
} from './links.routes.js';

export const getLinks: AppRouteHandler<GetLinksRoute> = async (c) => {
  const user = c.get('user');
  const { links } = c.get('repos');

  const { archived, groups, cursor, favorite, filter, limit, priority, q, readLength, sort, tags } =
    c.req.valid('query');

  try {
    const paginationOptions: CursorPaginationOptions = {
      cursor,
      limit: limit ? Number(limit) : undefined,
      orderDirection: sort === 'asc' ? 'asc' : 'desc'
    };

    const hasFilters =
      q ||
      filter ||
      priority ||
      tags ||
      (groups && groups !== 'all') ||
      favorite !== undefined ||
      archived !== undefined ||
      readLength ||
      sort;

    if (!hasFilters) {
      const result = await links.findMany(user.id, paginationOptions);
      const paginated = toCursorPaginatedResponse(result, paginationOptions.limit);
      return c.json(
        {
          result: paginated.data,
          message: 'Links fetched successfully',
          status: HttpStatus.OK,
          pagination: paginated.pagination
        },
        HttpStatus.OK
      );
    }

    const searchFilters: {
      hasHighlights?: boolean;
      isArchived?: boolean;
      isFavorite?: boolean;
      isRead?: boolean;
      priority?: string;
      processingStatus?: string;
      readLength?: 'short' | 'long';
      sortBy?: 'newest' | 'oldest' | 'shortest' | 'longest';
      tagGroups?: string;
      tagNames?: string;
    } = {};

    if (filter === 'all') searchFilters.isArchived = false;
    else if (filter === 'unread') searchFilters.isRead = false;
    else if (filter === 'favorites') searchFilters.isFavorite = true;
    else if (filter === 'archived') searchFilters.isArchived = true;
    else if (filter === 'highlights') searchFilters.hasHighlights = true;

    if (priority) searchFilters.priority = priority as string;
    if (tags) searchFilters.tagNames = typeof tags === 'string' ? tags : undefined;
    if (groups && groups !== 'all')
      searchFilters.tagGroups = typeof groups === 'string' ? groups : undefined;
    if (readLength) searchFilters.readLength = readLength as 'short' | 'long';
    if (sort) searchFilters.sortBy = sort as 'newest' | 'oldest' | 'shortest' | 'longest';

    const result = await links.search(user.id, q, searchFilters, paginationOptions);
    const paginated = toCursorPaginatedResponse(result, paginationOptions.limit);
    return c.json(
      {
        result: paginated.data,
        message: 'Links fetched successfully',
        status: HttpStatus.OK,
        pagination: paginated.pagination
      },
      HttpStatus.OK
    );
  } catch (error) {
    logger.error(`Error fetching links: ${(error as Error).message}`);
    const response = errorResponse('An error occurred when fetching links', HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }
};

export const getLinkById: AppRouteHandler<GetLinkByIdRoute> = async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const { links } = c.get('repos');

  try {
    const link = await links.findByIdDetailed(id, user.id);

    if (!link) {
      const response = errorResponse('Link not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    logger.info(`Fetched link with id: ${id} with ${link.highlights?.length || 0} highlights`);

    const response = successResponse(link, 'Link fetched successfully');
    return c.json(response, response.status);
  } catch (error) {
    logger.error(`Error fetching link: ${(error as Error).message}`);
    const response = errorResponse('An error occurred when fetching link', HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }
};

export const getUpcomingLinks: AppRouteHandler<GetUpcomingLinksRoute> = async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const { links } = c.get('repos');

  try {
    const upcomingArticles = await links.findUpcoming(user.id, id);

    logger.info(`Fetched ${upcomingArticles.length} upcoming articles for link: ${id}`);

    const response = successResponse(upcomingArticles, 'Upcoming articles fetched successfully');
    return c.json(response, response.status);
  } catch (error) {
    logger.error(`Error fetching upcoming articles: ${(error as Error).message}`);
    const response = errorResponse('An error occurred when fetching upcoming articles');
    return c.json(response, response.status);
  }
};

export const createLink: AppRouteHandler<CreateLinkRoute> = async (c) => {
  if (isDemoMode()) {
    const response = demoModeForbiddenResponse();
    return c.json(response, response.status);
  }

  const user = c.get('user');
  const { links } = c.get('repos');

  try {
    const { tags = [], url } = c.req.valid('json');

    if (!url) {
      const response = errorResponse('URL is required', HttpStatus.BAD_REQUEST);
      return c.json(response, response.status);
    }

    if (!(await isValidUrl(url))) {
      const response = errorResponse('URL is not allowed', HttpStatus.BAD_REQUEST);
      return c.json(response, response.status);
    }

    const urlExists = await links.existsByUrl(url, user.id);

    if (urlExists) {
      const response = errorResponse('URL already exists in your library', HttpStatus.CONFLICT);
      return c.json(response, response.status);
    }

    const processedTags: Omit<Tag, 'createdAt'>[] = [];

    for (const tag of tags) {
      if (tag && typeof tag === 'object' && tag.name && tag.groupId) {
        processedTags.push({
          id: tag.id,
          groupId: tag.groupId,
          name: tag.name.trim(),
          userId: user.id
        });
      }
    }

    const newLink = await links.create({
      author: null,
      content: null,
      excerpt: null,
      isArchived: false,
      isFavorite: false,
      isPaywalled: false,
      isRead: false,
      lastReadAt: null,
      priority: 'none',
      processingStatus: 'pending',
      publishedAt: null,
      readingProgress: 0,
      readingTime: 0,
      textContent: null,
      timeSpentReading: 0,
      title: url,
      url,
      userId: user.id
    });

    if (!newLink) {
      const response = errorResponse('Failed to create link');
      return c.json(response, response.status);
    }

    if (processedTags.length > 0) {
      const { tags } = c.get('repos');
      const existingTags = await tags.findTagsByUserId(user.id);
      const tagIds: string[] = [];
      for (const tag of processedTags) {
        const found = existingTags.find((t) => t.name === tag.name && t.groupId === tag.groupId);
        if (found) {
          tagIds.push(found.id);
        } else {
          const newTag = await tags.createTag({
            groupId: tag.groupId,
            name: tag.name,
            userId: user.id
          });
          tagIds.push(newTag.id);
        }
      }
      if (tagIds.length > 0) await tags.addTagsToLink(newLink.id as string, tagIds, user.id);
    }

    const jobData: ContentExtractionJobData = {
      linkId: newLink.id as string,
      url,
      user
    };
    const job = await enqueueContentExtraction.add('process-new-article', jobData);

    logger.info(`Article processing job added to queue: ${job.id}`);
    logger.info(`Link created with id: ${newLink.id}`);

    const response = successResponse(
      { url: newLink.url, id: newLink.id },
      'Link received and enqueued for extraction',
      HttpStatus.ACCEPTED
    );
    return c.json(response, response.status);
  } catch (error) {
    logger.error(`Error creating link: ${(error as Error).message}`);
    const response = errorResponse('An error occurred when creating link', HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }
};

export const deleteLink: AppRouteHandler<DeleteLinkRoute> = async (c) => {
  if (isDemoMode()) {
    const response = demoModeForbiddenResponse();
    return c.json(response, response.status);
  }

  const user = c.get('user');
  const { id } = c.req.valid('param');
  const { links } = c.get('repos');

  try {
    const linkExists = await links.findById(id, user.id);

    if (!linkExists) {
      const response = errorResponse('Link not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const success = await links.delete(id, user.id);

    if (success) {
      logger.info(`Link deleted with id: ${id}`);
      const response = successResponse({ id }, 'Link deleted successfully');
      return c.json(response, response.status);
    }

    throw new Error('Failed to delete link');
  } catch (error: unknown) {
    logger.error(`Error deleting link: ${(error as Error).message}`);
    const response = errorResponse('An error occurred when deleting link', HttpStatus.BAD_REQUEST);
    return c.json(response, response.status);
  }
};

export const updateLink: AppRouteHandler<UpdateLinkRoute> = async (c) => {
  if (isDemoMode()) {
    const response = demoModeForbiddenResponse();
    return c.json(response, response.status);
  }

  const user = c.get('user');
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const { links } = c.get('repos');

  try {
    const existingLink = await links.findById(id, user.id);

    if (!existingLink) {
      const response = errorResponse('Link not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    if (
      body.priority &&
      !['none', 'low-priority', 'this-week', 'must-read'].includes(body.priority)
    ) {
      const response = errorResponse('Invalid priority value', HttpStatus.BAD_REQUEST);
      return c.json(response, response.status);
    }

    if (body.readingProgress !== undefined) {
      const progress = Number(body.readingProgress);
      if (Number.isNaN(progress) || progress < 0 || progress > 100) {
        const response = errorResponse(
          'Reading progress must be between 0 and 100',
          HttpStatus.BAD_REQUEST
        );
        return c.json(response, response.status);
      }
    }

    if (body.timeSpentReading !== undefined) {
      const timeSpent = Number(body.timeSpentReading);
      if (Number.isNaN(timeSpent) || timeSpent < 0) {
        const response = errorResponse(
          'Time spent reading must be a non-negative number',
          HttpStatus.BAD_REQUEST
        );
        return c.json(response, response.status);
      }
    }

    const updates: Record<string, unknown> = {};
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.readingProgress !== undefined) updates.readingProgress = body.readingProgress;
    if (body.timeSpentReading !== undefined) updates.timeSpentReading = body.timeSpentReading;
    if (body.isFavorite !== undefined) updates.isFavorite = body.isFavorite;
    if (body.isArchived !== undefined) updates.isArchived = body.isArchived;
    if (body.isRead !== undefined) {
      updates.isRead = body.isRead;
      if (body.isRead === true) updates.lastReadAt = new Date();
    }

    const updatedLink = await links.update(id, user.id, updates);

    if (!updatedLink) {
      const response = errorResponse('Failed to update link');
      return c.json(response, response.status);
    }

    const response = successResponse(updatedLink, 'Link updated successfully');
    return c.json(response, response.status);
  } catch (error) {
    logger.error(`Error updating link: ${(error as Error).message}`);
    const response = errorResponse('An error occurred when updating link');
    return c.json(response, response.status);
  }
};

export const refetchLink: AppRouteHandler<RefetchLinkRoute> = async (c) => {
  if (isDemoMode()) {
    const response = demoModeForbiddenResponse();
    return c.json(response, response.status);
  }

  const user = c.get('user');
  const { id } = c.req.valid('param');
  const { links } = c.get('repos');

  try {
    const existingLink = await links.findById(id, user.id);

    if (!existingLink) {
      const response = errorResponse('Link not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    await links.update(id, user.id, {
      errorMessage: null,
      processingStatus: 'pending'
    });

    const jobData: ContentExtractionJobData = {
      linkId: id,
      url: existingLink.url,
      user
    };
    const job = await enqueueContentExtraction.add('refetch-article', jobData, {
      attempts: 3,
      priority: 10
    });

    logger.info(`Article refetch job added to queue: ${job.id} for link: ${id}`);

    const response = successResponse(
      { id, processingStatus: 'pending', url: existingLink.url },
      'Link enqueued for reprocessing',
      HttpStatus.ACCEPTED
    );
    return c.json(response, response.status);
  } catch (error) {
    logger.error(`Error refetching link: ${(error as Error).message}`);
    const response = errorResponse('An error occurred when refetching link');
    return c.json(response, response.status);
  }
};

export const searchLinks: AppRouteHandler<SearchLinksRoute> = async (c) => {
  const user = c.get('user');
  const { q, limit } = c.req.valid('query');
  const { links } = c.get('repos');

  try {
    const searchLimit = Math.min(limit ?? 5, 10);
    const searchQuery = q.trim();

    if (searchQuery.length === 0) {
      const response = successResponse([], 'No search query provided');
      return c.json(response, response.status);
    }

    const result = await links.search(
      user.id,
      searchQuery,
      {},
      { limit: searchLimit, orderDirection: 'desc' }
    );

    const suggestions = result.items.map((link) => ({
      id: link.id,
      title: link.title,
      url: link.url,
      excerpt: link.excerpt
    }));

    const response = successResponse(suggestions, 'Search suggestions fetched successfully');
    return c.json(response, response.status);
  } catch (error) {
    logger.error(`Error fetching search suggestions: ${(error as Error).message}`);
    const response = errorResponse(
      'An error occurred when fetching search suggestions',
      HttpStatus.BAD_REQUEST
    );
    return c.json(response, response.status);
  }
};

export const updateLinkTags: AppRouteHandler<UpdateLinkTagsRoute> = async (c) => {
  if (isDemoMode()) {
    const response = demoModeForbiddenResponse();
    return c.json(response, response.status);
  }

  const user = c.get('user');
  const { id } = c.req.valid('param');
  const { tags: inputTags } = c.req.valid('json');
  const { links } = c.get('repos');

  try {
    const link = await links.findById(id, user.id);
    if (!link) {
      const response = errorResponse('Link not found', HttpStatus.NOT_FOUND);
      return c.json(response, response.status);
    }

    const { tags } = c.get('repos');
    await tags.replaceTagsForLink(
      id,
      inputTags.map((tag) => tag.id),
      user.id
    );

    const updatedTags = await links.getTagsForLink(id, user.id);

    const response = successResponse(updatedTags, 'Link tags updated successfully');
    return c.json(response, response.status);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error updating link tags: ${errorMessage}`);
    const response = errorResponse('An error occurred when updating link tags');
    return c.json(response, response.status);
  }
};
