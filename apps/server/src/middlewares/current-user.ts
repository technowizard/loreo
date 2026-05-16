import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';

import { verifyToken } from '@/lib/jwt.js';
import { HttpStatus } from '@/lib/response.js';

export const currentUser = createMiddleware(async (c, next) => {
  const token = getCookie(c, 'token');

  if (!token) {
    return c.json({ message: 'Unauthorized' }, HttpStatus.UNAUTHORIZED);
  }

  try {
    const payload = await verifyToken(token);
    const userId = payload.sub as string;

    if (!userId) {
      return c.json({ message: 'Invalid token' }, HttpStatus.UNAUTHORIZED);
    }

    const { auth } = c.get('repos');
    const user = await auth.findById(userId);

    c.set('user', user);

    await next();
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ message: error.message }, HttpStatus.UNAUTHORIZED);
    }
  }
});
