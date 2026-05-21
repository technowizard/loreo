import { afterEach, describe, expect, it, vi } from 'vitest';

async function importEnv(demoMode?: 'true' | 'false') {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000');
  if (demoMode) {
    vi.stubEnv('VITE_DEMO_MODE', demoMode);
  }

  return import('./env');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('web env', () => {
  it('defaults demo mode off', async () => {
    const { env } = await importEnv();

    expect(env.isDemo).toBe(false);
  });

  it('parses demo mode on', async () => {
    const { env } = await importEnv('true');

    expect(env.isDemo).toBe(true);
  });
});
