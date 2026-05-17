import { generateToken } from '@/lib/jwt.js';

import type { UserWithoutPassword } from '@/types/auth.js';

export function makeTestUser(overrides: Partial<UserWithoutPassword> = {}): UserWithoutPassword {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@example.com',
    name: 'Test User',
    avatar: null,
    role: 'user',
    settings: {},
    deletedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

export async function authCookieFor(
  user: Pick<UserWithoutPassword, 'id' | 'email'>
): Promise<string> {
  return `token=${await generateToken(user.id, user.email)}`;
}
