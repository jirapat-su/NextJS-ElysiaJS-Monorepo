import z from 'zod';

/**
 * Server-side environment variables schema
 * These are only available on the server and never exposed to the client
 */
export const serverSchema = {
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development')
    .readonly(),
  BETTER_AUTH_DOMAIN: z.url().min(1).optional().readonly(),
  BETTER_AUTH_SECRET: z.string().min(32).readonly(),
  BETTER_AUTH_TRUSTED_ORIGINS: z
    .string()
    .trim()
    .refine(
      value => {
        const origins = value
          .split(',')
          .map(origin => origin.trim())
          .filter(Boolean);

        if (origins.length === 0) {
          return false;
        }

        return origins.every(origin => {
          try {
            new URL(origin);
            return true;
          } catch {
            return false;
          }
        });
      },
      {
        message:
          'BETTER_AUTH_TRUSTED_ORIGINS must be a comma-separated list ' +
          'of valid URLs',
      }
    )
    .min(1)
    .readonly()
    .transform(value =>
      value
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean)
    ),
  DATABASE_URL: z.url().min(1).readonly(),
  REDIS_URL: z.url().min(1).readonly(),
  PORT: z.coerce.number().min(1).max(65535).default(5005).readonly(),
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
};

/**
 * Server-side runtime environment mapping
 */
export const serverRuntimeEnv = {
  NODE_ENV: process.env.NODE_ENV,
  BETTER_AUTH_DOMAIN: process.env.BETTER_AUTH_DOMAIN,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_TRUSTED_ORIGINS: process.env.BETTER_AUTH_TRUSTED_ORIGINS,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  PORT: process.env.PORT,
  TZ: process.env.TZ,
};
