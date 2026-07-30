import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useParagraphTracker } from './use-paragraph-tracker';

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe = vi.fn();
  disconnect = vi.fn();

  trigger(entries: Partial<IntersectionObserverEntry>[]) {
    this.callback(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
  }
}

describe('useParagraphTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockIntersectionObserver.instances = [];
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  it('observes reader paragraphs and positions the indicator on mount', () => {
    const container = document.createElement('div');
    const content = document.createElement('div');
    const indicator = document.createElement('div');
    const paragraph = document.createElement('p');

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      bottom: 400,
      height: 400,
      left: 0,
      right: 600,
      toJSON: () => {},
      top: 0,
      width: 600,
      x: 0,
      y: 0
    });
    vi.spyOn(paragraph, 'getBoundingClientRect').mockReturnValue({
      bottom: 180,
      height: 100,
      left: 0,
      right: 600,
      toJSON: () => {},
      top: 80,
      width: 600,
      x: 0,
      y: 80
    });

    content.append(paragraph);
    container.append(content);

    const contentRef = { current: content };
    const containerRef = { current: container };
    const { result } = renderHook(() => useParagraphTracker(contentRef, containerRef));
    result.current.indicatorRef.current = indicator;

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(MockIntersectionObserver.instances[0]?.observe).toHaveBeenCalledWith(paragraph);
    expect(MockIntersectionObserver.instances[0]?.disconnect).not.toHaveBeenCalled();
  });

  it('updates the indicator when a later paragraph becomes visible', () => {
    const container = document.createElement('div');
    const content = document.createElement('div');
    const indicator = document.createElement('div');
    const firstParagraph = document.createElement('p');
    const secondParagraph = document.createElement('p');

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      bottom: 600,
      height: 600,
      left: 0,
      right: 600,
      toJSON: () => {},
      top: 0,
      width: 600,
      x: 0,
      y: 0
    });
    vi.spyOn(firstParagraph, 'getBoundingClientRect').mockReturnValue({
      bottom: 100,
      height: 100,
      left: 0,
      right: 600,
      toJSON: () => {},
      top: 0,
      width: 600,
      x: 0,
      y: 0
    });
    vi.spyOn(secondParagraph, 'getBoundingClientRect').mockReturnValue({
      bottom: 320,
      height: 120,
      left: 0,
      right: 600,
      toJSON: () => {},
      top: 200,
      width: 600,
      x: 0,
      y: 200
    });

    content.append(firstParagraph, secondParagraph);
    container.append(content);

    const { result } = renderHook(() =>
      useParagraphTracker({ current: content }, { current: container })
    );
    result.current.indicatorRef.current = indicator;

    const observer = MockIntersectionObserver.instances[0];
    expect(observer).toBeDefined();

    act(() => {
      observer?.trigger([{ intersectionRatio: 0.8, target: secondParagraph }]);
      vi.advanceTimersByTime(300);
    });

    expect(indicator.style.transform).toBe('translateY(200px)');
    expect(indicator.style.height).toBe('120px');
  });
});
