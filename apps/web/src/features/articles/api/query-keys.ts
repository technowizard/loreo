export const linkKeys = {
  all: ['links'] as const,
  infinites: () => [...linkKeys.all, 'infinite'] as const,
  lists: () => [...linkKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...linkKeys.lists(), { filters }] as const,
  details: () => [...linkKeys.all, 'detail'] as const,
  detail: (id: string) => [...linkKeys.details(), id] as const,
  infinite: (filters?: Record<string, unknown>) => [...linkKeys.infinites(), { filters }] as const,
  upcoming: (id: string) => [...linkKeys.all, 'upcoming', id] as const
};
