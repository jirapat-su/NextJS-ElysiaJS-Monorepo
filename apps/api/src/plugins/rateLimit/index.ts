import { Effect } from 'effect';
import { Elysia } from 'elysia';
import { RUNTIME } from '../../libs/effect';
import { logger } from '../../libs/logger';
import { clientIpPlugin } from '../clientIp';
import type { RateLimitOptions } from './types';
import { DEFAULT_OPTIONS, incrementRateLimit } from './utils';

export const rateLimitPlugin = (options: RateLimitOptions = {}) =>
  new Elysia({ name: 'rate-limit-plugin' })
    .use(clientIpPlugin)
    .onBeforeHandle(async ({ clientIpAddress, set, status, request }) => {
      const config = { ...DEFAULT_OPTIONS, ...options };
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
    })
    .as('global');
