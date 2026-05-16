import { randomUUID } from 'node:crypto';

import { customAlphabet } from 'nanoid';

export function generateId(type: 'short' | 'uuid') {
  if (type === 'short') {
    return customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16)();
  }

  return randomUUID();
}
