import { createMiddleware } from 'hono/factory';

import { HttpStatus } from '@/lib/response.js';

export const adminUser = createMiddleware(async (c, next) => {
  const user = c.get('user');

  if (user?.role !== 'admin') {
    return c.json({ message: 'Forbidden' }, HttpStatus.FORBIDDEN);
  }

  await next();
});
