import { Effect } from 'effect';
import { createCache } from '../../libs/cache';
import type { RateLimitEntry } from './types';

const rateLimitCache = createCache('rate-limit');

export const DEFAULT_OPTIONS = {
  max: 10,
  window: 60000,
  message: 'Too many requests, please try again later',
};

export const getRateLimitEntry = (key: string) => {
  return Effect.gen(function* () {
    const cached = yield* rateLimitCache.get<RateLimitEntry>(key);
    return cached._tag === 'Some' ? cached.value : null;
  });
};

export const incrementRateLimit = (key: string, windowMs: number) => {
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
