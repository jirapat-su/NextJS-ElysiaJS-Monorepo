---
inclusion: fileMatch
fileMatchPattern: "apps/api/**"
---

# Backend - Elysia & Effect-TS

## Architecture: Hexagonal (Ports & Adapters)

Handler → Service → Repository (dependencies point inward)

## File Structure

### Module Naming
- Descriptive with feature context: `listUsers`, `createUser` (not `list`, `create`)
- Export: `export const listUsersHandler = new Elysia({ name: 'listUsers.handler' })`
- Utils: `[moduleName].utils.ts` for constants/helpers

### Feature Router

```typescript
export const userRouter = new Elysia({
  prefix: '/users',
  name: 'user.router',
})
  .use(listUsersHandler)
  .use(createUserHandler);
```

Register in `src/features/router.ts`:
```typescript
export const appRouter = new Elysia({ name: 'app-router' })
  .use(userRouter)
  .use(productRouter);
```

## Repository (Persistence Adapter)
- Define errors with `Data.TaggedError` + `createErrorFactory`
- Wrap Prisma calls in `Effect.tryPromise` and map errors in `catch`
- Use `Effect.all` for independent queries
- Use Prisma types for where clauses

**Parallel Execution with Effect.all:**
```typescript
const [total, users] = yield* Effect.all(
  [
    Effect.tryPromise({
      try: () => prisma.user.count({ where }),
      catch: e => UserRepositoryError.new('Failed to count')(e),
    }),
    Effect.tryPromise({
      try: () => prisma.user.findMany({ where }),
      catch: e => UserRepositoryError.new('Failed to fetch')(e),
    }),
  ],
  { concurrency: 'unbounded' }
);
```

Example:

```typescript
export class OnboardingRepositoryError extends Data.TaggedError(
  'Repository/Onboarding/Error'
)<ErrorMsg> {
  static new = createErrorFactory(this);
}

export const onboardingRepository = (props: Props) =>
  Effect.gen(function* () {
    const box = yield* Effect.tryPromise({
      try: () => prisma.geneticBoxes.findFirst({ where: { ... } }),
      catch: e => OnboardingRepositoryError.new('Failed to find box')(e),
    });

    if (!box) return yield* Effect.fail(
      OnboardingRepositoryError.new('Box not found')()
    );

    const user = yield* Effect.tryPromise({
      try: () => prisma.userInformation.update({ where: { id: props.userId }, data: { ... } }),
      catch: e => OnboardingRepositoryError.new('Failed to update user')(e),
    });

    return user;
  });
```

### Caching

```typescript
return yield* userCache.getOrSet(
  JSON.stringify(['list', props.page, props.limit]),
  Effect.tryPromise({
    try: () => prisma.user.findMany({ where, skip, take }),
    catch: e => UserRepositoryError.new('Failed to list')(e),
  }),
  CACHE_TTL.MEDIUM
);
```

Write (invalidation):

```typescript
const user = yield* Effect.tryPromise({
  try: () => prisma.user.update({ where: { id }, data }),
  catch: e => UserRepositoryError.new('Failed to update')(e),
});

yield* userCache.delete(JSON.stringify(['profile', userId]));
yield* userCache.clear();
```

## Service (Application Use Case)
- Use `Effect.gen` for orchestration
- Map DB entities to response objects
- Cache only aggregated data

```typescript
export const onboardingService = (props: Props) =>
  Effect.gen(function* () {
    const user = yield* onboardingRepository(props);

    return {
      id: user.id,
      display_name: user.display_name,
      created_at: user.created_at.toISOString(),
    };
  });
```

## Handler (HTTP Adapter)
- Apply `Effect.retry` + `Effect.timeout`
- Execute with `RUNTIME('[featureName]')().runPromise`
- `RUNTIME` uses feature name only

> **Note:** `Effect.match` with `{ onFailure, onSuccess }` is a **valid and intentional pattern** in this project for mapping Effect results to HTTP responses. `RUNTIME` is a project-specific singleton wrapper around `ManagedRuntime.make` from Effect — do not replace it with generic Effect runtime patterns.

```typescript
export const onboardingHandler = new Elysia({ name: 'onboarding.handler' })
  .use(authorizationPlugin)
  .post('/onboarding', async ({ body, status, request, tokenPayload }) => {
    const serviceResult = Effect.gen(function* () {
      return yield* onboardingService({
        userId: tokenPayload?.userId ?? '',
        data: body,
      });
    }).pipe(
      Effect.retry(API_RETRY_POLICY),
      Effect.timeout(API_TIMEOUT_POLICY),
      Effect.tapError(error => {
        logger.error({ error, endpoint: request.url }, 'Onboarding error');
        return Effect.fail(error);
      })
    );

    return await Effect.match(serviceResult, {
      onFailure: error => {
        switch (error._tag) {
          case 'Repository/Onboarding/Error':
            return status(500, { message: error.msg ?? 'Database Error' });
          default:
            return status(500, { message: 'Internal Server Error' });
        }
      },
      onSuccess: data => status(200, data),
    }).pipe(RUNTIME('onboarding')().runPromise);
  }, {
    body: ONBOARDING_BODY_SCHEMA,
    response: {
      200: ONBOARDING_RESPONSE_SCHEMA,
      500: ERROR_MESSAGE_SCHEMA,
    },
  });
```

## OpenAPI Schema Rules

Never use `.transform()` in Zod schemas - breaks JSON Schema generation.

```typescript
// ✅ Pure schema, transform in handler
const QUERY_SCHEMA = z.object({
  isDeleted: z.enum(['true', 'false']).optional(),
});

const parsedQuery = {
  ...query,
  isDeleted: query.isDeleted === 'true' ? true : undefined,
};
```

## Pagination Utils

```typescript
const skip = calculateSkip(page, limit);
const pagination = calculatePagination({ page, limit, total });
// Returns: { page, limit, total, totalPages, hasNext, hasPrev }
```
