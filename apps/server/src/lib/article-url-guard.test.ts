import { describe, expect, it, vi } from 'vitest';

import { assertSafeArticleUrl } from './article-url-guard.js';

const isValidUrlMock = vi.hoisted(() => vi.fn());

vi.mock('./url-validator.js', () => ({
  isValidUrl: isValidUrlMock
}));

describe('assertSafeArticleUrl', () => {
  it('rejects unsafe article urls before browser navigation', async () => {
    isValidUrlMock.mockResolvedValue(false);

    await expect(assertSafeArticleUrl('http://127.0.0.1/internal')).rejects.toThrow(/article url/i);
  });
});
