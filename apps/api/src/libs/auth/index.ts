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

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_DOMAIN ?? `http://localhost:${env.PORT}`,
  secret: env.BETTER_AUTH_SECRET,
  basePath: '/',
  trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
  plugins: [
    multiSession(),
    anonymous({
      generateRandomEmail: () => {
        const id = crypto.randomUUID();
        return `guest-${id}@example.com`;
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

type OpenAPISchema = Awaited<ReturnType<typeof auth.api.generateOpenAPISchema>>;

let _schema: OpenAPISchema | null = null;

const getSchema = async (): Promise<OpenAPISchema> => {
  if (!_schema) {
    _schema = await auth.api.generateOpenAPISchema();
  }
  return _schema;
};

export const authOpenAPI = {
  getPaths: (prefix = '/auth') =>
    getSchema().then(({ paths }) => {
      const reference: Record<string, unknown> = Object.create(null);

      for (const path of Object.keys(paths)) {
        const key = prefix + path;
        const pathItem = paths[path as keyof typeof paths];
        if (!pathItem) {
          continue;
        }

        reference[key] = pathItem;

        for (const method of Object.keys(pathItem)) {
          const operation = (reference[key] as Record<string, unknown>)[method];
          if (operation && typeof operation === 'object') {
            (operation as Record<string, unknown>).tags = ['Better Auth'];
          }
        }
      }

      // biome-ignore lint/suspicious/noExplicitAny: don't want to type this fully
      return reference as any;
    }),
  components: getSchema().then(({ components }) => {
    // biome-ignore lint/suspicious/noExplicitAny: don't want to type this fully
    return components as any;
  }),
} as const;
