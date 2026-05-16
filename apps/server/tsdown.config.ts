import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts', './scripts/migrate.ts'],
  format: 'esm',
  outDir: './dist',
  clean: true,
  deps: {
    alwaysBundle: [/@loreo\/.*/]
  }
});
