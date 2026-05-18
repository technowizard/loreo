import { useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useHighlights } from '../hooks/use-highlights';
import { useParagraphTracker } from '../hooks/use-paragraph-tracker';

import { sanitizeUrl } from '@/lib/utils';

import type { Highlight } from '@/types/highlights';

import { HighlightableText } from './highlighter/highlightable-text';

interface ReaderContentProps {
  articleHighlights?: Highlight[];
  handleCreateHighlight?: (highlight: Omit<Highlight, 'id'>) => void;
  handleRemoveHighlight?: (id: string) => void;
  handleUpdateHighlight?: (payload: { highlight: Partial<Highlight>; id: string }) => void;
  textContent: string;
}

export function ReaderContent({
  articleHighlights = [],
  handleCreateHighlight,
  handleRemoveHighlight,
  handleUpdateHighlight,
  textContent
}: ReaderContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { indicatorRef } = useParagraphTracker(contentRef, containerRef);

  const { setSelectedHighlightId } = useHighlights();

  useEffect(() => {
    return () => setSelectedHighlightId(null);
  }, [setSelectedHighlightId]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div
        className="bg-primary-400 sepia-theme:bg-sepia-400 absolute left-0 z-10 w-1 rounded-r-full transition-all duration-700 ease-out sm:rounded-full"
        ref={indicatorRef}
        style={{
          marginLeft: '-16px',
          pointerEvents: 'none',
          top: 0,
          willChange: 'transform, height'
        }}
      />

      <div ref={contentRef} style={{ lineHeight: 1.8, position: 'relative' }}>
        <HighlightableText
          highlights={articleHighlights}
          onCreate={handleCreateHighlight}
          onHighlightClick={(highlight) => setSelectedHighlightId(highlight.id)}
          onRemove={handleRemoveHighlight}
          onUpdate={handleUpdateHighlight}
        >
          <Markdown
            components={{
              img: ({ alt, src }) => (
                <img
                  alt={alt || ''}
                  src={src || ''}
                  style={{
                    display: 'block',
                    height: 'auto',
                    margin: '1rem 0',
                    maxWidth: '100%'
                  }}
                />
              )
            }}
            remarkPlugins={[remarkGfm]}
            urlTransform={(url) => sanitizeUrl(url ?? '')}
          >
            {textContent}
          </Markdown>
        </HighlightableText>
      </div>
    </div>
  );
}
