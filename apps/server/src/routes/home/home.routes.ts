import { createRoute, z } from '@hono/zod-openapi';

import { jsonContent } from '@/lib/openapi.js';
import { errorResponseSchema, HttpStatus, successResponseSchema } from '@/lib/response.js';

import { currentUser } from '@/middlewares/current-user.js';

const tags = ['Home'];

export const getHomeSuggestions = createRoute({
  tags,
  method: 'get',
  path: '/home/suggestions',
  middleware: [currentUser],
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(
        z.object({
          continueReading: z
            .object({
              coverImage: z.string().nullable(),
              id: z.string(),
              lastReadAt: z.string().or(z.date()),
              progress: z.number(),
              readingTime: z.number(),
              title: z.string()
            })
            .or(z.null()),
          hasReadArticle: z.boolean(),
          recentlySaved: z.array(z.object()),
          longReads: z.object({
            totalArticles: z.number(),
            totalReadingTime: z.number()
          }),
          shortReads: z.object({
            totalArticles: z.number(),
            totalReadingTime: z.number()
          })
        })
      ),
      'Home suggestions fetched successfully'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    )
  }
});

export type GetHomeSuggestionsRoute = typeof getHomeSuggestions;
