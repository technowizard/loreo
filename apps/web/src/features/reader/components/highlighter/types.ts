import type { Highlight } from '@/types/highlights';

export interface ColorOption {
  color: string;
  label: string;
  value: string;
}

export interface HighlightableTextProps {
  allowCrossElementSelection?: boolean;
  children: React.ReactNode;
  colors?: ColorOption[];
  highlights: Highlight[];
  onCreate?: (highlight: Omit<Highlight, 'id'>) => void;
  onRemove?: (id: string) => void;
  onUpdate?: (payload: { highlight: Partial<Highlight>; id: string }) => void;
  onHighlightClick?: (highlight: Highlight, rect: DOMRect) => void;
}

export interface HighlightableTextHandle {
  clearHighlights: () => void;
  removeHighlight: (highlightId: string) => void;
}
