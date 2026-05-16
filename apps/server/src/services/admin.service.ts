import { desc, isNull } from 'drizzle-orm';

import { db } from '@/db/index.js';
import { usersTable } from '@/db/schemas/index.js';

import { passwordManager } from '@/lib/password-manager.js';

import type { AuthRepository } from '@/repositories/auth.repository.js';
import { createDrizzleAuthAdapter } from '@/repositories/auth.repository.js';

import type { UserWithoutPassword } from '@/types/auth.js';

interface ListUsersOptions {
  limit?: number;
  offset?: number;
}

interface UpdateUserData {
  name?: string;
  role?: string;
}

class AdminService {
  constructor(private repo: AuthRepository = createDrizzleAuthAdapter(db)) {}

  async listUsers(options: ListUsersOptions = {}): Promise<UserWithoutPassword[]> {
    const { limit = 50, offset = 0 } = options;

    const users = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        role: usersTable.role,
        settings: usersTable.settings,
        deletedAt: usersTable.deletedAt,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
        avatar: usersTable.avatar
      })
      .from(usersTable)
      .where(isNull(usersTable.deletedAt))
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset);

    return users.map((user) => ({
      ...user,
      settings: user.settings as Record<string, unknown>
    }));
  }

  async getUser(userId: string): Promise<UserWithoutPassword | null> {
    return await this.repo.findById(userId);
  }

  async getUserIncludingDeleted(userId: string): Promise<UserWithoutPassword | null> {
    return await this.repo.findByIdIncludingDeleted(userId);
  }

  async updateUser(userId: string, data: UpdateUserData) {
    const updates: { name?: string; role?: string } = {};

    if (data.name !== undefined) updates.name = data.name;
    if (data.role !== undefined) updates.role = data.role;

    return await this.repo.update(userId, updates);
  }

  async resetUserPassword(userId: string, newPassword: string, confirmNewPassword: string) {
    if (newPassword !== confirmNewPassword) {
      throw new Error('Passwords do not match');
    }

    const passwordHash = await passwordManager.hash(newPassword);
    return await this.repo.updatePassword(userId, passwordHash);
  }

  async softDeleteUser(userId: string) {
    return await this.repo.updateDeletedAt(userId, new Date().toISOString());
  }

  async restoreUser(userId: string) {
    return await this.repo.updateDeletedAt(userId, null);
  }
}

export const adminService = new AdminService();
