import { createEnv } from '@t3-oss/env-nextjs';
import { vercel } from '@t3-oss/env-nextjs/presets-zod';
import { clientRuntimeEnv, clientSchema } from './client';
import { serverRuntimeEnv, serverSchema } from './server';

export const env = createEnv({
  server: serverSchema,
  client: clientSchema,
  extends: [vercel()],
  experimental__runtimeEnv: {
    ...clientRuntimeEnv,
    ...serverRuntimeEnv,
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
