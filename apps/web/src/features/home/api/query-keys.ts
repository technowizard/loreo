export const homeKeys = {
  all: ['home'] as const,
  suggestions: () => [...homeKeys.all, 'suggestions'] as const
};
