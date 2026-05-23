import { describe, expect, it } from 'vitest';

import { getRecentlyCompletedLinkIds } from './get-completed-link-ids';

describe('getRecentlyCompletedLinkIds', () => {
  it('should return empty array when no links', () => {
    expect(getRecentlyCompletedLinkIds([], [])).toEqual([]);
  });

  it('should return empty array when no status changes', () => {
    const previous = [
      { id: '1', processingStatus: 'completed' as const },
      { id: '2', processingStatus: 'pending' as const }
    ];
    const current = [
      { id: '1', processingStatus: 'completed' as const },
      { id: '2', processingStatus: 'pending' as const }
    ];
    expect(getRecentlyCompletedLinkIds(previous, current)).toEqual([]);
  });

  it('should detect newly completed links', () => {
    const previous = [
      { id: '1', processingStatus: 'pending' as const },
      { id: '2', processingStatus: 'processing' as const }
    ];
    const current = [
      { id: '1', processingStatus: 'completed' as const },
      { id: '2', processingStatus: 'completed' as const }
    ];
    expect(getRecentlyCompletedLinkIds(previous, current)).toEqual(['1', '2']);
  });

  it('should not include previously completed links', () => {
    const previous = [{ id: '1', processingStatus: 'completed' as const }];
    const current = [{ id: '1', processingStatus: 'completed' as const }];
    expect(getRecentlyCompletedLinkIds(previous, current)).toEqual([]);
  });

  it('should only include links that were pending or processing', () => {
    const previous = [{ id: '1', processingStatus: 'failed' as const }];
    const current = [{ id: '1', processingStatus: 'completed' as const }];
    expect(getRecentlyCompletedLinkIds(previous, current)).toEqual([]);
  });

  it('should handle new links that appear completed', () => {
    const previous: {
      id: string;
      processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
    }[] = [];
    const current = [{ id: '1', processingStatus: 'completed' as const }];
    // New link with no previous status is not "recently" completed
    expect(getRecentlyCompletedLinkIds(previous, current)).toEqual([]);
  });
});
