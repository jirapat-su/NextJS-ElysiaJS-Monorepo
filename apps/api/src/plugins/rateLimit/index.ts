import { Effect } from 'effect';
import type { Elysia } from 'elysia';
import { createCache } from '../../libs/cache';
import { RUNTIME } from '../../libs/effect';
import { logger } from '../../libs/logger';
import { clientIpPlugin } from '../clientIp';

const rateLimitCache = createCache('rate-limit');

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitContext = {
  ip: string;
  path: string;
  method: string;
};

export type RateLimitOptions = {
  max?: number;
  window?: number;
  message?: string;
  skip?: (ctx: RateLimitContext) => boolean | Promise<boolean>;
};

const DEFAULT_OPTIONS = {
  max: 10,
  window: 60000,
  message: 'Too many requests, please try again later',
};

const getRateLimitEntry = (key: string) => {
  return Effect.gen(function* () {
    const cached = yield* rateLimitCache.get<RateLimitEntry>(key);
    return cached._tag === 'Some' ? cached.value : null;
  });
};

const incrementRateLimit = (key: string, windowMs: number) => {
  return Effect.gen(function* () {
    const now = Date.now();
    const existing = yield* getRateLimitEntry(key);

    if (existing && existing.resetAt > now) {
      const updated: RateLimitEntry = {
        count: existing.count + 1,
        resetAt: existing.resetAt,
      };
      yield* rateLimitCache.set(key, updated, existing.resetAt - now);
      return updated;
    }

    const entry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    };
    yield* rateLimitCache.set(key, entry, windowMs);
    return entry;
  });
};

export const rateLimitPlugin =
  (options: RateLimitOptions = {}) =>
  (app: Elysia) => {
    const config = { ...DEFAULT_OPTIONS, ...options };

    return app
      .use(clientIpPlugin)
      .onBeforeHandle(async ({ clientIpAddress, set, status, request }) => {
        const key = clientIpAddress || 'unknown';
        const url = new URL(request.url);

        if (config.skip) {
          const shouldSkip = await config.skip({
            ip: key,
            path: url.pathname,
            method: request.method,
          });

          if (shouldSkip) {
            return;
          }
        }

        const result = await Effect.gen(function* () {
          return yield* incrementRateLimit(key, config.window);
        }).pipe(RUNTIME('rate-limit')().runPromise);

        const remaining = Math.max(0, config.max - result.count);
        const resetDate = new Date(result.resetAt);

        set.headers['X-RateLimit-Limit'] = config.max.toString();
        set.headers['X-RateLimit-Remaining'] = remaining.toString();
        set.headers['X-RateLimit-Reset'] = resetDate.toISOString();

        if (result.count > config.max) {
          const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
          set.headers['Retry-After'] = retryAfter.toString();
          set.status = 429;

          logger.warn(
            { ip: key, count: result.count, max: config.max },
            '[RATE-LIMIT] Exceeded'
          );

          return status(429, { message: config.message });
        }
      });
  };
