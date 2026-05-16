import type { AuthRepository } from '@/repositories/auth.repository.js';

import type { User } from '@/types/auth.js';

export function createInMemoryAuthAdapter(): AuthRepository {
  const usersByEmail = new Map<string, User>();
  const usersById = new Map<string, User>();

  return {
    findByEmail: async (email) => usersByEmail.get(email) ?? null,

    findById: async (id) => {
      const user = usersById.get(id);
      if (!user) return null;
      const { passwordHash: _passwordHash, ...rest } = user;
      return rest;
    },

    findByIdWithCredentials: async (id) => usersById.get(id) ?? null,
    findByIdIncludingDeleted: async (id) => {
      const user = usersById.get(id);
      if (!user) return null;
      const { passwordHash: _passwordHash, ...rest } = user;
      return rest;
    },

    create: async (data) => {
      const user: User = {
        ...data,
        passwordHash: data.passwordHash,
        id: crypto.randomUUID(),
        role: data.role ?? 'user',
        name: data.name ?? null,
        avatar: data.avatar ?? null,
        settings: {},
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      usersByEmail.set(user.email, user);
      usersById.set(user.id, user);
      const {
        passwordHash: _,
        role: __,
        deletedAt: ___,
        createdAt: ____,
        updatedAt: _____,
        ...publicUser
      } = user;
      return publicUser;
    },

    countUsers: async () => usersByEmail.size,

    update: async () => null,
    updateRole: async () => null as never,
    updatePassword: async () => null,
    updateDeletedAt: async () => null as never
  } satisfies AuthRepository;
}
