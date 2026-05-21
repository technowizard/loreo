import { PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { cn } from '@/lib/utils';

import type { Highlight } from '@/types/highlights';

import { HIGHLIGHT_COLORS } from './highlighter/colors';

interface NoteCardProps {
  color: string;
  highlight: string;
  id: string;
  isSelected?: boolean;
  note?: string | null;
  onClick?: () => void;
  onRemove?: () => void;
  onUpdate?: (updates: Partial<Highlight>) => void;
}

export function NoteCard({
  color,
  highlight,
  isSelected,
  note,
  onClick,
  onRemove,
  onUpdate
}: NoteCardProps) {
  const { t } = useTranslation('common');
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState(note || '');
  const cardRef = useRef<HTMLDivElement>(null);
  const selectedColor =
    HIGHLIGHT_COLORS.find(({ value }) => value === color) ?? HIGHLIGHT_COLORS[0];

  useEffect(() => {
    if (isSelected) {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isSelected]);

  const handleColorClick = (newColor: string) => {
    onUpdate?.({ color: newColor });
  };

  const handleSaveNote = () => {
    onUpdate?.({ note: noteText });
    setIsEditing(false);
  };

  const handleDeleteNote = () => {
    onUpdate?.({ note: null });
    setNoteText('');
    setIsEditing(false);
  };

  return (
    <div className="relative" onClick={onClick} ref={cardRef}>
      <div
        className={cn(
          'flex flex-col gap-4 rounded-lg border p-4',
          isSelected &&
            'ring-primary-500/80 sepia-theme:ring-sepia-500 ring-offset-background ring-2 ring-offset-4'
        )}
      >
        <div className="border-l-2 pl-2" style={{ borderLeftColor: selectedColor.markBorder }}>
          <div className="z-1 italic">&quot;{highlight}&quot;</div>
        </div>

        <div className="flex items-center justify-between">
          <div className="font-semibold">{t('reader.notes.highlightColor')}</div>
          <div className="inline-flex gap-2">
            {HIGHLIGHT_COLORS.map(({ swatch, label, value }) => (
              <button
                aria-label={`Highlight in ${label}`}
                className={`size-6 rounded-full ${color === value ? 'ring-primary ring-2 ring-offset-2' : ''}`}
                key={value}
                onClick={(e) => {
                  e.stopPropagation();
                  handleColorClick(value);
                }}
                style={{ backgroundColor: swatch }}
                title={`Highlight in ${label}`}
                type="button"
              />
            ))}
          </div>
        </div>
        {note && !isEditing && (
          <div className="rounded-md border p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2">
              <span className="flex-1">{note}</span>
              <button
                className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                title={t('reader.notes.editNote')}
              >
                <PencilSimpleIcon size={16} weight="bold" />
              </button>
            </div>
          </div>
        )}
        {!note && !isEditing && (
          <div
            className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-zinc-300 p-2 hover:bg-zinc-50"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <PlusIcon />
            <div className="text-foreground font-bold">{t('reader.notes.addNote')}</div>
          </div>
        )}

        {isEditing && (
          <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            <Textarea
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t('reader.notes.addYourThoughts')}
              value={noteText}
            />
            <div className="flex justify-end gap-2">
              <Button onClick={handleDeleteNote} size="sm" variant="destructive">
                {t('reader.notes.deleteNote')}
              </Button>
              <Button onClick={handleSaveNote} size="sm">
                {t('reader.notes.save')}
              </Button>
            </div>
          </div>
        )}

        <div
          className="border-danger-500 flex cursor-pointer items-center justify-center gap-2 rounded-md border p-2"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
        >
          <TrashIcon className="text-danger-500 dark:text-danger-400" />
          <div className="text-danger-500 dark:text-danger-400 font-bold">
            {t('reader.notes.removeHighlight')}
          </div>
        </div>
      </div>
    </div>
  );
}
