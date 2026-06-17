import { db } from '@/db/index.js';

import { passwordManager } from '@/lib/password-manager.js';
import { HttpStatus, type HttpStatusCode } from '@/lib/response.js';

import type { AuthRepository, ListUsersOptions } from '@/repositories/auth.repository.js';
import { createDrizzleAuthAdapter } from '@/repositories/auth.repository.js';

import type { UserWithoutPassword } from '@/types/auth.js';

interface UpdateUserData {
  name?: string;
  role?: 'admin' | 'user';
}

export class AdminServiceError extends Error {
  constructor(
    message: string,
    public readonly status: HttpStatusCode
  ) {
    super(message);
  }
}

export class AdminService {
  constructor(private repo: AuthRepository = createDrizzleAuthAdapter(db)) {}

  async listUsers(options: ListUsersOptions = {}): Promise<UserWithoutPassword[]> {
    return await this.repo.listUsers(options);
  }

  async getUser(userId: string): Promise<UserWithoutPassword | null> {
    return await this.repo.findById(userId);
  }

  async getUserIncludingDeleted(userId: string): Promise<UserWithoutPassword | null> {
    return await this.repo.findByIdIncludingDeleted(userId);
  }

  async updateUser(userId: string, data: UpdateUserData): Promise<UserWithoutPassword> {
    const existing = await this.repo.findByIdIncludingDeleted(userId);

    if (!existing) {
      throw new AdminServiceError('User not found', HttpStatus.NOT_FOUND);
    }

    const updates: { name?: string; role?: 'admin' | 'user' } = {};

    if (data.name !== undefined) updates.name = data.name;
    if (data.role !== undefined) updates.role = data.role;

    if (Object.keys(updates).length === 0) {
      throw new AdminServiceError('No fields to update', HttpStatus.BAD_REQUEST);
    }

    if (existing.role === 'admin' && updates.role === 'user' && existing.deletedAt === null) {
      await this.ensureAnotherActiveAdmin();
    }

    const updated = await this.repo.updateUserForAdmin(userId, updates);

    if (!updated) {
      throw new AdminServiceError('User not found', HttpStatus.NOT_FOUND);
    }

    return updated;
  }

  async resetUserPassword(userId: string, newPassword: string, confirmNewPassword: string) {
    const existing = await this.repo.findByIdIncludingDeleted(userId);

    if (!existing) {
      throw new AdminServiceError('User not found', HttpStatus.NOT_FOUND);
    }

    if (newPassword !== confirmNewPassword) {
      throw new AdminServiceError('Passwords do not match', HttpStatus.BAD_REQUEST);
    }

    const passwordHash = await passwordManager.hash(newPassword);
    return await this.repo.updatePassword(userId, passwordHash);
  }

  async softDeleteUser(userId: string) {
    const existing = await this.repo.findByIdIncludingDeleted(userId);

    if (!existing) {
      throw new AdminServiceError('User not found', HttpStatus.NOT_FOUND);
    }

    if (existing.role === 'admin' && existing.deletedAt === null) {
      await this.ensureAnotherActiveAdmin();
    }

    return await this.repo.updateDeletedAt(userId, new Date().toISOString());
  }

  async restoreUser(userId: string) {
    const existing = await this.repo.findByIdIncludingDeleted(userId);

    if (!existing) {
      throw new AdminServiceError('User not found', HttpStatus.NOT_FOUND);
    }

    return await this.repo.updateDeletedAt(userId, null);
  }

  private async ensureAnotherActiveAdmin() {
    const activeAdminCount = await this.repo.countActiveAdmins();

    if (activeAdminCount <= 1) {
      throw new AdminServiceError('Cannot remove the last active admin', HttpStatus.BAD_REQUEST);
    }
  }
}

export const adminService = new AdminService();
