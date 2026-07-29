import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createValidatedRedirectFetcher } from './api-client.js';

const openServers: ReturnType<typeof createServer>[] = [];

afterEach(async () => {
  await Promise.all(
    openServers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        })
    )
  );
});

function redirectResponse(location: string) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location
    }
  });
}

describe('fetchWithValidatedRedirects', () => {
  it('connects through the approved address without resolving the hostname again', async () => {
    let receivedHost: string | undefined;
    const server = createServer((request, response) => {
      receivedHost = request.headers.host;
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('ok');
    });
    openServers.push(server);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected an ephemeral TCP port');

    const fetchValidated = createValidatedRedirectFetcher({
      resolvePublicAddresses: vi.fn(async () => [{ address: '127.0.0.1', family: 4 as const }])
    });
    const url = `http://does-not-resolve.invalid:${address.port}/feed.xml`;

    const response = await fetchValidated(url);

    await expect(response.text()).resolves.toBe('ok');
    expect(receivedHost).toBe(`does-not-resolve.invalid:${address.port}`);
  });

  it('decodes compressed response bodies before returning them', async () => {
    const server = createServer((_request, response) => {
      const compressed = gzipSync('compressed feed');
      response.writeHead(200, {
        'content-encoding': 'gzip',
        'content-length': String(compressed.byteLength),
        'content-type': 'application/rss+xml'
      });
      response.end(compressed);
    });
    openServers.push(server);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected an ephemeral TCP port');

    const fetchValidated = createValidatedRedirectFetcher({
      resolvePublicAddresses: vi.fn(async () => [{ address: '127.0.0.1', family: 4 as const }])
    });
    const response = await fetchValidated(
      `http://compressed-feed.invalid:${address.port}/feed.xml`
    );

    await expect(response.text()).resolves.toBe('compressed feed');
    expect(response.headers.has('content-encoding')).toBe(false);
    expect(response.headers.has('content-length')).toBe(false);
  });

  it('tries the next approved address when a connection fails', async () => {
    const addresses = [
      { address: '2606:4700:4700::1111', family: 6 as const },
      { address: '1.1.1.1', family: 4 as const }
    ];
    const requestPinned = vi
      .fn()
      .mockRejectedValueOnce(
        Object.assign(new Error('Network unreachable'), { code: 'ENETUNREACH' })
      )
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    const fetchValidated = createValidatedRedirectFetcher({
      requestPinned,
      resolvePublicAddresses: vi.fn(async () => addresses)
    });

    const response = await fetchValidated('https://dual-stack.example/feed.xml');

    await expect(response.text()).resolves.toBe('ok');
    expect(requestPinned).toHaveBeenNthCalledWith(
      1,
      new URL('https://dual-stack.example/feed.xml'),
      addresses[0],
      expect.any(Object)
    );
    expect(requestPinned).toHaveBeenNthCalledWith(
      2,
      new URL('https://dual-stack.example/feed.xml'),
      addresses[1],
      expect.any(Object)
    );
  });

  it('rejects redirects to private targets before making the next request', async () => {
    const resolvePublicAddresses = vi.fn(async (url: string) =>
      url === 'https://example.com/image.jpg'
        ? [{ address: '93.184.216.34', family: 4 as const }]
        : null
    );
    const requestPinned = vi.fn(async () => redirectResponse('http://127.0.0.1/internal'));
    const fetchValidated = createValidatedRedirectFetcher({
      requestPinned,
      resolvePublicAddresses
    });

    await expect(fetchValidated('https://example.com/image.jpg')).rejects.toThrow(/redirect/i);
    expect(requestPinned).toHaveBeenCalledTimes(1);
  });

  it('pins a separately approved address for every safe redirect hop', async () => {
    const resolvePublicAddresses = vi.fn(async (url: string) => {
      if (url === 'https://example.com/image.jpg') {
        return [{ address: '93.184.216.34', family: 4 as const }];
      }
      if (url === 'https://cdn.example.com/image.jpg') {
        return [{ address: '203.0.113.10', family: 4 as const }];
      }
      return null;
    });
    const requestPinned = vi
      .fn()
      .mockResolvedValueOnce(redirectResponse('https://cdn.example.com/image.jpg'))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    const fetchValidated = createValidatedRedirectFetcher({
      requestPinned,
      resolvePublicAddresses
    });

    const response = await fetchValidated('https://example.com/image.jpg');

    expect(response.status).toBe(200);
    expect(requestPinned).toHaveBeenNthCalledWith(
      1,
      new URL('https://example.com/image.jpg'),
      { address: '93.184.216.34', family: 4 },
      expect.any(Object)
    );
    expect(requestPinned).toHaveBeenNthCalledWith(
      2,
      new URL('https://cdn.example.com/image.jpg'),
      { address: '203.0.113.10', family: 4 },
      expect.any(Object)
    );
  });

  it('rejects redirects that exceed the limit', async () => {
    const resolvePublicAddresses = vi.fn(async () => [
      { address: '93.184.216.34', family: 4 as const }
    ]);
    const requestPinned = vi
      .fn()
      .mockResolvedValueOnce(redirectResponse('https://one.example.com/image.jpg'))
      .mockResolvedValueOnce(redirectResponse('https://two.example.com/image.jpg'))
      .mockResolvedValueOnce(redirectResponse('https://three.example.com/image.jpg'))
      .mockResolvedValueOnce(redirectResponse('https://four.example.com/image.jpg'))
      .mockResolvedValueOnce(redirectResponse('https://five.example.com/image.jpg'))
      .mockResolvedValueOnce(redirectResponse('https://six.example.com/image.jpg'));
    const fetchValidated = createValidatedRedirectFetcher({
      requestPinned,
      resolvePublicAddresses
    });

    await expect(
      fetchValidated('https://example.com/image.jpg', { maxRedirects: 5 })
    ).rejects.toThrow(/redirect/i);
  });
});
