import { SquareHalfIcon, TrashIcon } from '@phosphor-icons/react';

import { useHighlights } from '../../hooks/use-highlights';

import type { ColorOption } from './types';
import type { Highlight } from '@/types/highlights';

import { HIGHLIGHT_COLORS } from './colors';

interface ManageHighlightProps {
  action: 'create' | 'edit';
  colors?: ColorOption[];
  createHighlight?: (color: string) => void;
  onClose: () => void;
  removeHighlight?: (highlightId: string) => void;
  updateHighlight?: (highlightId: string, updates: Partial<Highlight>) => void;
}

const DEFAULT_COLORS: ColorOption[] = HIGHLIGHT_COLORS.map(({ swatch, label, value }) => ({
  color: swatch,
  label,
  value
}));

export function ManageHighlight({
  action = 'create',
  colors = DEFAULT_COLORS,
  createHighlight,
  onClose,
  removeHighlight,
  updateHighlight
}: ManageHighlightProps) {
  const { selectedHighlightId, toggleShowHighlights } = useHighlights();

  return (
    <div className="flex min-w-40 flex-col items-center gap-2">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 p-2">
          {colors.map(({ color, label, value }) => (
            <button
              aria-label={`Highlight in ${label}`}
              className="size-6 cursor-pointer rounded-full border-none p-0"
              key={value}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                if (action === 'edit') {
                  updateHighlight?.(selectedHighlightId, { color: value });
                } else {
                  createHighlight?.(value);
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                backgroundColor: color
              }}
              title={`Highlight in ${label}`}
            />
          ))}
        </div>
        {action === 'edit' && (
          <div className="flex flex-col">
            <button
              className="hover:bg-secondary flex w-full items-center gap-2 rounded-4xl p-2"
              onClick={() => {
                toggleShowHighlights();

                onClose();
              }}
            >
              <SquareHalfIcon className="size-6" />
              <div className="text-foreground text-sm font-semibold">View in panel</div>
            </button>
            <button
              className="hover:bg-secondary flex w-full items-center gap-2 rounded-4xl p-2"
              onClick={() => {
                removeHighlight?.(selectedHighlightId);

                onClose();
              }}
            >
              <TrashIcon className="size-6" />
              <div className="text-foreground text-sm font-semibold">Remove highlight</div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
