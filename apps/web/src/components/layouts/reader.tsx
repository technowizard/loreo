import { useParams } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { NoteCard } from '@/features/reader/components/note-card';
import { useHighlights } from '@/features/reader/hooks/use-highlights';

import type { Highlight } from '@/types/highlights';

import ReaderNav from '../navigation/reader-nav';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';

interface ReaderLayoutProps {
  children: ReactNode;
  highlights?: Highlight[];
  onUpdateHighlight?: (payload: { highlight: Partial<Highlight>; id: string }) => void;
  onRemoveHighlight?: (id: string) => void;
}

function ReaderLayout({
  children,
  highlights = [],
  onUpdateHighlight,
  onRemoveHighlight
}: ReaderLayoutProps) {
  const { t } = useTranslation('common');
  const id = useParams({ from: '/_protected/articles/$id' }).id;
  const { selectedHighlightId, setSelectedHighlightId, showHighlights, toggleShowHighlights } =
    useHighlights();

  return (
    <div className="bg-background min-h-screen">
      <ReaderNav linkId={id} onOpenHighlights={() => toggleShowHighlights()} />
      <div className="mx-auto max-w-[80ch] p-4 px-4 py-8 transition-colors sm:px-6 lg:px-8">
        {children}
      </div>

      <Sheet
        onOpenChange={(open) => {
          if (!open) {
            setSelectedHighlightId(null);
          }
          toggleShowHighlights();
        }}
        open={showHighlights}
      >
        <SheetContent overlay={false}>
          <SheetHeader>
            <SheetTitle>{t('reader.highlights.title')}</SheetTitle>
            <SheetDescription>{t('reader.highlights.description')}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 overflow-y-auto p-4">
            {highlights.map((highlight) => (
              <NoteCard
                color={highlight.color}
                highlight={highlight.text}
                id={highlight.id}
                isSelected={selectedHighlightId === highlight.id}
                key={highlight.id}
                note={highlight.note}
                onRemove={() => onRemoveHighlight?.(highlight.id)}
                onUpdate={(updates) =>
                  onUpdateHighlight?.({ highlight: updates, id: highlight.id })
                }
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default ReaderLayout;
