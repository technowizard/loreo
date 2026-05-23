import { describe, expect, it } from 'vitest';

import { useHighlights } from './use-highlights';

describe('useHighlights', () => {
  it('should have default state', () => {
    const state = useHighlights.getState();
    expect(state.selectedHighlightId).toBe('');
    expect(state.showHighlights).toBe(false);
  });

  it('should set selected highlight id', () => {
    useHighlights.getState().setSelectedHighlightId('highlight-1');
    expect(useHighlights.getState().selectedHighlightId).toBe('highlight-1');
  });

  it('should set selected highlight id to null', () => {
    useHighlights.getState().setSelectedHighlightId('highlight-1');
    useHighlights.getState().setSelectedHighlightId(null);
    expect(useHighlights.getState().selectedHighlightId).toBeNull();
  });

  it('should toggle show highlights', () => {
    const initial = useHighlights.getState().showHighlights;
    useHighlights.getState().toggleShowHighlights();
    expect(useHighlights.getState().showHighlights).toBe(!initial);
  });
});
