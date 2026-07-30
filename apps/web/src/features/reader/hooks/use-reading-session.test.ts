import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useReadingSession } from './use-reading-session';

const subscribe = vi.hoisted(() => vi.fn(() => vi.fn()));

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ subscribe })
}));

const link = {
  readingProgress: 0,
  timeSpentReading: 0,
  isRead: false
};

function setScrollPosition(scrollY: number) {
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    value: scrollY,
    writable: true
  });
}

describe('useReadingSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    subscribe.mockClear();
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 1200
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 200
    });
    setScrollPosition(0);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  it('throttles scroll progress updates and persists the latest position', () => {
    const { result } = renderHook(() =>
      useReadingSession({
        linkId: 'link-1',
        link,
        onSaveProgress: vi.fn()
      })
    );

    setScrollPosition(500);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current.progress).toBe(0);

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current.progress).toBe(0.5);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(localStorage.getItem('reading-position-link-1')).toBe(
      JSON.stringify({ progress: 0.5, scrollPosition: 500 })
    );
  });

  it('restores a persisted reading position above the resume threshold', () => {
    localStorage.setItem(
      'reading-position-link-2',
      JSON.stringify({ progress: 0.4, scrollPosition: 640 })
    );

    const { result } = renderHook(() =>
      useReadingSession({
        linkId: 'link-2',
        link,
        onSaveProgress: vi.fn()
      })
    );

    expect(result.current.restorablePosition).toEqual({
      progress: 0.4,
      scrollPosition: 640
    });

    act(() => result.current.restore());
    expect(window.scrollTo).toHaveBeenCalledWith({ behavior: 'smooth', top: 640 });
    expect(result.current.restorablePosition).toBeNull();
  });

  it('uses the unload save callback when the page is leaving', () => {
    const onSaveProgress = vi.fn();
    const onSaveProgressOnUnload = vi.fn();
    renderHook(() =>
      useReadingSession({
        linkId: 'link-3',
        link,
        onSaveProgress,
        onSaveProgressOnUnload
      })
    );

    setScrollPosition(500);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(150);
      window.dispatchEvent(new Event('beforeunload'));
    });

    expect(onSaveProgressOnUnload).toHaveBeenCalledWith({
      readingProgress: 50,
      timeSpentReading: 0
    });
    expect(onSaveProgress).not.toHaveBeenCalled();
  });
});
