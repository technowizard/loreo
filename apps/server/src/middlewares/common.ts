import process from 'node:process';

import type { ErrorHandler, NotFoundHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { errorResponse, HttpStatus } from '../lib/response.js';

export const notFound: NotFoundHandler = (c) => {
  const response = errorResponse(`Not Found - ${c.req.path}`, HttpStatus.NOT_FOUND);

  return c.json(response, response.status);
};

export const onError: ErrorHandler = (err, c) => {
  const currentStatus = 'status' in err ? err.status : c.newResponse(null).status;
  const statusCode =
    currentStatus !== HttpStatus.OK
      ? (currentStatus as ContentfulStatusCode)
      : HttpStatus.INTERNAL_SERVER_ERROR;

  const env = c.env?.NODE_ENV || process.env?.NODE_ENV;

  return c.json(
    {
      message: err.message,

      stack: env === 'production' ? undefined : err.stack
    },
    statusCode
  );
};
