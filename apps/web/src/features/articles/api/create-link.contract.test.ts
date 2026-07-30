import { describe, expect, it } from 'vitest';

import { createLinkSchema } from '../../../../../server/src/db/schemas/index.js';

import { createLinkBodySchema } from './create-link';

describe('createLink contract', () => {
  it('accepts the web body shape on the server schema', () => {
    const body = createLinkBodySchema.parse({
      url: 'https://example.com/new-article',
      tags: [{ groupId: 'group-1', name: 'Research' }]
    });

    expect(createLinkSchema.safeParse(body).success).toBe(true);
  });
});
