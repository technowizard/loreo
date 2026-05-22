import { afterEach, describe, expect, it, vi } from 'vitest';

type ImportEnvOptions = {
  apiUrl?: string;
  demoMode?: 'true' | 'false';
};

async function importEnv(options: ImportEnvOptions = {}) {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv('VITE_API_URL', options.apiUrl ?? '');
  if (options.demoMode) {
    vi.stubEnv('VITE_DEMO_MODE', options.demoMode);
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
    const { env } = await importEnv({ demoMode: 'true' });

    expect(env.isDemo).toBe(true);
  });

  it('defaults API URL to same-origin', async () => {
    const { env } = await importEnv();

    expect(env.API_URL).toBe('');
  });

  it('allows API URL override', async () => {
    const { env } = await importEnv({ apiUrl: 'https://api.example.com' });

    expect(env.API_URL).toBe('https://api.example.com');
  });
});
