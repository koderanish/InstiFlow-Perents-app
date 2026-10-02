import { z } from 'zod';

/**
 * Environment configuration for the Parents app.
 *
 * Values are injected by Expo from `.env` files (EXPO_PUBLIC_* prefix).
 * The app fails fast at startup when configuration is missing or invalid,
 * instead of silently pointing requests at the wrong backend.
 */
const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z
    .string()
    .min(1, 'EXPO_PUBLIC_API_URL is required')
    .refine(
      (value) => {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'EXPO_PUBLIC_API_URL must be a valid URL (e.g. https://api.instiflow.com)' },
    ),
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('; ');
  throw new Error(
    `Invalid environment configuration. Copy .env.example to .env and fill in the values. (${issues})`,
  );
}

export const env = {
  /**
   * Root URL of the InstiFlow backend, without a trailing slash and WITHOUT
   * the `/api` prefix (e.g. https://api.instiflow.com). All routes on the
   * backend are mounted under `/api`, so the API client appends it once here.
   */
  apiUrl: `${parsed.data.EXPO_PUBLIC_API_URL.replace(/\/+$/, '')}/api`,
  appEnv: parsed.data.EXPO_PUBLIC_APP_ENV,
} as const;

export type AppEnv = (typeof env)['appEnv'];
