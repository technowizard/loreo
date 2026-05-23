import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useDebounce } from './use-debounce';

describe('useDebounce', () => {
  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('should debounce value updates', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: 'first' }
    });

    expect(result.current).toBe('first');

    rerender({ value: 'second' });
    expect(result.current).toBe('first'); // Should still be first

    await waitFor(() => expect(result.current).toBe('second'), {
      timeout: 200
    });
  });

  it('should cancel previous timeout on rapid changes', async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: 'a' }
    });

    rerender({ value: 'b' });
    act(() => vi.advanceTimersByTime(50));
    expect(result.current).toBe('a'); // Not yet debounced

    rerender({ value: 'c' });
    act(() => vi.advanceTimersByTime(50));
    expect(result.current).toBe('a'); // Still not debounced, b was cancelled

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('c'); // Only c should fire

    vi.useRealTimers();
  });

  it('should use default delay of 300ms', async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'initial' }
    });

    rerender({ value: 'updated' });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('initial'); // Not yet, default is 300

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('updated');

    vi.useRealTimers();
  });
});
