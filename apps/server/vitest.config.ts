import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    globalSetup: './src/tests/global-setup.ts',
    setupFiles: './src/tests/setup.ts',
    env: { NODE_ENV: 'test' }
  }
});
