import { z } from 'zod';

/**
 * Server-side environment variables schema
 * These are only available on the server and never exposed to the client
 */
export const serverSchema = {
  TZ: z
    .string()
    .trim()
    .refine(
      tz => {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: tz });
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Invalid timezone' }
    )
    .readonly()
    .default('Asia/Bangkok'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
};

/**
 * Server-side runtime environment mapping
 */
export const serverRuntimeEnv = {
  TZ: process.env.TZ,
  NODE_ENV: process.env.NODE_ENV,
};
