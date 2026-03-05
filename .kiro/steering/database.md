---
inclusion: fileMatch
fileMatchPattern: "apps/api/**"
---

# Database & Prisma Patterns

Prisma schema conventions and database access patterns for apps/api.

## 📂 Multi-File Prisma Schema

### Prisma Commands

```bash
cd apps/api
bun run db:generate        # Generate Prisma Client (runs on postinstall)
bun run db:migrate         # Create migration --create-only (review before applying!)
bun run db:migrate:deploy  # Apply migrations (production)
bun run db:seed            # Seed database
bun run db:reset           # Reset and reseed (⚠️ dev only)
bun run db:validate        # Validate schema
```

> **`db:migrate` always uses `--create-only`** — this creates the migration file but does NOT apply it. After reviewing the generated SQL, run `bun run db:migrate:deploy` to apply. Never skip this review step.

---

## 🗄️ Database Driver: MariaDB Adapter (CRITICAL)

This project uses **MySQL via `@prisma/adapter-mariadb`**, NOT the default Prisma MySQL driver. Do NOT initialize `PrismaClient` without the adapter.

```typescript
// ✅ Correct — always use the MariaDB adapter (see src/libs/prisma/index.ts)
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaMariaDb({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password',
  database: 'mydb',
});

const prisma = new PrismaClient({ adapter });

// ❌ Wrong — plain PrismaClient without adapter will not connect
const prisma = new PrismaClient();
```

> **Always import `prisma` from `src/libs/prisma`** — never instantiate `PrismaClient` directly in features. The lib handles singleton pattern and adapter wiring.

```typescript
// ✅ Correct
import { prisma } from '../../../libs/prisma';

// ❌ Wrong — creates a new instance without adapter
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

> **Note for Prisma skills:** Skills may show `prisma.user.delete()` as a valid example — in this project **hard deletes are forbidden**. Always use soft delete (`isDeleted: true`). See soft delete section below.

---

## 🔗 Referential Action Rules (CRITICAL)

These rules MUST be followed for all foreign key relationships.

| Action | Rule | Reason |
|--------|------|--------|
| `onUpdate` | **ALWAYS** use `Cascade` | Automatically update child records when parent ID changes |
| `onDelete` | **ALWAYS** use `SetNull` | Prevent data loss; preserve audit trail |

```prisma
createdBy String?
createByUser User? @relation(
  name: "CreatedPost",
  fields: [createdBy],
  references: [id],
  onUpdate: Cascade,
  onDelete: SetNull
)
```

## Model Templates

Main model:

```prisma
model {ModelName} {
  id        String  @id @default(cuid())
  name      String
  active    Boolean @default(true)

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

  {ModelName}AuditLog {ModelName}AuditLog[] @relation(name: "{ModelName}AuditLog")

  @@index([active])
  @@index([isDeleted])
}
```

Audit log:

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

## Soft Delete (MANDATORY)

- **MANDATORY**: All queries must filter by `{ isDeleted: false }`
- Use `update` to set `isDeleted: true`, `deletedAt: now()`, and `deletedBy`
- **NEVER** use hard deletes in production code

### Implementation

```typescript
// ✅ Soft delete
yield* Effect.tryPromise({
  try: () => prisma.user.update({
    where: { id: userId },
    data: { isDeleted: true, deletedAt: new Date(), deletedBy: currentUserId },
  }),
  catch: e => UserRepositoryError.new('Failed to delete')(e),
});
```

Query pattern:

```typescript
const where: Prisma.UserWhereInput = {
  id: userId,
  isDeleted: false,  // MANDATORY
};

const user = yield* Effect.tryPromise({
  try: () => prisma.user.findFirst({ where }),
  catch: e => UserRepositoryError.new('Failed to find')(e),
});
```

## Query Patterns

Use Prisma types:

```typescript
const where: Prisma.UserWhereInput = {
  email: userEmail,
  isDeleted: false,
  roles: { some: { role: 'STUDENT' } },
  OR: [
    { email: { contains: searchTerm } },
    { displayName: { contains: searchTerm } },
  ],
};
```

Case-insensitive search (MySQL uses collation, no `mode` needed):

```typescript
const where: Prisma.UserWhereInput = {
  email: { contains: searchTerm },  // MySQL - no mode
};
```

Parallel execution:

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

## Caching (Redis)

Namespace = feature name:

```typescript
const userCache = createCache('user');
```

Key pattern:

```typescript
const key = userId;  // Single
const key = JSON.stringify(['box', sampleNumber, boxCode]);  // Multiple
```

Read:

```typescript
const box = yield* cache.getOrSet(
  JSON.stringify(['box', data.sample_number, data.box_code]),
  Effect.tryPromise({
    try: () => prisma.geneticBoxes.findFirst({ where: { ... } }),
    catch: e => OnboardingRepositoryError.new('Failed to find box')(e),
  }),
  60000  // TTL: 60s
);
```

Invalidation:

```typescript
yield* cache.delete(JSON.stringify(['box', data.sample_number, data.box_code]));

// Cross-feature
const userCache = createCache('user');
yield* userCache.clear();
```
