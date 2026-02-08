---
applyTo: 'apps/api/**'
---

# Database & Prisma Patterns

Prisma schema conventions and database access patterns for apps/api.

## 📂 Multi-File Prisma Schema

**See [quality.instructions.md](./quality.instructions.md) for directory structure (Section 7).**

### Prisma Commands

```bash
cd apps/api
bun run db:generate        # Generate Prisma Client (runs on postinstall)
bun run db:migrate         # Create migration (dev only)
bun run db:migrate:deploy  # Apply migrations (production)
bun run db:seed            # Seed database
bun run db:reset           # Reset and reseed (⚠️ dev only)
bun run db:validate        # Validate schema
```

---

## 🔗 Referential Action Rules (CRITICAL)

These rules MUST be followed for all foreign key relationships.

| Action | Rule | Reason |
|--------|------|--------|
| `onUpdate` | **ALWAYS** use `Cascade` | Automatically update child records when parent ID changes |
| `onDelete` | **ALWAYS** use `SetNull` | Prevent data loss; preserve audit trail |

```prisma
// ✅ Correct
createdBy String?
createByUser User? @relation(
  name: "CreatedPost",
  fields: [createdBy],
  references: [id],
  onUpdate: Cascade,
  onDelete: SetNull
)

// ❌ Wrong - Cascade delete causes data loss
createdBy String?
createByUser User? @relation(
  fields: [createdBy],
  references: [id],
  onDelete: Cascade
)
```

---

## 📋 Model Templates

### Main Model Template

All main models MUST include activity tracking fields.

```prisma
model {ModelName} {
  id        String  @id @default(cuid())
  name      String
  active    Boolean @default(true)

  // Activity Tracking (Required)
  createdAt DateTime? @default(now())
  createdBy String?
  createByUser User? @relation(name: "Created{ModelName}", fields: [createdBy], references: [id], onUpdate: Cascade, onDelete: SetNull)

  updatedAt DateTime? @updatedAt
  updatedBy String?
  updateByUser User? @relation(name: "Updated{ModelName}", fields: [updatedBy], references: [id], onUpdate: Cascade, onDelete: SetNull)

  isDeleted Boolean @default(false)
  deletedAt DateTime?
  deletedBy String?
  deleteByUser User? @relation(name: "Deleted{ModelName}", fields: [deletedBy], references: [id], onUpdate: Cascade, onDelete: SetNull)

  // Relations
  {ModelName}AuditLog {ModelName}AuditLog[] @relation(name: "{ModelName}AuditLog")

  @@index([active])
  @@index([isDeleted])
}
```

### Audit Log Template

For tracking changes to a model.

```prisma
model {ModelName}AuditLog {
  id              String       @id @default(cuid())
  refId           String?
  {modelName}     {ModelName}? @relation(name: "{ModelName}AuditLog", fields: [refId], references: [id], onUpdate: Cascade, onDelete: SetNull)
  action          AUDIT_ACTION
  performedAt     DateTime?    @default(now())
  performedBy     String?
  performedByUser User?        @relation(name: "{ModelName}AuditLog_PBU", fields: [performedBy], references: [id], onUpdate: Cascade, onDelete: SetNull)
}
```

### Content/Localization Template

For multi-language content.

```prisma
model {ModelName}Content {
  id           String       @id @default(cuid())
  {modelName}Id String?
  {modelName}  {ModelName}? @relation(name: "{ModelName}Content", fields: [{modelName}Id], references: [id], onUpdate: Cascade, onDelete: SetNull)
  language     APP_LANGUAGE
  title        String
  content      String

  @@unique([{modelName}Id, language])
}
```

---

## 🗑️ Soft Delete Pattern

### Rules

- **MANDATORY**: All queries must filter by `{ isDeleted: false }`
- Use `update` to set `isDeleted: true`, `deletedAt: now()`, and `deletedBy`
- **NEVER** use hard deletes in production code

### Implementation

```typescript
// ✅ Correct - Soft delete
yield* Effect.tryPromise({
  try: () =>
    prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: currentUserId,
      },
    }),
  catch: e => UserRepositoryError.new('Failed to delete user')(e),
});

// ❌ Wrong - Hard delete
yield* Effect.tryPromise({
  try: () => prisma.user.delete({ where: { id: userId } }),
  catch: e => UserRepositoryError.new('Failed to delete user')(e),
});
```

### Query Pattern

```typescript
// ✅ Always filter soft-deleted records
const where: Prisma.UserWhereInput = {
  id: userId,
  isDeleted: false,  // MANDATORY
};

const user = yield* Effect.tryPromise({
  try: () => prisma.user.findFirst({ where }),
  catch: e => UserRepositoryError.new('Failed to find user')(e),
});
```

---

## 🔍 Query Patterns

### Using Prisma Types (Required)

Always use Prisma-generated types for type safety.

```typescript
import { Prisma } from '@prisma/client';

// ✅ Good - Using Prisma types for type safety
const where: Prisma.UserWhereInput = {
  email: userEmail,
  isDeleted: false,
  roles: {
    some: {
      role: 'STUDENT',
    },
  },
  OR: [
    {
      email: {
        contains: searchTerm,
      },
    },
    {
      displayName: {
        contains: searchTerm,
      },
    },
  ],
};

// ❌ Bad - No type annotation, prone to errors
const where = {
  email: userEmail,
  isDeleted: false,
};
```

### Case-Insensitive Search

- **MySQL**: Collation handles case-insensitivity. Do NOT use `mode`.
- **PostgreSQL**: Use `mode: 'insensitive'` for case-insensitive search.

```typescript
// MySQL - collation handles case-insensitivity
const where: Prisma.UserWhereInput = {
  email: {
    contains: searchTerm,  // No 'mode' needed for MySQL
  },
};

// PostgreSQL only
const where: Prisma.UserWhereInput = {
  email: {
    contains: searchTerm,
    mode: 'insensitive',  // PostgreSQL only
  },
};
```

### Parallel Execution with Effect.all

Run independent queries in parallel.

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

---

## 💾 Caching with Redis

### Cache Namespace Convention

Cache namespace MUST match feature name exactly.

```typescript
import { createCache } from '../../../libs/cache';

// ✅ Correct - Namespace matches feature
const userCache = createCache('user');           // for user feature
const onboardingCache = createCache('onboarding'); // for onboarding feature

// ❌ Wrong - Generic or mismatched namespace
const cache = createCache('data');
const myCache = createCache('myFeature');
```

### Cache Key Pattern

Use `JSON.stringify` for cache keys with multiple parts.

```typescript
// Single key
const key = userId;

// Multiple parts - use JSON.stringify
const key = JSON.stringify(['box', sampleNumber, boxCode]);
const key = JSON.stringify(['user', userId, 'profile']);
```

### Read Operations (90% of cache usage)

Cache database reads in the Repository layer.

```typescript
const onboardingCache = createCache('onboarding');

// Cache read queries
const geneticBox = yield* onboardingCache.getOrSet(
  JSON.stringify(['box', data.sample_number, data.box_code]),
  Effect.tryPromise({
    try: () =>
      prisma.geneticBoxes.findFirst({
        where: {
          sample_number: data.sample_number,
          box_code: data.box_code,
        },
      }),
    catch: e => OnboardingRepositoryError.new('Failed to find genetic box')(e),
  }),
  60000 // TTL: 60 seconds
);
```

### Cache Invalidation

Always invalidate cache after write operations.

```typescript
// After create/update/delete
yield* onboardingCache.delete(
  JSON.stringify(['box', data.sample_number, data.box_code])
);

// Cross-feature cache invalidation - clear entire namespace for simplicity
const userCache = createCache('user');
yield* userCache.clear();
```

---

## 📌 Database Checklist

Before submitting database-related code.

- [ ] Using Prisma types for where clauses (e.g., `Prisma.UserWhereInput`)
- [ ] Referential actions: `onUpdate: Cascade`, `onDelete: SetNull`
- [ ] Soft deletion used instead of hard deletes
- [ ] All queries filter by `{ isDeleted: false }` when needed
- [ ] Independent queries use `Effect.all` for parallel execution
- [ ] Database calls use `Effect.tryPromise` with error mapping
- [ ] Cache namespace matches feature name exactly
- [ ] Cache invalidation after write operations (create/update/delete)
- [ ] Cache used in Repository layer for DB queries
