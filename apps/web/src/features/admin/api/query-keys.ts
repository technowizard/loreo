export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  userList: (filters?: Record<string, unknown>) => [...adminKeys.users(), { filters }] as const,
  userDetails: () => [...adminKeys.users(), 'detail'] as const,
  userDetail: (id: string) => [...adminKeys.userDetails(), id] as const
};

export const adminUserMutationMeta = {
  invalidates: [adminKeys.users()]
};
