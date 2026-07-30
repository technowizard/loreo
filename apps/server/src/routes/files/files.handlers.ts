import type { Context } from 'hono';

import { env } from '@/lib/env-config.js';
import { logger } from '@/lib/logger.js';
import { errorResponse, HttpStatus } from '@/lib/response.js';
import type { AppBindings, AppRouteHandler } from '@/lib/types.js';

import { storageService } from '@/services/storage.service.js';

import type { GetFileRoute } from './files.routes.js';

export interface FileAccessInput {
  isShared: boolean;
  isUserOwned: boolean;
  isLegacySharedArticle: boolean;
  legacyArticlesAllowed: boolean;
}

// Pure access-policy predicate (kept env-free) so the legacy-article flag behaviour is unit-testable
// without touching the process env. New user-scoped article keys are always ownership-checked;
// this only controls whether the pre-user-scoping shared/articles/* prefix stays readable.
export function isFileAccessForbidden({
  isShared,
  isUserOwned,
  isLegacySharedArticle,
  legacyArticlesAllowed
}: FileAccessInput): boolean {
  if (!isShared && !isUserOwned) return true;
  return isLegacySharedArticle && !legacyArticlesAllowed;
}

const getFileHandler: AppRouteHandler<GetFileRoute> = async (c) => {
  const { key } = c.req.valid('param');

  return serveFile(c, key);
};

async function serveFile(c: Context<AppBindings>, key: string) {
  const user = c.get('user');

  try {
    const isShared = storageService.isSharedFile(key);
    const isLegacySharedArticle = key.startsWith('shared/articles/');

    if (!user) {
      const response = errorResponse(
        'Authentication required for user files',
        HttpStatus.UNAUTHORIZED
      );

      return c.json(response, response.status);
    } else {
      const isUserOwned = storageService.isUserFile(key, user.id);

      if (
        isFileAccessForbidden({
          isShared,
          isUserOwned,
          isLegacySharedArticle,
          legacyArticlesAllowed: env.ALLOW_LEGACY_SHARED_ARTICLES
        })
      ) {
        const response = errorResponse('Access denied to this file', HttpStatus.FORBIDDEN);

        return c.json(response, response.status);
      }
    }

    const fileExists = await storageService.fileExists(key);
    if (!fileExists) {
      const response = errorResponse('File not found', HttpStatus.NOT_FOUND);

      return c.json(response, response.status);
    }

    const fileBuffer = await storageService.getFileBuffer(key);
    const fileExtension = key.split('.').pop() || '';
    const contentType = storageService.getContentType(fileExtension);

    return new Response(new Uint8Array(fileBuffer), {
      status: HttpStatus.OK,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
        'Content-Disposition': `inline; filename="${key.split('/').pop()}"`
      }
    });
  } catch (error) {
    logger.error(`Error serving file: ${error}`);

    const response = errorResponse('Internal server error');

    return c.json(response, response.status);
  }
}

export { getFileHandler };
