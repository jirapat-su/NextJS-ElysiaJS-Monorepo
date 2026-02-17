import { env } from '@src/env';
import {
  anonymousClient,
  inferAdditionalFields,
  multiSessionClient,
  usernameClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: `${env.NEXT_PUBLIC_API_INTERNAL_URL}/auth`,
  fetchOptions: {
    credentials: 'include',
    headers: {
      'x-client-app': 'client',
    },
  },
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: 'string',
        },
      },
    }),
    usernameClient(),
    anonymousClient(),
    multiSessionClient(),
  ],
});
