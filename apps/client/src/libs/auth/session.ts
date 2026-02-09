import { cookies } from 'next/headers';
import { cache } from 'react';
import { authServer } from './server';

/**
 * Cached session fetcher — deduplicates within a single RSC render pass.
 * Multiple Server Components calling this in the same request
 * will only trigger ONE API call to the backend.
 *
 * @returns Session data or null if unauthenticated/expired
 */
export const getSession = cache(async () => {
  const cookieHeader = (await cookies()).toString();

  const { data } = await authServer.getSession({
    fetchOptions: {
      headers: { cookie: cookieHeader },
    },
  });

  return data;
});
