import { describe, expect, it } from 'vitest';

import { resolveRateLimitIpKey } from './rate-limit.js';

describe('resolveRateLimitIpKey', () => {
  it('ignores spoofed forwarded headers when proxies are untrusted', () => {
    expect(
      resolveRateLimitIpKey({
        peerIp: '203.0.113.10',
        forwardedFor: '198.51.100.23',
        realIp: '198.51.100.24',
        trustForwardedHeaders: false
      })
    ).toBe('203.0.113.10');
  });

  it('uses the forwarded client IP when proxies are trusted', () => {
    expect(
      resolveRateLimitIpKey({
        peerIp: '203.0.113.10',
        forwardedFor: '198.51.100.23, 198.51.100.24',
        realIp: '198.51.100.25',
        trustForwardedHeaders: true
      })
    ).toBe('198.51.100.23');
  });
});
