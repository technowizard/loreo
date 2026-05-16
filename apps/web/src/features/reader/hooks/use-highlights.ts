import { produce } from 'immer';
import { create } from 'zustand';

import { createSelectorHooks } from '@/lib/create-selector-hooks';

interface HighlightsType {
  selectedHighlightId: string;
  setSelectedHighlightId: (highlightId: string | null) => void;
  showHighlights: boolean;
  toggleShowHighlights: () => void;
}

const useHighlightsBase = create<HighlightsType>((set) => ({
  selectedHighlightId: '',
  setSelectedHighlightId: (highlightId: string | null) =>
    set(
      produce((state) => {
        state.selectedHighlightId = highlightId;
      })
    ),
  showHighlights: false,
  toggleShowHighlights: () =>
    set(
      produce((state) => {
        state.showHighlights = !state.showHighlights;
      })
    )
}));

export const useHighlights = createSelectorHooks(useHighlightsBase);
