import { and, count, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import type * as schema from '@/db/schemas/index.js';
import { linksTable, usersTable } from '@/db/schemas/index.js';

import { logger } from '@/lib/logger.js';

import type {
  CreateUser,
  PublicUser,
  PublicUserWithRole,
  User,
  UserWithoutPassword
} from '@/types/auth.js';

type DrizzleClient = NodePgDatabase<typeof schema>;

export type ListUsersStatus = 'active' | 'deleted' | 'all';

export interface ListUsersOptions {
  limit?: number;
  offset?: number;
  status?: ListUsersStatus;
}

const publicUserColumns = {
  id: usersTable.id,
  email: usersTable.email,
  name: usersTable.name,
  avatar: usersTable.avatar,
  settings: usersTable.settings
};

const userWithoutPasswordColumns = {
  id: usersTable.id,
  email: usersTable.email,
  name: usersTable.name,
  avatar: usersTable.avatar,
  role: usersTable.role,
  settings: usersTable.settings,
  deletedAt: usersTable.deletedAt,
  createdAt: usersTable.createdAt,
  updatedAt: usersTable.updatedAt
};

export interface AuthRepository {
  create(userData: CreateUser): Promise<PublicUser>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<UserWithoutPassword | null>;
  // Returns full User including passwordHash — only for auth verification
  findByIdWithCredentials(id: string): Promise<User | null>;
  findByIdIncludingDeleted(id: string): Promise<UserWithoutPassword | null>;
  listUsers(options?: ListUsersOptions): Promise<UserWithoutPassword[]>;
  update(
    id: string,
    updates: Partial<Omit<User, 'passwordHash' | 'id' | 'createdAt'>>
  ): Promise<PublicUser | null>;
  updateUserForAdmin(
    id: string,
    updates: Partial<Pick<User, 'name' | 'role'>>
  ): Promise<UserWithoutPassword | null>;
  updateRole(id: string, role: string): Promise<PublicUserWithRole>;
  updatePassword(id: string, passwordHash: string): Promise<PublicUser | null>;
  updateDeletedAt(id: string, deletedAt: string | null): Promise<UserWithoutPassword>;
  countUsers(): Promise<number>;
  countActiveAdmins(): Promise<number>;
  countArticlesByUser(): Promise<Record<string, number>>;
}

function getListUsersWhere(status: ListUsersStatus) {
  if (status === 'active') return isNull(usersTable.deletedAt);
  if (status === 'deleted') return isNotNull(usersTable.deletedAt);
  return undefined;
}

export function createDrizzleAuthAdapter(db: DrizzleClient): AuthRepository {
  return {
    async create(userData) {
      const [createdUser] = await db
        .insert(usersTable)
        .values(userData)
        .returning(publicUserColumns);

      if (!createdUser) {
        throw new Error('Failed to create user');
      }

      return createdUser;
    },

    async findByEmail(email) {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.email, email)
      });

      if (!user) {
        logger.warn(`User not found by email: ${email}`);
        return null;
      }

      return user;
    },

    async findById(id) {
      const [user] = await db
        .select(userWithoutPasswordColumns)
        .from(usersTable)
        .where(and(eq(usersTable.id, id), isNull(usersTable.deletedAt)))
        .limit(1);

      if (!user) {
        logger.warn(`User not found by id: ${id}`);
        return null;
      }

      return user;
    },

    async findByIdWithCredentials(id) {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(and(eq(usersTable.id, id), isNull(usersTable.deletedAt)))
        .limit(1);

      if (!user) {
        logger.warn(`User not found by id: ${id}`);
        return null;
      }

      return user;
    },

    async findByIdIncludingDeleted(id) {
      const [user] = await db
        .select(userWithoutPasswordColumns)
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .limit(1);

      if (!user) {
        logger.warn(`No user found by id: ${id}`);
        return null;
      }

      return user;
    },

    async listUsers(options = {}) {
      const { limit = 50, offset = 0, status = 'active' } = options;

      const users = await db
        .select(userWithoutPasswordColumns)
        .from(usersTable)
        .where(getListUsersWhere(status))
        .orderBy(desc(usersTable.createdAt))
        .limit(limit)
        .offset(offset);

      return users.map((user) => ({
        ...user,
        settings: user.settings as Record<string, unknown>
      }));
    },

    async update(id, updates) {
      const [updatedUser] = await db
        .update(usersTable)
        .set(updates)
        .where(eq(usersTable.id, id))
        .returning(publicUserColumns);

      if (!updatedUser) {
        logger.warn(`No user found by id: ${id}`);
        return null;
      }

      return updatedUser;
    },

    async updateUserForAdmin(id, updates) {
      const [updatedUser] = await db
        .update(usersTable)
        .set(updates)
        .where(eq(usersTable.id, id))
        .returning(userWithoutPasswordColumns);

      return updatedUser ?? null;
    },

    async updatePassword(id, passwordHash) {
      const [updatedUser] = await db
        .update(usersTable)
        .set({ passwordHash })
        .where(eq(usersTable.id, id))
        .returning(publicUserColumns);

      if (!updatedUser) {
        logger.warn(`No user found by id: ${id}`);
        return null;
      }

      return updatedUser;
    },

    async updateRole(id, role) {
      const [updatedUser] = await db
        .update(usersTable)
        .set({ role })
        .where(eq(usersTable.id, id))
        .returning({
          ...publicUserColumns,
          role: usersTable.role
        });

      if (!updatedUser) {
        throw new Error(`No user found by id: ${id}`);
      }

      return updatedUser;
    },

    async updateDeletedAt(id, deletedAt) {
      const [updatedUser] = await db
        .update(usersTable)
        .set({ deletedAt })
        .where(eq(usersTable.id, id))
        .returning(userWithoutPasswordColumns);

      if (!updatedUser) {
        throw new Error(`No user found by id: ${id}`);
      }

      return updatedUser;
    },

    async countUsers() {
      const [users] = await db
        .select({ count: count() })
        .from(usersTable)
        .where(isNull(usersTable.deletedAt));

      if (!users) {
        logger.warn('No users available');
        return 0;
      }

      return Number(users.count);
    },

    async countActiveAdmins() {
      const [users] = await db
        .select({ count: count() })
        .from(usersTable)
        .where(and(eq(usersTable.role, 'admin'), isNull(usersTable.deletedAt)));

      return Number(users?.count ?? 0);
    },

    async countArticlesByUser() {
      const rows = await db
        .select({ userId: linksTable.userId, count: count() })
        .from(linksTable)
        .groupBy(linksTable.userId);

      const counts: Record<string, number> = {};
      for (const row of rows) {
        counts[row.userId] = Number(row.count);
      }
      return counts;
    }
  };
}
