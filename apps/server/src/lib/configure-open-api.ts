import { Scalar } from '@scalar/hono-api-reference';

import packageJson from '../../package.json' with { type: 'json' };

import type { AppOpenAPI } from './types.js';

export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      version: packageJson.version,
      title: 'Loreo'
    }
  });

  app.get(
    '/reference',
    Scalar({
      url: '/doc',
      theme: 'kepler',
      defaultHttpClient: {
        targetKey: 'js',
        clientKey: 'fetch'
      }
    })
  );
}
