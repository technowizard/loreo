import type { Buffer } from 'node:buffer';
import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const _scrypt = promisify(scrypt);

export const passwordManager = {
  async compare(storedPassword: string, providedPassword: string) {
    const [salt, storedHash] = storedPassword.split(':');

    const providedHash = (await _scrypt(providedPassword, salt as string, 64)) as Buffer;

    return providedHash.toString('hex') === storedHash;
  },

  async hash(password: string) {
    const salt = randomBytes(8).toString('hex');
    const hash = (await _scrypt(password, salt, 64)) as Buffer;

    return `${salt}:${hash.toString('hex')}`;
  }
};
