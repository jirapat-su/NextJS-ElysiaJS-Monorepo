import { createEnv } from '@t3-oss/env-core';
import { vercel } from '@t3-oss/env-core/presets-zod';
import z from 'zod';

export const env = createEnv({
  extends: [vercel()],

  server: {
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
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,

  skipValidation: process.env.NODE_ENV === 'test',

  isServer: true,

  onValidationError: issues => {
    console.error('❌ Environment validation failed:');
    for (const issue of issues) {
      const path = issue.path?.join('.') ?? 'unknown';
      console.error(`  - ${path}: ${issue.message}`);
    }
    throw new Error('Invalid environment variables');
  },
});
