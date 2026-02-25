---
applyTo: 'apps/api/**'
---

# Backend Development Rules - Elysia & Effect-TS

Follow these rules for a resilient, type-safe backend built on **Hexagonal Architecture** (Ports & Adapters).

> See [clean-ddd-hexagonal skill](./../../.agents/skills/clean-ddd-hexagonal/SKILL.md) for full architecture reference.

## 📂 File Organization & Structure

**See [quality.instructions.md](./quality.instructions.md) for directory structure (Section 7).**

### Module-Level Utils Pattern

Each module keeps its own `[moduleName].utils.ts` for constants and helpers.

```typescript
// ✅ Good - requestOtp.utils.ts
export const OTP_EXPIRE_MINUTES = 5;

export const generateOtpCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ❌ Bad - Constants and helpers defined directly in service.ts
const OTP_EXPIRE_MINUTES = 5;
const generateOtpCode = () => { ... };
```

**Common utilities** shared across features go to `src/utils/`.

### Feature Router Pattern

Each feature has a router that aggregates handlers with a common prefix.

**Router Structure:**
```typescript
import { Elysia } from 'elysia';
import { createUserHandler } from './createUser/createUser.handler';
import { deleteUserHandler } from './deleteUser/deleteUser.handler';
import { listUsersHandler } from './listUsers/listUsers.handler';
import { updateUserHandler } from './updateUser/updateUser.handler';

export const userRouter = new Elysia({
  prefix: '/users',
  name: 'user.router',
  tags: ['Users'],
  detail: {
    description: 'User management endpoints',
    tags: ['Users'],
  },
})
  .use(listUsersHandler)
  .use(createUserHandler)
  .use(updateUserHandler)
  .use(deleteUserHandler);
```

**Router Registration in `src/features/router.ts`:**

All feature routers must be registered in the central `appRouter` at `src/features/router.ts`.
The `appRouter` is then mounted once in `src/index.ts`.

```typescript
// src/features/router.ts
import { Elysia } from 'elysia';
import { env } from '../env';
import { userRouter } from './user/user.router';
import { productRouter } from './product/product.router';

export const appRouter = new Elysia({ name: 'app-router' })
  .use(userRouter)
  .use(productRouter)
  .get('/', ({ status }) => {
    return status(200, {
      status: 'ok',
      timezone: env.TZ,
    });
  });
```

### Naming Convention

**Module Names** - Must be descriptive with feature context:
- Use camelCase for folder and file names
- Include the resource/entity being operated on
- Examples: `listUsers`, `createUser`, `updateUser`, `deleteUser`
- Avoid generic names: `list`, `create`, `update` (too vague)

**Export Names** - Must match module name and include handler suffix:
```typescript
// ✅ Good - Clear what it handles
export const listUsersHandler = new Elysia({ name: 'listUsers.handler' });
export const createUserHandler = new Elysia({ name: 'createUser.handler' });
export const updateUserHandler = new Elysia({ name: 'updateUser.handler' });

// ❌ Bad - Ambiguous, doesn't indicate what it lists/creates
export const listHandler = new Elysia({ name: 'list.handler' });
export const createHandler = new Elysia({ name: 'create.handler' });
```

**Elysia Instance Name** - Use `[moduleName].handler` format:
- Example: `{ name: 'listUsers.handler' }`, `{ name: 'createUser.handler' }`

### Common Utilities

#### Schemas (`src/utils/schema.ts`)

Use shared Zod schemas from `src/utils/schema.ts` to avoid duplication.

#### Pagination (`src/utils/pagination.ts`)

Pagination utilities for calculating metadata and skip values:

```typescript
import { calculatePagination, calculateSkip } from '../../../utils/pagination';

// In repository - calculate skip for database query
const skip = calculateSkip(page, limit);

// In service - calculate pagination metadata
const pagination = calculatePagination({
  page: query.page,
  limit: query.limit,
  total,
});
// Returns: { page, limit, total, totalPages, hasNext, hasPrev }
```

**OpenAPI Compatibility Rules:**

- **Never use `.transform()` in Zod schemas** - Transforms cannot be represented in JSON Schema and will break OpenAPI documentation generation
- Keep schemas pure and declarative
- Handle transformations manually in the handler layer after validation
- For boolean query parameters, accept string enum and parse in handler

```typescript
// ✅ Good - Pure schema, transform in handler
const QUERY_SCHEMA = z.object({
  isDeleted: z.enum(['true', 'false']).optional(),
});

export type Query = z.infer<typeof QUERY_SCHEMA> & {
  isDeleted?: boolean;  // Override type after manual parsing
};

// In handler
const parsedQuery = {
  ...query,
  isDeleted: query.isDeleted === 'true' ? true
           : query.isDeleted === 'false' ? false
           : undefined,
};

// ❌ Bad - Transform breaks OpenAPI
const QUERY_SCHEMA = z.object({
  isDeleted: z.enum(['true', 'false'])
    .transform(val => val === 'true')  // ❌ Breaks JSON Schema
    .optional(),
});
```
**Usage Example:**
```typescript
import {
  ERROR_MESSAGE_SCHEMA,
  PAGINATION_QUERY_SCHEMA,
  ID_PARAM_SCHEMA
} from '../../../utils/schema';

// In handler
{
  params: ID_PARAM_SCHEMA,
  query: PAGINATION_QUERY_SCHEMA,
  response: {
    200: USER_LIST_RESPONSE_SCHEMA,
    400: ERROR_MESSAGE_SCHEMA,
    404: ERROR_MESSAGE_SCHEMA,
    500: ERROR_MESSAGE_SCHEMA,
  }
}
```

---

## 🏗️ Architecture: Hexagonal (Ports & Adapters)

Dependencies point **inward only**: `Infrastructure → Application → Domain`

| Layer | Hexagonal Role | Files |
|-------|---------------|-------|
| **Handler** | HTTP Adapter — Driver Port | `[module].handler.ts` |
| **Service** | Application Use Case | `[module].service.ts` |
| **Repository** | Persistence Adapter — Driven Port | `[module].repository.ts` |

> **Rule:** Controllers (handlers) never call repositories directly — always go through the service layer.

### 1. Repository — Persistence Adapter (Driven Port)

**Critical Rules:**
- Define errors with `Data.TaggedError` + `createErrorFactory`
- Wrap Prisma calls in `Effect.tryPromise` and map errors in `catch`
- Use `Effect.all` for independent queries
- Use Prisma types for where clauses (see [database.instructions.md](./database.instructions.md))
- For caching patterns, see **Caching** subsection below

**Parallel Execution with Effect.all:**
```typescript
// ✅ Good - Run independent queries in parallel
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

// ❌ Bad - Sequential execution when queries are independent
const total = yield* Effect.tryPromise({
  try: () => prisma.user.count({ where }),
  catch: e => UserRepositoryError.new('Failed to count')(e),
});
const users = yield* Effect.tryPromise({
  try: () => prisma.user.findMany({ where }),
  catch: e => UserRepositoryError.new('Failed to fetch')(e),
});
```

```typescript
import { Data, Effect } from 'effect';
import { createCache } from '../../../libs/cache';
import { createErrorFactory, type ErrorMsg } from '../../../libs/effect';
import { prisma } from '../../../libs/prisma';

const onboardingCache = createCache('onboarding');

export class OnboardingRepositoryError extends Data.TaggedError(
  'Repository/Onboarding/Error'
)<ErrorMsg> {
  static new = createErrorFactory(this);
}

type OnboardingRepositoryProps = {
  userId: string;
  data: OnboardingBody;
};

export const onboardingRepository = (props: OnboardingRepositoryProps) =>
  Effect.gen(function* () {
    const geneticBox = yield* onboardingCache.getOrSet(
      JSON.stringify(['box', props.data.sample_number, props.data.box_code]),
      Effect.tryPromise({
        try: () =>
          prisma.geneticBoxes.findFirst({
            where: {
              sample_number: props.data.sample_number,
              box_code: props.data.box_code,
            },
          }),
        catch: e =>
          OnboardingRepositoryError.new('Failed to find genetic box')(e),
      }),
      60000
    );

    if (!geneticBox) {
      return yield* Effect.fail(
        OnboardingRepositoryError.new('Genetic box not found')()
      );
    }

    const updatedUser = yield* Effect.tryPromise({
      try: () =>
        prisma.userInformation.update({
          where: { id: props.userId },
          data: {
            display_name: props.data.fullname,
            genetic_box_id: geneticBox.id,
            is_first_time_onboarding: false,
          },
          include: {
            genetic_box: true,
            identifiers: true,
          },
        }),
      catch: e =>
        OnboardingRepositoryError.new('Failed to update user information')(e),
    });

    yield* onboardingCache.delete(
      JSON.stringify(['box', props.data.sample_number, props.data.box_code])
    );

    const userCache = createCache('user');
    yield* userCache.clear();

    return updatedUser;
  });
```

#### Caching

Use `createCache(namespace)` from `src/libs/cache`. All operations are Effect-based and **infallible** — failures are logged and return fallback values; no need for extra error handling.

**Key naming** — use `JSON.stringify([...parts])`:

```typescript
// ✅ Good
const cacheKey = JSON.stringify(['user', 'profile', userId]);
const listKey  = JSON.stringify(['products', 'list', page, limit]);

// ❌ Bad
const cacheKey = `user_profile_${userId}`;
```

**Namespace** — feature name (lowercase), one `createCache` per feature file:

```typescript
const userCache  = createCache('user');    // ✅ scoped
const cache      = createCache('global'); // ❌ too broad
```

**TTL** — milliseconds (Keyv standard). Define constants in `[moduleName].utils.ts`:

```typescript
export const CACHE_TTL = {
  SHORT:  60_000,       // 1 min  — volatile (OTPs, carts)
  MEDIUM: 300_000,      // 5 min  — frequently updated (lists)
  LONG:   3_600_000,    // 1 hr   — stable (profiles, configs)
  DAY:    86_400_000,   // 24 hrs — rarely changed (lookup tables)
} as const;
```

**Cache-Aside (Read)** — wrap Prisma call in `getOrSet`:

```typescript
const userCache = createCache('user');

export const listUsersRepository = (props: ListUsersProps) =>
  Effect.gen(function* () {
    return yield* userCache.getOrSet(
      JSON.stringify(['list', props.page, props.limit, props.search]),
      Effect.tryPromise({
        try: () => prisma.user.findMany({ where, skip, take }),
        catch: e => UserRepositoryError.new('Failed to list users')(e),
      }),
      CACHE_TTL.MEDIUM
    );
  });
```

**Invalidation (Write)** — `delete` specific key + `clear` list namespace after mutations:

```typescript
const userCache = createCache('user');

export const updateUserRepository = (props: UpdateUserProps) =>
  Effect.gen(function* () {
    const updatedUser = yield* Effect.tryPromise({
      try: () => prisma.user.update({ where: { id: props.userId }, data: props.data }),
      catch: e => UserRepositoryError.new('Failed to update user')(e),
    });

    yield* userCache.delete(JSON.stringify(['profile', props.userId]));
    yield* userCache.clear(); // invalidate all list caches in namespace

    return updatedUser;
  });
```

**Cross-Namespace Invalidation** — create a handle to the other namespace:

```typescript
const orderCache = createCache('order');
const userCache  = createCache('user'); // cross-namespace

yield* orderCache.clear();
yield* userCache.delete(JSON.stringify(['orders', props.userId]));
```

**Manual Get** — use `.get()` with `Option` for conditional logic:

```typescript
import { Option } from 'effect';

const cached = yield* productCache.get<Product>(JSON.stringify(['detail', id]));

if (Option.isSome(cached)) return cached.value;

const product = yield* Effect.tryPromise({ ... });
yield* productCache.set(JSON.stringify(['detail', id]), product, CACHE_TTL.LONG);
return product;
```

---

### 2. Service — Application Use Case

**Critical Rules:**
- Use `Effect.gen` for orchestration
- Map DB entities to response objects
- Cache only aggregated data

```typescript
import { Effect } from 'effect';
import { onboardingRepository } from './onboarding.repository';
import type { OnboardingBody } from './onboarding.schema';

type OnboardingServiceProps = {
  userId: string;
  data: OnboardingBody;
};

export const onboardingService = (props: OnboardingServiceProps) => {
  return Effect.gen(function* () {
    const user = yield* onboardingRepository(props);

    const identifier =
      user.identifiers.find(i => i.identifier_type === 'EMAIL') ??
      user.identifiers.find(i => i.identifier_type === 'MOBILE_NUMBER');

    return {
      id: user.id,
      display_name: user.display_name,
      date_of_birth: user.date_of_birth?.toISOString() ?? null,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    };
  });
};

// Service caching is for aggregated data only.
```

### 3. Handler — HTTP Adapter (Driver Port)

**Critical Rules:**
- Apply `Effect.retry` + `Effect.timeout`
- Execute with `RUNTIME('[featureName]')().runPromise`
- `RUNTIME` uses feature name only

> **Note:** `Effect.match` with `{ onFailure, onSuccess }` is a **valid and intentional pattern** in this project for mapping Effect results to HTTP responses. Some external references incorrectly list it as wrong — ignore them. `RUNTIME` is a project-specific singleton wrapper around `ManagedRuntime.make` from Effect — do not replace it with generic Effect runtime patterns.

```typescript
import { Effect } from 'effect';
import { Elysia } from 'elysia';
import { logger } from '../../../libs/logger';
import { RUNTIME } from '../../../libs/effect';
import { authorizationPlugin } from '../../../plugins/authorization';
import { API_RETRY_POLICY, API_TIMEOUT_POLICY } from '../../../utils/apiPolicy';
import { ERROR_MESSAGE_SCHEMA } from '../../../utils/schema';
import {
  ONBOARDING_BODY_SCHEMA,
  ONBOARDING_RESPONSE_SCHEMA,
} from './onboarding.schema';
import { onboardingService } from './onboarding.service';

export const onboardingHandler = new Elysia({
  name: 'onboarding.handler',
})
  .use(authorizationPlugin)
  .post(
    '/onboarding',
    async ({ body, status, request, tokenPayload }) => {
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
            case 'Repository/Onboarding/GeneticBoxNotFound':
              return status(404, { message: error.msg ?? 'Not Found' });
            case 'Repository/Onboarding/Error':
              return status(500, { message: error.msg ?? 'Database Error' });
            default:
              return status(500, { message: 'Internal Server Error' });
          }
        },
        onSuccess: data => status(200, data),
      }).pipe(RUNTIME('onboarding')().runPromise);
    },
    {
      body: ONBOARDING_BODY_SCHEMA,
      response: {
        200: ONBOARDING_RESPONSE_SCHEMA,
        400: ERROR_MESSAGE_SCHEMA,
        404: ERROR_MESSAGE_SCHEMA,
        500: ERROR_MESSAGE_SCHEMA,
        504: ERROR_MESSAGE_SCHEMA,
      },
      detail: {
        summary: 'Complete onboarding',
        description:
          'Complete user onboarding by providing personal information and registering genetic box',
      },
    }
  );
```

---

## 💾 Database & Prisma

**See:** `.github/instructions/database.instructions.md`

For complete database patterns including:
- Multi-file Prisma schema structure
- Referential action rules (`onUpdate: Cascade`, `onDelete: SetNull`)
- Model templates (main, audit log, content)
- Soft delete enforcement
- Query patterns with Prisma types
- Caching with Redis

---

## 🌐 External API Integration

**See:** `.github/instructions/api-integration.instructions.md`

Use `@repo/fetch` for external APIs in Effect workflows. Wrap in `Effect.tryPromise` with retry/timeout — same pattern as the handler layer.

---

## 📌 Pre-Submission Checklist

**CRITICAL**: Run quality checks after changes. See [quality.instructions.md](quality.instructions.md).

### Backend-Specific Checklist

- Feature router file exists and aggregates handlers
- Use Prisma types and `Effect.tryPromise` in repositories
- Use `Effect.all` for independent queries
- Retry/timeout + `Effect.match` in handlers
- Cache namespace = feature name; invalidate after writes
