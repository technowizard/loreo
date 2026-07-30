import { beforeEach, describe, expect, it, vi } from 'vitest';

const { envMock, rateLimitMock } = vi.hoisted(() => ({
  envMock: {
    BODY_SIZE_LIMIT: 4_194_304,
    CORS_ORIGINS: 'http://localhost:3001',
    isDevelopment: true,
    isProduction: false
  },
  rateLimitMock: vi.fn(async (_context: unknown, next: () => Promise<void>) => next())
}));

vi.mock('./env-config.js', () => ({ env: envMock }));
vi.mock('../middlewares/rate-limit.js', () => ({ rateLimit: rateLimitMock }));

import createApp from './create-app.js';

async function requestProbe() {
  const app = createApp();
  app.get('/probe', (c) => c.text('ok'));

  return app.request('/probe');
}

describe('createApp global rate limiting', () => {
  beforeEach(() => {
    envMock.isDevelopment = true;
    envMock.isProduction = false;
    rateLimitMock.mockClear();
  });

  it('skips the global rate limiter in development', async () => {
    const response = await requestProbe();

    expect(response.status).toBe(200);
    expect(rateLimitMock).not.toHaveBeenCalled();
  });

  it('applies the global rate limiter in production', async () => {
    envMock.isDevelopment = false;
    envMock.isProduction = true;

    const response = await requestProbe();

    expect(response.status).toBe(200);
    expect(rateLimitMock).toHaveBeenCalledOnce();
  });
});
