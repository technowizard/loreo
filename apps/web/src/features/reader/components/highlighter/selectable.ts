export const SELECTABLE_ATTR = 'data-selectable' as const;
export const SELECTABLE_SELECTOR = `[${SELECTABLE_ATTR}]` as const;
export const selectableProps = { [SELECTABLE_ATTR]: 'true' } as const;
