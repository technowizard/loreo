import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

import ipaddr from 'ipaddr.js';

const DNS_LOOKUP_TIMEOUT_MS = 2000;

// Maintained-library backstop (replaces the unmaintained `private-ip`). Treats any address that
// is not a global unicast as blocked, matching the SSRF posture of the explicit range checks
// below and keeping defense-in-depth intact.
function isNonPublicAddress(address: string): boolean {
  try {
    return ipaddr.parse(address).range() !== 'unicast';
  } catch {
    return false;
  }
}

function isBlockedIpv4Address(address: string): boolean {
  const [firstOctet = Number.NaN, secondOctet = Number.NaN] = address
    .split('.')
    .map((segment) => Number(segment));

  if (firstOctet === 0 || firstOctet === 127 || firstOctet >= 224) {
    return true;
  }

  if (firstOctet === 10) {
    return true;
  }

  if (firstOctet === 100 && secondOctet >= 64 && secondOctet <= 127) {
    return true;
  }

  if (firstOctet === 169 && secondOctet === 254) {
    return true;
  }

  if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) {
    return true;
  }

  if (firstOctet === 192 && secondOctet === 168) {
    return true;
  }

  return isNonPublicAddress(address);
}

function isBlockedIpv6Address(address: string): boolean {
  const normalized = address.toLowerCase();

  if (normalized === '::' || normalized === '::1') {
    return true;
  }

  // IPv4-mapped IPv6 literals may encode the final 32 bits in hexadecimal
  // (for example ::ffff:7f00:1), which dotted-IPv4 parsers misclassify.
  // Reject the entire mapped range rather than decoding only one spelling.
  if (normalized.startsWith('::ffff:')) {
    return true;
  }

  if (
    normalized.startsWith('fe80:') ||
    normalized.startsWith('fe90:') ||
    normalized.startsWith('fea0:') ||
    normalized.startsWith('feb0:')
  ) {
    return true;
  }

  if (normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('ff')) {
    return true;
  }

  return isNonPublicAddress(address);
}

function isBlockedAddress(address: string): boolean {
  const family = isIP(address);

  if (family === 4) {
    return isBlockedIpv4Address(address);
  }

  if (family === 6) {
    return isBlockedIpv6Address(address);
  }

  return false;
}

export interface PublicAddress {
  address: string;
  family: 4 | 6;
}

function withoutIpv6Brackets(hostname: string): string {
  return hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
}

async function lookupAllWithTimeout(hostname: string) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      lookup(hostname, { all: true }),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error('DNS lookup timed out')),
          DNS_LOOKUP_TIMEOUT_MS
        );
      })
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function resolvePublicAddresses(url: string): Promise<PublicAddress[] | null> {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
      return null;
    }

    const hostname = withoutIpv6Brackets(parsed.hostname.toLowerCase());
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
      return null;
    }

    const literalFamily = isIP(hostname);
    if (literalFamily !== 0) {
      if (isBlockedAddress(hostname)) return null;
      return [{ address: hostname, family: literalFamily === 4 ? 4 : 6 }];
    }

    const results = await lookupAllWithTimeout(hostname);
    if (results.length === 0 || results.some(({ address }) => isBlockedAddress(address))) {
      return null;
    }

    const publicAddresses: PublicAddress[] = [];
    for (const { address, family } of results) {
      if (family === 4 || family === 6) {
        publicAddresses.push({ address, family });
      }
    }

    return publicAddresses.length > 0 ? publicAddresses : null;
  } catch {
    return null;
  }
}

export async function isValidUrl(url: string): Promise<boolean> {
  return (await resolvePublicAddresses(url)) !== null;
}
