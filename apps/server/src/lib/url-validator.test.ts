import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isValidUrl } from './url-validator.js';

const lookupMock = vi.hoisted(() => vi.fn());

vi.mock('node:dns/promises', () => ({
  lookup: lookupMock
}));

describe('isValidUrl', () => {
  beforeEach(() => {
    lookupMock.mockReset();
  });

  it('rejects localhost without DNS lookup', async () => {
    expect(await isValidUrl('https://localhost/article')).toBe(false);
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it('rejects non-http schemes', async () => {
    expect(await isValidUrl('ftp://example.com/article')).toBe(false);
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it('accepts a public hostname that resolves to a public IP', async () => {
    lookupMock.mockResolvedValue([
      {
        address: '93.184.216.34',
        family: 4
      }
    ] as never);

    expect(await isValidUrl('https://example.com/article')).toBe(true);
    expect(lookupMock).toHaveBeenCalledWith('example.com', { all: true });
  });

  it('rejects a hostname when DNS resolution exceeds the timeout', async () => {
    vi.useFakeTimers();
    try {
      lookupMock.mockReturnValue(new Promise(() => undefined));
      const validation = isValidUrl('https://slow.example/article');

      await vi.advanceTimersByTimeAsync(2000);

      await expect(validation).resolves.toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects a public hostname that resolves to a private IP', async () => {
    lookupMock.mockResolvedValue([
      {
        address: '10.0.0.5',
        family: 4
      }
    ] as never);

    expect(await isValidUrl('https://example.com/article')).toBe(false);
    expect(lookupMock).toHaveBeenCalledWith('example.com', { all: true });
  });

  it('rejects a hostname when any resolved address is private', async () => {
    lookupMock.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '169.254.169.254', family: 4 }
    ] as never);

    expect(await isValidUrl('https://example.com/article')).toBe(false);
  });

  it('rejects a private IPv4 literal', async () => {
    expect(await isValidUrl('https://192.168.0.10/article')).toBe(false);
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it.each([
    ['loopback', 'https://127.0.0.1/article'],
    ['CGNAT', 'https://100.64.0.1/article'],
    ['multicast', 'https://224.0.0.1/article'],
    ['link-local', 'https://169.254.10.10/article'],
    ['this-network', 'https://0.0.0.0/article']
  ])('rejects IPv4 SSRF literal (%s): %s', async (_label, url) => {
    expect(await isValidUrl(url)).toBe(false);
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it.each([
    ['loopback', 'https://[::1]/article'],
    ['link-local', 'https://[fe80::1]/article'],
    ['unique-local', 'https://[fd12:3456:789a::1]/article'],
    ['multicast', 'https://[ff02::1]/article']
  ])('rejects IPv6 SSRF literal (%s): %s', async (_label, url) => {
    expect(await isValidUrl(url)).toBe(false);
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it('accepts a public IPv4 literal', async () => {
    expect(await isValidUrl('https://93.184.216.34/article')).toBe(true);
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it.each(['https://[::ffff:7f00:1]/feed.xml', 'https://[::ffff:a9fe:a9fe]/feed.xml'])(
    'rejects hexadecimal IPv4-mapped IPv6 literals: %s',
    async (url) => {
      expect(await isValidUrl(url)).toBe(false);
      expect(lookupMock).not.toHaveBeenCalled();
    }
  );
});
