import { env } from '@src/env';
import { createAuthClient } from 'better-auth/client';
import {
  anonymousClient,
  multiSessionClient,
  usernameClient,
} from 'better-auth/client/plugins';

/**
 * Server-side auth client for session validation in Server Components.
 * Uses native fetch (Next.js request deduplication) instead of axios.
 * Singleton instance — no per-request overhead.
 */
export const authServer = createAuthClient({
  baseURL: `${env.NEXT_PUBLIC_API_INTERNAL_URL}/auth`,
  fetchOptions: {
    headers: {
      'x-client-app': 'client',
    },
  },
  plugins: [usernameClient(), anonymousClient(), multiSessionClient()],
});
