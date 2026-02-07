import { createEnv } from '@t3-oss/env-nextjs';
import { vercel } from '@t3-oss/env-nextjs/presets-zod';
import z from 'zod';

export const env = createEnv({
  extends: [vercel()],

  server: {
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

  client: {
    NEXT_PUBLIC_API_INTERNAL_URL: z.url(),
  },

  experimental__runtimeEnv: {
    NEXT_PUBLIC_API_INTERNAL_URL: process.env.NEXT_PUBLIC_API_INTERNAL_URL,
  },

  emptyStringAsUndefined: true,

  onValidationError: issues => {
    console.error('❌ Environment validation failed:');
    for (const issue of issues) {
      const path = issue.path?.join('.') ?? 'unknown';
      console.error(`  - ${path}: ${issue.message}`);
    }
    throw new Error('Invalid environment variables');
  },
});
