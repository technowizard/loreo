import { db } from '@/db/index.js';
import type { UserSettings } from '@/db/schemas/user-settings.js';
import { defaultUserSettings, userSettingsSchema } from '@/db/schemas/user-settings.js';

import { passwordManager } from '@/lib/password-manager.js';

import type { AuthRepository } from '@/repositories/auth.repository.js';
import { createDrizzleAuthAdapter } from '@/repositories/auth.repository.js';

class AuthService {
  constructor(private repo: AuthRepository = createDrizzleAuthAdapter(db)) {}

  async updateOwnEmail(userId: string, currentPassword: string, newEmail: string) {
    const user = await this.repo.findByIdWithCredentials(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await passwordManager.compare(user.passwordHash, currentPassword);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const existingUser = await this.repo.findByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      throw new Error('Email is already in use');
    }

    return await this.repo.update(userId, { email: newEmail });
  }

  async changeOwnPassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ) {
    if (newPassword !== confirmNewPassword) {
      throw new Error('New passwords do not match');
    }

    const user = await this.repo.findByIdWithCredentials(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await passwordManager.compare(user.passwordHash, currentPassword);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const passwordHash = await passwordManager.hash(newPassword);
    return await this.repo.updatePassword(userId, passwordHash);
  }

  async getOwnSettings(userId: string): Promise<UserSettings> {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.settings) {
      return defaultUserSettings;
    }

    return userSettingsSchema.parse(user.settings);
  }

  async updateOwnSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getOwnSettings(userId);
    const validated = userSettingsSchema.parse({ ...current, ...settings });
    await this.repo.update(userId, { settings: validated });
    return validated;
  }
}

export const authService = new AuthService();
