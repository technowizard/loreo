import { sign, verify } from 'hono/jwt';

import { env } from './env-config.js';

export interface JWTPayload {
  [key: string]: unknown;
  exp?: number;
}

export async function generateToken(id: string, email: string): Promise<string> {
  const payload: JWTPayload = {
    sub: id,
    email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 // 1 year
  };

  return await sign(payload, env.JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  return await verify(token, env.JWT_SECRET, {
    alg: 'HS256'
  });
}
