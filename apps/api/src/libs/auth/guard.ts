import { $Enums } from '@prisma/client';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { Effect } from 'effect';
import { SYSTEM_CONFIG } from '../../constants/system';
import { createCache } from '../cache';
import { RUNTIME } from '../effect';
import { prisma } from '../prisma';

const BACK_OFFICE_HEADER = SYSTEM_CONFIG.CLIENT_APP_HEADER;
const BACK_OFFICE_VALUE = 'client';
const BACK_OFFICE_SIGN_IN_PATHS = new Set([
  '/sign-in/email',
  '/sign-in/username',
]);
const AUTH_GUARD_CACHE = createCache('auth-guard');
const AUTH_GUARD_RUNTIME = RUNTIME('auth-guard')();
const AUTH_GUARD_CACHE_TTL_MS = 60000;

const isBackOfficeRequest = (headers?: Headers) =>
  headers?.get(BACK_OFFICE_HEADER) === BACK_OFFICE_VALUE;

const getUserRole = async (path: string, identifier: string) => {
  const cacheKey = JSON.stringify(['back-office-role', path, identifier]);

  return await Effect.gen(function* () {
    return yield* AUTH_GUARD_CACHE.getOrSet(
      cacheKey,
      Effect.tryPromise({
        try: async () => {
          const user = await prisma.user.findFirst({
            where:
              path === '/sign-in/email'
                ? { email: identifier }
                : { username: identifier },
            select: { role: true },
          });

          return user?.role ?? null;
        },
        catch: error => error,
      }),
      AUTH_GUARD_CACHE_TTL_MS
    );
  }).pipe(AUTH_GUARD_RUNTIME.runPromise);
};

export const enforceTeacherRole = createAuthMiddleware(async ctx => {
  if (!BACK_OFFICE_SIGN_IN_PATHS.has(ctx.path)) {
    return;
  }

  if (!isBackOfficeRequest(ctx.headers)) {
    return;
  }

  if (ctx.path === '/sign-in/anonymous') {
    throw new APIError('UNAUTHORIZED', {
      message: 'Only teachers can access the back office.',
    });
  }

  const identifier =
    ctx.path === '/sign-in/email'
      ? (ctx.body?.email as string | undefined)
      : (ctx.body?.username as string | undefined);

  if (!identifier) {
    throw new APIError('UNAUTHORIZED', {
      message: 'Only teachers can access the back office.',
    });
  }

  const role = await getUserRole(ctx.path, identifier);

  if (role !== $Enums.USER_ROLE.TEACHER) {
    throw new APIError('UNAUTHORIZED', {
      message: 'Only teachers can access the back office.',
    });
  }
});
