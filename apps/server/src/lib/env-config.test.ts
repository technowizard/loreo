import { describe, expect, it } from 'vitest';

import { importWithEnv } from '@/tests/env.js';

describe('env-config', () => {
  it('defaults demo mode to false', async () => {
    const { env } = await importWithEnv(
      {
        DATABASE_PASSWORD: 'password',
        DATABASE_USER: 'user',
        JWT_SECRET: 'secret'
      },
      () => import('./env-config.js')
    );

    expect(env.isDemo).toBe(false);
    expect(env.DEMO_MODE).toBe(false);
  });

  it('parses demo mode as true only when explicitly enabled', async () => {
    const { env } = await importWithEnv(
      {
        DATABASE_PASSWORD: 'password',
        DATABASE_USER: 'user',
        DEMO_MODE: 'true',
        JWT_SECRET: 'secret'
      },
      () => import('./env-config.js')
    );

    expect(env.isDemo).toBe(true);
    expect(env.DEMO_MODE).toBe(true);
  });

  it('rejects unsupported demo mode values', async () => {
    await expect(
      importWithEnv(
        {
          DATABASE_PASSWORD: 'password',
          DATABASE_USER: 'user',
          DEMO_MODE: '1',
          JWT_SECRET: 'secret'
        },
        () => import('./env-config.js')
      )
    ).rejects.toThrow();
  });
});
