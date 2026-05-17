export function toggleSelectedTagId(selectedTagIds: Set<string>, tagId: string): Set<string> {
  const next = new Set(selectedTagIds);

  if (next.has(tagId)) {
    next.delete(tagId);
  } else {
    next.add(tagId);
  }

  return next;
}

export function createEmptyTagSelection(): Set<string> {
  return new Set();
}

export function selectedTagIdsToArray(selectedTagIds: Set<string>): string[] {
  return Array.from(selectedTagIds);
}
