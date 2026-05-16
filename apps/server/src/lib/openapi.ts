import { z } from '@hono/zod-openapi';

import type { ZodSchema } from './zod-utils.js';

export function jsonContent<T extends ZodSchema>(schema: T, description: string) {
  return {
    content: {
      'application/json': {
        schema
      }
    },
    description
  };
}

export function jsonContentRequired<T extends ZodSchema>(schema: T, description: string) {
  return {
    ...jsonContent(schema, description),
    required: true
  };
}

export function createMessageObjectSchema(exampleMessage: string = 'Hello World') {
  return z
    .object({
      message: z.string()
    })
    .openapi({
      example: {
        message: exampleMessage
      }
    });
}

export default createMessageObjectSchema;
