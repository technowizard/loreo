import { describe, expect, it, vi } from 'vitest';

import { formatFileSize, formatReadingTime, getUrlName, greetUser, sanitizeUrl } from './utils';

describe('getUrlName', () => {
  it('should return hostname without www', () => {
    expect(getUrlName('https://www.example.com/path')).toBe('example.com');
  });

  it('should return hostname as-is when no www', () => {
    expect(getUrlName('https://example.com')).toBe('example.com');
  });
});

describe('sanitizeUrl', () => {
  it('should reject data URIs by default', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('should allow raster data images only when requested for image sources', () => {
    const dataUri = 'data:image/png;base64,abc123';

    expect(sanitizeUrl(dataUri, { allowDataImage: true })).toBe(dataUri);
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>', { allowDataImage: true })).toBe(
      ''
    );
  });

  it('should normalize http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('should normalize https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
  });

  it('should allow relative URLs starting with /', () => {
    expect(sanitizeUrl('/some/path')).toBe(`${window.location.origin}/some/path`);
  });

  it('should reject non-http protocols', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  it('should allow valid relative paths with spaces', () => {
    expect(sanitizeUrl('not a url')).toBe(`${window.location.origin}/not%20a%20url`);
  });

  it('should reject ftp protocol', () => {
    expect(sanitizeUrl('ftp://example.com/file')).toBe('');
  });
});

describe('formatReadingTime', () => {
  it('should return <1 min for values under 1', () => {
    expect(formatReadingTime(0)).toBe('<1 min');
    expect(formatReadingTime(0.5)).toBe('<1 min');
  });

  it('should return 1 min exactly for 1', () => {
    expect(formatReadingTime(1)).toBe('1 min');
  });

  it('should return N mins for values above 1', () => {
    expect(formatReadingTime(2)).toBe('2 mins');
    expect(formatReadingTime(15)).toBe('15 mins');
  });
});

describe('formatFileSize', () => {
  it('should return 0 B for null', () => {
    expect(formatFileSize(null)).toBe('0 B');
  });

  it('should return 0 B for 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('should format bytes', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });

  it('should format gigabytes', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
    expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
  });

  it('should cap at GB for very large values', () => {
    expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1024.0 GB');
  });
});

describe('greetUser', () => {
  it('should greet with Good morning before noon', () => {
    vi.setSystemTime(new Date('2025-01-01T08:00:00'));
    expect(greetUser('Alice')).toBe('Good morning, Alice');
    vi.useRealTimers();
  });

  it('should greet with Good afternoon between noon and 6pm', () => {
    vi.setSystemTime(new Date('2025-01-01T14:00:00'));
    expect(greetUser('Bob')).toBe('Good afternoon, Bob');
    vi.useRealTimers();
  });

  it('should greet with Good evening after 6pm', () => {
    vi.setSystemTime(new Date('2025-01-01T20:00:00'));
    expect(greetUser('Charlie')).toBe('Good evening, Charlie');
    vi.useRealTimers();
  });
});
