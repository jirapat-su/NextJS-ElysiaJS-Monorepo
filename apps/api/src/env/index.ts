import { createEnv } from '@t3-oss/env-core';
import { vercel } from '@t3-oss/env-core/presets-zod';
import { serverRuntimeEnv, serverSchema } from './server';

export const env = createEnv({
  extends: [vercel()],

  server: serverSchema,

  runtimeEnv: {
    ...serverRuntimeEnv,
  },

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
