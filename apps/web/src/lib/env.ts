import * as z from 'zod';

const envSchema = z.object({
  API_URL: z.string()
});

const envVars = Object.entries(import.meta.env).reduce<Record<string, string>>((acc, curr) => {
  const [key, value] = curr;
  if (key.startsWith('VITE_')) {
    acc[key.replace('VITE_', '')] = value;
  }
  return acc;
}, {});

const parsedEnv = envSchema.safeParse(envVars);

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

export const env = {
  ...envData,
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production'
};
