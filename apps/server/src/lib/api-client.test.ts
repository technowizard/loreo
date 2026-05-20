import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchWithValidatedRedirects } from './api-client.js';

const isValidUrlMock = vi.hoisted(() => vi.fn());

vi.mock('./url-validator.js', () => ({
  isValidUrl: isValidUrlMock
}));

describe('fetchWithValidatedRedirects', () => {
  beforeEach(() => {
    isValidUrlMock.mockReset();
    vi.restoreAllMocks();
  });

  function redirectResponse(location: string) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: location
      }
    });
  }

  it('rejects redirects to private targets', async () => {
    isValidUrlMock.mockImplementation(
      async (url: string) => url === 'https://example.com/image.jpg'
    );

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      redirectResponse('http://127.0.0.1/internal')
    );

    await expect(fetchWithValidatedRedirects('https://example.com/image.jpg')).rejects.toThrow(
      /redirect/i
    );
  });

  it('follows safe redirects until the final response', async () => {
    isValidUrlMock.mockImplementation(
      async (url: string) =>
        url === 'https://example.com/image.jpg' || url === 'https://cdn.example.com/image.jpg'
    );

    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock.mockResolvedValueOnce(redirectResponse('https://cdn.example.com/image.jpg'));
    fetchMock.mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const response = await fetchWithValidatedRedirects('https://example.com/image.jpg');

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://example.com/image.jpg',
      expect.objectContaining({ redirect: 'manual' })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://cdn.example.com/image.jpg',
      expect.objectContaining({ redirect: 'manual' })
    );
  });

  it('rejects redirects that exceed the limit', async () => {
    isValidUrlMock.mockResolvedValue(true);

    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock
      .mockResolvedValueOnce(redirectResponse('https://one.example.com/image.jpg'))
      .mockResolvedValueOnce(redirectResponse('https://two.example.com/image.jpg'))
      .mockResolvedValueOnce(redirectResponse('https://three.example.com/image.jpg'))
      .mockResolvedValueOnce(redirectResponse('https://four.example.com/image.jpg'))
      .mockResolvedValueOnce(redirectResponse('https://five.example.com/image.jpg'))
      .mockResolvedValueOnce(redirectResponse('https://six.example.com/image.jpg'));

    await expect(fetchWithValidatedRedirects('https://example.com/image.jpg')).rejects.toThrow(
      /redirect/i
    );
  });
});
