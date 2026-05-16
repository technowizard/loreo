import type { z } from '@hono/zod-openapi';
import { ZodError } from 'zod/v4';

export function formatZodError(err: ZodError) {
  return {
    errors: Object.fromEntries(err.issues.map((issue) => [issue.path.join('.'), issue.message]))
  };
}

export type ZodSchema = z.ZodUnion | z.ZodType<object> | z.ZodArray<z.ZodType<object>>;
