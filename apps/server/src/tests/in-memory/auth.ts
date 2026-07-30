import type { AuthRepository } from '@/repositories/auth.repository.js';

import type { User } from '@/types/auth.js';

export function createInMemoryAuthAdapter(): AuthRepository {
  const usersByEmail = new Map<string, User>();
  const usersById = new Map<string, User>();
  let createdOffset = 0;

  function withoutPassword(user: User) {
    const { passwordHash: _passwordHash, ...rest } = user;
    return rest;
  }

  return {
    findByEmail: async (email) => usersByEmail.get(email) ?? null,

    findById: async (id) => {
      const user = usersById.get(id);
      if (!user || user.deletedAt) return null;
      return withoutPassword(user);
    },

    findByIdWithCredentials: async (id) => usersById.get(id) ?? null,
    findByIdIncludingDeleted: async (id) => {
      const user = usersById.get(id);
      if (!user) return null;
      return withoutPassword(user);
    },

    listUsers: async ({ limit = 50, offset = 0, status = 'active' } = {}) => {
      const users = Array.from(usersById.values())
        .filter((user) => {
          if (status === 'active') return user.deletedAt === null;
          if (status === 'deleted') return user.deletedAt !== null;
          return true;
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(offset, offset + limit)
        .map(withoutPassword);

      return users;
    },

    create: async (data) => {
      const now = new Date(Date.now() + createdOffset++).toISOString();
      const user: User = {
        ...data,
        passwordHash: data.passwordHash,
        id: crypto.randomUUID(),
        role: data.role ?? 'user',
        name: data.name ?? null,
        avatar: data.avatar ?? null,
        settings: {},
        deletedAt: null,
        createdAt: now,
        updatedAt: now
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

    createWithInitialRole: async (data) => {
      const now = new Date(Date.now() + createdOffset++).toISOString();
      const activeUserCount = Array.from(usersById.values()).filter(
        (user) => !user.deletedAt
      ).length;
      const role = data.role ?? (activeUserCount === 0 ? 'admin' : 'user');
      const user: User = {
        ...data,
        passwordHash: data.passwordHash,
        id: crypto.randomUUID(),
        role,
        name: data.name ?? null,
        avatar: data.avatar ?? null,
        settings: {},
        deletedAt: null,
        createdAt: now,
        updatedAt: now
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
      return { ...publicUser, role: user.role };
    },

    countUsers: async () => Array.from(usersById.values()).filter((user) => !user.deletedAt).length,

    countActiveAdmins: async () =>
      Array.from(usersById.values()).filter((user) => user.role === 'admin' && !user.deletedAt)
        .length,

    countArticlesByUser: async () => ({}),

    update: async (id, updates) => {
      const user = usersById.get(id);
      if (!user) return null;

      const updated: User = {
        ...user,
        ...updates,
        settings: updates.settings ?? user.settings,
        updatedAt: new Date().toISOString()
      };
      usersById.set(id, updated);
      usersByEmail.delete(user.email);
      usersByEmail.set(updated.email, updated);

      const {
        passwordHash: _,
        role: __,
        deletedAt: ___,
        createdAt: ____,
        updatedAt: _____,
        ...publicUser
      } = updated;
      return publicUser;
    },
    updateUserForAdmin: async (id, updates) => {
      const user = usersById.get(id);
      if (!user) return null;

      const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
      usersById.set(id, updated);
      usersByEmail.set(updated.email, updated);

      return withoutPassword(updated);
    },
    updateRole: async () => null as never,
    updatePassword: async (id, passwordHash) => {
      const user = usersById.get(id);
      if (!user) return null;

      const updated = { ...user, passwordHash, updatedAt: new Date().toISOString() };
      usersById.set(id, updated);
      usersByEmail.set(updated.email, updated);

      const {
        passwordHash: _,
        role: __,
        deletedAt: ___,
        createdAt: ____,
        updatedAt: _____,
        ...publicUser
      } = updated;
      return publicUser;
    },
    updateDeletedAt: async (id, deletedAt) => {
      const user = usersById.get(id);
      if (!user) throw new Error(`No user found by id: ${id}`);

      const updated = { ...user, deletedAt, updatedAt: new Date().toISOString() };
      usersById.set(id, updated);
      usersByEmail.set(updated.email, updated);

      return withoutPassword(updated);
    }
  } satisfies AuthRepository;
}
