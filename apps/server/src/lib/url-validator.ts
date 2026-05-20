import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

import isPrivateIP from 'private-ip';

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

  return Boolean(isPrivateIP(address));
}

function isBlockedIpv6Address(address: string): boolean {
  const normalized = address.toLowerCase();

  if (normalized === '::' || normalized === '::1') {
    return true;
  }

  if (normalized.startsWith('::ffff:')) {
    const mappedAddress = normalized.slice('::ffff:'.length);
    return isBlockedIpv4Address(mappedAddress);
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

  return Boolean(isPrivateIP(address));
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

async function resolvesToBlockedAddress(hostname: string): Promise<boolean> {
  const results = await lookup(hostname, { all: true });
  return results.some(({ address }) => isBlockedAddress(address));
}

export async function isValidUrl(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
      return false;
    }

    if (isBlockedAddress(hostname)) {
      return false;
    }

    if (isIP(hostname) !== 0) {
      return true;
    }

    return !(await resolvesToBlockedAddress(hostname));
  } catch {
    return false;
  }
}
