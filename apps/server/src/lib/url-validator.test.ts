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

  it('rejects a private IPv4 literal', async () => {
    expect(await isValidUrl('https://192.168.0.10/article')).toBe(false);
    expect(lookupMock).not.toHaveBeenCalled();
  });
});
