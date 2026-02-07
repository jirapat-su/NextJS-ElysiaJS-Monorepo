import KeyvRedis from '@keyv/redis';
import { Effect, Option } from 'effect';
import Keyv from 'keyv';
import { env } from '../../env';
import { logger as baseLogger } from '../logger';

/**
 * Cache-specific logger with [CACHE] prefix for easy identification
 */
const logger = baseLogger.child({ module: 'cache' });

/**
 * Redis store singleton
 */
let redisStore: KeyvRedis<Record<string, unknown>> | null = null;

/**
 * Initialize Redis store
 */
function getRedisStore(): KeyvRedis<Record<string, unknown>> {
  if (!redisStore) {
    redisStore = new KeyvRedis(env.REDIS_URL);
  }
  return redisStore;
}

/**
 * Registry of all cache instances by namespace
 */
const cacheRegistry = new Map<string, Keyv>();

/**
 * Cache instance type returned by createCache
 * All operations are infallible (never error) - failures are logged and return fallback values
 */
export type CacheInstance = {
  readonly namespace: string;
  get: <T>(key: string) => Effect.Effect<Option.Option<T>, never, never>;
  getOrSet: <T, E, R>(
    key: string,
    compute: Effect.Effect<T, E, R>,
    ttl?: number
  ) => Effect.Effect<T, E, R>;
  set: <T>(
    key: string,
    value: T,
    ttl?: number
  ) => Effect.Effect<boolean, never, never>;
  delete: (keys: string | string[]) => Effect.Effect<boolean, never, never>;
  clear: () => Effect.Effect<boolean, never, never>;
};

/**
 * Creates a namespaced cache instance with Redis
 * Each feature should have its own namespace for isolation
 *
 * @param namespace - Unique namespace for this cache (e.g., 'user', 'assignment')
 * @returns CacheInstance with all cache operations scoped to the namespace
 *
 * @example
 * ```typescript
 * // In user feature
 * const userCache = createCache('user');
 * yield* userCache.set('profile:123', userData, 60000);
 *
 * // In assignment feature - can clear user cache when needed
 * const userCache = createCache('user');
 * yield* userCache.clear();
 * ```
 */
export function createCache(namespace: string): CacheInstance {
  const fullNamespace = `sql-checking:${namespace}`;

  // Check if already exists in registry
  let keyv = cacheRegistry.get(namespace);

  if (!keyv) {
    keyv = new Keyv({
      store: getRedisStore(),
      namespace: fullNamespace,
    });

    keyv.on('error', err => {
      logger.error({ err, namespace }, '[CACHE] Redis error');
    });

    cacheRegistry.set(namespace, keyv);
  }

  const cache = keyv;

  return {
    namespace,

    get: <T>(key: string): Effect.Effect<Option.Option<T>, never, never> =>
      Effect.tryPromise({
        try: () => cache.get<T>(key),
        catch: error => {
          logger.warn({ error, namespace, key }, '[CACHE] GET failed');
          return error;
        },
      }).pipe(
        Effect.map(result =>
          result !== undefined ? Option.some(result) : Option.none()
        ),
        Effect.orElseSucceed(() => Option.none())
      ),

    getOrSet: <T, E, R>(
      key: string,
      compute: Effect.Effect<T, E, R>,
      ttl?: number
    ): Effect.Effect<T, E, R> =>
      Effect.gen(function* () {
        const cached = yield* Effect.tryPromise({
          try: () => cache.get<T>(key),
          catch: error => {
            logger.warn({ error, namespace, key }, '[CACHE] GET failed');
            return error;
          },
        }).pipe(Effect.orElseSucceed(() => undefined));

        if (cached !== undefined) {
          return cached;
        }

        const value = yield* compute;

        yield* Effect.tryPromise({
          try: async () => {
            await cache.set(key, value, ttl);
            return true;
          },
          catch: error => {
            logger.warn({ error, namespace, key }, '[CACHE] SET failed');
            return error;
          },
        }).pipe(Effect.orElseSucceed(() => false));

        return value;
      }),

    set: <T>(
      key: string,
      value: T,
      ttl?: number
    ): Effect.Effect<boolean, never, never> =>
      Effect.tryPromise({
        try: async () => {
          await cache.set(key, value, ttl);
          return true;
        },
        catch: error => {
          logger.warn({ error, namespace, key }, '[CACHE] SET failed');
          return error;
        },
      }).pipe(Effect.orElseSucceed(() => false)),

    delete: (keys: string | string[]): Effect.Effect<boolean, never, never> =>
      Effect.tryPromise({
        try: async () => cache.delete(keys),
        catch: error => {
          logger.warn({ error, namespace, keys }, '[CACHE] DELETE failed');
          return error;
        },
      }).pipe(Effect.orElseSucceed(() => false)),

    clear: (): Effect.Effect<boolean, never, never> =>
      Effect.tryPromise({
        try: async () => {
          await cache.clear();
          return true;
        },
        catch: error => {
          logger.warn({ error, namespace }, '[CACHE] CLEAR failed');
          return error;
        },
      }).pipe(Effect.orElseSucceed(() => false)),
  };
}
