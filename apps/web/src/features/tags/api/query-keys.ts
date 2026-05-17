export const tagsKeys = {
  all: ['tags'] as const,
  lists: () => [...tagsKeys.all, 'list'] as const,
  groups: () => [...tagsKeys.all, 'groups'] as const
};

export const tagsMutationMeta = {
  invalidates: [tagsKeys.all]
};
