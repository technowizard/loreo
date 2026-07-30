import { describe, expect, it } from 'vitest';

import { db } from '@/db/index.js';

import { passwordManager } from '@/lib/password-manager.js';

import { createDrizzleAuthAdapter } from './auth.repository.js';

describe('createWithInitialRole', () => {
  it('assigns only one admin when first-user registrations race', async () => {
    const auth = createDrizzleAuthAdapter(db);
    const passwordHash = await passwordManager.hash('password123');

    const [first, second] = await Promise.all([
      auth.createWithInitialRole({
        email: 'race-a@example.com',
        passwordHash,
        name: 'Race A',
        settings: {}
      }),
      auth.createWithInitialRole({
        email: 'race-b@example.com',
        passwordHash,
        name: 'Race B',
        settings: {}
      })
    ]);

    expect([first.role, second.role].sort()).toEqual(['admin', 'user']);
    await expect(auth.countActiveAdmins()).resolves.toBe(1);
    await expect(auth.countUsers()).resolves.toBe(2);
  });
});
