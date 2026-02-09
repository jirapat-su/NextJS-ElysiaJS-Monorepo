import { z } from 'zod';

/**
 * Client-side environment variables schema
 * These are exposed to the browser (must be prefixed with NEXT_PUBLIC_)
 */
export const clientSchema = {
  NEXT_PUBLIC_API_INTERNAL_URL: z.url(),
};

/**
 * Client-side runtime environment mapping
 */
export const clientRuntimeEnv = {
  NEXT_PUBLIC_API_INTERNAL_URL: process.env.NEXT_PUBLIC_API_INTERNAL_URL,
};
