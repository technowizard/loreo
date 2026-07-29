import { describe, expect, it } from 'vitest';

import { normalizeUrl } from './url-normalizer.js';

describe('normalizeUrl', () => {
  it('removes fragments and sorts query parameters', () => {
    expect(normalizeUrl('https://example.com/article?z=last&a=first#section')).toBe(
      'https://example.com/article?a=first&z=last'
    );
  });
});
