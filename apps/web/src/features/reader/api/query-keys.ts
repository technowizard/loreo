export const highlightKeys = {
  all: ['highlights'] as const,
  byLink: (linkId: string) => [...highlightKeys.all, linkId] as const
};
