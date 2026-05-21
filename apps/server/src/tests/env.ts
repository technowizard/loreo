import { vi } from 'vitest';

type EnvOverrides = Record<string, string | undefined>;

export async function importWithEnv<T>(env: EnvOverrides, importer: () => Promise<T>): Promise<T> {
  vi.resetModules();
  vi.unstubAllEnvs();

  vi.stubEnv('NODE_ENV', env.NODE_ENV ?? 'test');

  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined) vi.stubEnv(key, value);
  }

  try {
    return await importer();
  } finally {
    vi.unstubAllEnvs();
    vi.resetModules();
  }
}
