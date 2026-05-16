import process from 'node:process';

import dotenv from 'dotenv';
import * as z from 'zod';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: envFile });

const envSchema = z.object({
  HOST: z.string().min(1).default('localhost'),

  PORT: z.coerce.number().int().positive().default(3000),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),

  CORS_ORIGINS: z.union([z.url(), z.literal('*')]).default('http://localhost:3001'),

  JWT_SECRET: z.string(), // min 32 chars

  DATABASE_HOST: z.string().default('localhost'),

  DATABASE_PORT: z.coerce.number().int().positive().default(5432),

  DATABASE_USER: z.string(),

  DATABASE_PASSWORD: z.string(), // min 16 chars

  DATABASE_DB: z.string().default('postgres'),

  DATABASE_URL: z.string().default(''),

  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),

  REDIS_HOST: z.string().default('localhost'),

  REDIS_PORT: z.coerce.number().int().positive().default(6379),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),

  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(50),

  BODY_SIZE_LIMIT: z.coerce.number().int().positive().default(4_194_304),

  PUBLIC_URL: z.string().default(''),

  STORAGE_PATH: z.string().default(''),

  STORAGE_PROVIDER: z.enum(['local', 'local-docker', 's3']).default('local'),

  // S3-compatible storage (AWS S3, Cloudflare R2, MinIO, etc.)
  // S3_ENDPOINT: omit for AWS S3, set to custom URL for R2/MinIO
  S3_ENDPOINT: z.string().default(''),

  S3_REGION: z.string().default('auto'),

  S3_ACCESS_KEY_ID: z.string().default(''),

  S3_SECRET_ACCESS_KEY: z.string().default(''),

  S3_BUCKET_NAME: z.string().default(''),

  // public url for the bucket (CDN, R2 public domain, MinIO public URL, etc.)
  S3_PUBLIC_URL: z.string().default(''),

  BROWSER_URL: z.string().default('ws://localhost:4444/camoufox')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(
    `Invalid env provided.
The following variables are missing or invalid:
${Object.entries(z.flattenError(parsedEnv.error).fieldErrors)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}
`
  );
}

const envData = parsedEnv.data;

const DATABASE_URL = `postgresql://${envData.DATABASE_USER}:${envData.DATABASE_PASSWORD}@${envData.DATABASE_HOST}:${envData.DATABASE_PORT}/${envData.DATABASE_DB}`;

export type Env = z.infer<typeof envSchema>;

export const env = {
  ...envData,
  DATABASE_URL,
  isDevelopment: envData.NODE_ENV === 'development',
  isProduction: envData.NODE_ENV === 'production',
  isTest: envData.NODE_ENV === 'test'
};
