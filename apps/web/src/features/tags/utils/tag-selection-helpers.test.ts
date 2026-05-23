import { describe, expect, it } from 'vitest';

import {
  createEmptyTagSelection,
  selectedTagIdsToArray,
  toggleSelectedTagId
} from './tag-selection-helpers';

describe('toggleSelectedTagId', () => {
  it('should add tag id when not present', () => {
    const selected = new Set<string>();
    const result = toggleSelectedTagId(selected, 'tag-1');
    expect(result).toEqual(new Set(['tag-1']));
    // Original should not be mutated
    expect(selected).toEqual(new Set());
  });

  it('should remove tag id when present', () => {
    const selected = new Set(['tag-1', 'tag-2']);
    const result = toggleSelectedTagId(selected, 'tag-1');
    expect(result).toEqual(new Set(['tag-2']));
    // Original should not be mutated
    expect(selected).toEqual(new Set(['tag-1', 'tag-2']));
  });
});

describe('createEmptyTagSelection', () => {
  it('should return empty set', () => {
    expect(createEmptyTagSelection()).toEqual(new Set());
  });
});

describe('selectedTagIdsToArray', () => {
  it('should convert set to array', () => {
    const selected = new Set(['c', 'a', 'b']);
    const result = selectedTagIdsToArray(selected);
    expect(result).toEqual(['c', 'a', 'b']);
  });

  it('should return empty array for empty set', () => {
    expect(selectedTagIdsToArray(new Set())).toEqual([]);
  });
});
