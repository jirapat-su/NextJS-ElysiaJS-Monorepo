import { $Enums } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import {
  anonymous,
  multiSession,
  openAPI as openAPIPlugin,
  username,
} from 'better-auth/plugins';
import { Effect } from 'effect';
import { env } from '../../env';
import { createCache } from '../cache';
import { RUNTIME } from '../effect';
import { prisma } from '../prisma';
import { enforceTeacherRole } from './guard';

const BETTER_AUTH_CACHE = createCache('better-auth');
const BETTER_AUTH_RUNTIME = RUNTIME('auth')();

const useSecureCookies = env.NODE_ENV === 'production';

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_DOMAIN ?? `http://localhost:${env.PORT}`,
  secret: env.BETTER_AUTH_SECRET,
  basePath: '/',
  advanced: {
    useSecureCookies,
    cookiePrefix: 'app',
    cookies: {
      session_token: {
        attributes: {
          sameSite: 'lax',
          httpOnly: true,
          secure: useSecureCookies,
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    freshAge: 60 * 5, // 5 minutes
    storeSessionInDatabase: false,
    preserveSessionInDatabase: true,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
      strategy: 'jwe',
    },
  },
  trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
  plugins: [
    multiSession(),
    anonymous({
      generateRandomEmail: () => {
        const short = crypto.randomUUID().substring(0, 8);
        return `guest-${short}@anon.local`;
      },
      generateName: () => {
        const adjectives = [
          'Swift',
          'Brave',
          'Calm',
          'Bold',
          'Keen',
          'Wise',
          'Sly',
          'Deft',
        ];
        const animals = [
          'Fox',
          'Owl',
          'Bear',
          'Wolf',
          'Hawk',
          'Lynx',
          'Deer',
          'Crow',
        ];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const animal = animals[Math.floor(Math.random() * animals.length)];
        const num = Math.floor(Math.random() * 100);
        return `${adj}${animal}${num}`;
      },
    }),
    username({
      minUsernameLength: 5,
      maxUsernameLength: 30,
      usernameValidator: username => {
        if (username === 'admin') {
          return false;
        }
        return true;
      },
    }),
    openAPIPlugin(),
  ],
  hooks: {
    before: enforceTeacherRole,
  },
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: Object.keys($Enums.USER_ROLE),
        index: true,
        required: false,
        defaultValue: $Enums.USER_ROLE.STUDENT,
        input: false,
      },
    },
    changeEmail: {
      enabled: false,
    },
    deleteUser: {
      enabled: false,
    },
  },
  database: prismaAdapter(prisma, {
    provider: 'mysql',
  }),
  secondaryStorage: {
    get: async key => {
      const result = await Effect.gen(function* () {
        const cached = yield* BETTER_AUTH_CACHE.get<string>(key);
        return cached._tag === 'Some' ? cached.value : null;
      }).pipe(BETTER_AUTH_RUNTIME.runPromise);
      return result;
    },
    set: async (key, value, ttl) =>
      await Effect.gen(function* () {
        yield* BETTER_AUTH_CACHE.set(key, value, ttl ? ttl * 1000 : undefined);
      }).pipe(BETTER_AUTH_RUNTIME.runPromise),
    delete: async key =>
      await Effect.gen(function* () {
        yield* BETTER_AUTH_CACHE.delete(key);
      }).pipe(BETTER_AUTH_RUNTIME.runPromise),
  },
});
