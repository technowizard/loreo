import type { HighlightableTextProps } from './types';

import { ManageHighlight } from './manage-highlight';
import { selectableProps } from './selectable';
import { useHighlighter } from './use-highlighter';

export function HighlightableText({ children, highlights = [], ...props }: HighlightableTextProps) {
  const {
    closePopover,
    createHighlight,
    FloatingUI,
    floatingUIPosition,
    isFloatingUIVisible,
    popoverState,
    registerContainer,
    registerContent,
    removeHighlight,
    updateHighlight
  } = useHighlighter({ highlights, ...props });

  const isEditing = !!popoverState.editingHighlight;

  return (
    <>
      <FloatingUI
        isVisible={isFloatingUIVisible}
        onClose={closePopover}
        position={floatingUIPosition}
      >
        <ManageHighlight
          action={isEditing ? 'edit' : 'create'}
          createHighlight={createHighlight}
          onClose={closePopover}
          removeHighlight={removeHighlight}
          updateHighlight={updateHighlight}
        />
      </FloatingUI>

      <div ref={registerContainer} style={{ position: 'relative' }}>
        <div
          {...selectableProps}
          ref={registerContent}
          style={{ lineHeight: 1.8, position: 'relative' }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
