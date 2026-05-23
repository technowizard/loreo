import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addDays,
  differenceInDays,
  endOfDay,
  formatDate,
  formatRelativeDate,
  isValidDate,
  parseDate,
  startOfDay,
  subtractDays
} from './date';

describe('formatDate', () => {
  it('should format date with default pattern', () => {
    expect(formatDate('2025-01-15T10:30:00')).toBe('2025-01-15 10:30:00');
  });

  it('should format date with custom pattern', () => {
    expect(formatDate('2025-01-15T10:30:00', 'DD/MM/YYYY')).toBe('15/01/2025');
  });
});

describe('parseDate', () => {
  it('should parse date string with default pattern', () => {
    const result = parseDate('2025-01-15 10:30:00');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(15);
  });

  it('should parse date string with custom pattern', () => {
    const result = parseDate('2025-01-15', 'YYYY-MM-DD');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(15);
  });
});

describe('isValidDate', () => {
  it('should return true for valid date string', () => {
    expect(isValidDate('2025-01-15')).toBe(true);
  });

  it('should return false for invalid date string', () => {
    expect(isValidDate('not a date')).toBe(false);
  });
});

describe('addDays', () => {
  it('should add days to date', () => {
    const result = addDays('2025-01-15', 5);
    expect(result.getDate()).toBe(20);
    expect(result.getMonth()).toBe(0);
  });
});

describe('subtractDays', () => {
  it('should subtract days from date', () => {
    const result = subtractDays('2025-01-15', 5);
    expect(result.getDate()).toBe(10);
    expect(result.getMonth()).toBe(0);
  });
});

describe('differenceInDays', () => {
  it('should calculate positive difference', () => {
    expect(differenceInDays('2025-01-20', '2025-01-15')).toBe(5);
  });

  it('should calculate negative difference', () => {
    expect(differenceInDays('2025-01-10', '2025-01-15')).toBe(-5);
  });
});

describe('startOfDay', () => {
  it('should return start of day', () => {
    const result = startOfDay('2025-01-15T14:30:00');
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });
});

describe('endOfDay', () => {
  it('should return end of day', () => {
    const result = endOfDay('2025-01-15T10:00:00');
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
  });
});

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return Yesterday for 1 day ago', () => {
    const now = new Date('2025-01-15T12:00:00');
    vi.setSystemTime(now);
    const yesterday = '2025-01-14T12:00:00';
    expect(formatRelativeDate(yesterday)).toBe('Yesterday');
  });

  it('should return N days ago for within a week', () => {
    const now = new Date('2025-01-15T12:00:00');
    vi.setSystemTime(now);
    expect(formatRelativeDate('2025-01-10T12:00:00')).toBe('5 days ago');
  });

  it('should return weeks ago for within a month', () => {
    const now = new Date('2025-01-15T12:00:00');
    vi.setSystemTime(now);
    expect(formatRelativeDate('2025-01-01T12:00:00')).toBe('2 weeks ago');
  });

  it('should return months ago for within a year', () => {
    const now = new Date('2025-06-15T12:00:00');
    vi.setSystemTime(now);
    expect(formatRelativeDate('2025-01-15T12:00:00')).toBe('6 months ago');
  });

  it('should return years ago for over a year', () => {
    const now = new Date('2025-06-15T12:00:00');
    vi.setSystemTime(now);
    expect(formatRelativeDate('2022-01-15T12:00:00')).toBe('4 years ago');
  });
});
