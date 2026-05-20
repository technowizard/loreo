import { describe, expect, it, vi } from 'vitest';

import { isAllowedBrowserRequestUrl } from './browser-request-guard.js';

const isValidUrlMock = vi.hoisted(() => vi.fn());

vi.mock('./url-validator.js', () => ({
  isValidUrl: isValidUrlMock
}));

describe('isAllowedBrowserRequestUrl', () => {
  it('rejects private browser request urls', async () => {
    isValidUrlMock.mockResolvedValue(false);

    await expect(isAllowedBrowserRequestUrl('http://127.0.0.1/private')).resolves.toBe(false);
  });

  it('allows public browser request urls', async () => {
    isValidUrlMock.mockResolvedValue(true);

    await expect(isAllowedBrowserRequestUrl('https://example.com/page')).resolves.toBe(true);
  });
});
