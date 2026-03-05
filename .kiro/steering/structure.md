---
inclusion: always
---

# Project Structure

## Backend (`apps/api/src/`)

```
src/
├── features/
│   ├── router.ts                    # Central router (imports all feature routers)
│   └── [featureName]/               # Feature folder (e.g., user, product, auth)
│       ├── [featureName].router.ts  # Feature router (aggregates handlers)
│       └── [moduleName]/            # Module folder (e.g., listUsers, createUser)
│           ├── [moduleName].handler.ts     # HTTP adapter (Elysia route)
│           ├── [moduleName].service.ts     # Business logic (Effect orchestration)
│           ├── [moduleName].repository.ts  # Data access (Prisma + Effect)
│           ├── [moduleName].schema.ts      # Zod schemas (request/response)
│           └── [moduleName].utils.ts       # Module-specific helpers/constants
├── libs/                            # Shared libraries
│   ├── auth/index.ts
│   ├── cache/index.ts
│   ├── logger/index.ts
│   └── prisma/index.ts
├── plugins/                         # Elysia plugins
│   ├── authentication/index.ts
│   └── rateLimit/index.ts
├── utils/                           # Cross-feature utilities
│   ├── pagination.ts
│   └── schema.ts
└── index.ts                         # App entry point
```

### Rules
- Feature router aggregates all handlers for a feature with common prefix
- Module name must be descriptive: `listUsers`, `createUser` (not `list`, `create`)
- Utils in module folder for module-specific helpers; `src/utils/` for shared utilities
- All feature routers registered in `src/features/router.ts`

### Example: User Feature

```
features/user/
├── user.router.ts                   # Aggregates all user handlers
├── listUsers/
│   ├── listUsers.handler.ts         # GET /users
│   ├── listUsers.service.ts
│   ├── listUsers.repository.ts
│   ├── listUsers.schema.ts
│   └── listUsers.utils.ts           # Pagination helpers, filters
├── createUser/
│   ├── createUser.handler.ts        # POST /users
│   ├── createUser.service.ts
│   ├── createUser.repository.ts
│   └── createUser.schema.ts
└── updateUser/
    ├── updateUser.handler.ts        # PATCH /users/:id
    ├── updateUser.service.ts
    ├── updateUser.repository.ts
    └── updateUser.schema.ts
```

## Frontend (`apps/client/src/`)

```
src/
├── app/                             # Next.js App Router
│   ├── (admin)/                     # Route group (admin layout)
│   │   ├── layout.tsx               # Admin layout wrapper
│   │   ├── (home)/                  # Nested route group
│   │   │   └── page.tsx             # /admin route
│   │   └── users/
│   │       ├── page.tsx             # /admin/users
│   │       ├── _components/         # Page-specific components (not routable)
│   │       │   ├── UserList.tsx
│   │       │   └── UserFilters.tsx
│   │       ├── _hooks/              # Page-specific hooks (not routable)
│   │       │   └── useUserAPI.ts
│   │       └── [id]/
│   │           ├── page.tsx         # /admin/users/[id]
│   │           └── _components/
│   │               └── UserDetail.tsx
│   ├── (public)/                    # Route group (public layout)
│   │   ├── sign-in/
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   │       ├── SignInForm.tsx
│   │   │       └── EmailSignInForm.tsx
│   │   └── terms-of-service/
│   │       ├── page.tsx
│   │       └── _components/
│   │           └── TermsOfService.tsx
│   ├── layout.tsx                   # Root layout
│   └── globals.css                  # Global styles
├── components/                      # Shared components (can use index.tsx)
│   ├── ui/                          # UI primitives (shadcn/ui, custom)
│   │   ├── Button/
│   │   │   └── index.tsx
│   │   ├── Loading/
│   │   │   └── index.tsx
│   │   └── ThemeToggle/
│   │       └── index.tsx
│   ├── layout/                      # Layout components
│   │   ├── Header/
│   │   │   └── index.tsx
│   │   └── Sidebar/
│   │       └── index.tsx
│   ├── providers/                   # Context providers
│   │   └── ThemeProvider/
│   │       └── index.tsx
│   └── features/                    # Shared feature modules (cross-page)
│       └── [featureName]/           # e.g., user, product, cart
│           ├── components/          # Feature-specific components
│           │   ├── UserCard.tsx
│           │   └── UserAvatar.tsx
│           ├── hooks/               # Feature-specific hooks
│           │   └── useUserAPI.ts
│           ├── utils/               # Feature-specific utilities
│           │   └── formatUserName.ts
│           └── types/               # Feature-specific types
│               └── user.types.ts
├── hooks/                           # Global hooks (cross-feature)
│   ├── useDebounce.ts
│   └── useMediaQuery.ts
├── libs/                            # Third-party integrations
│   └── analytics/
│       └── index.ts
├── types/                           # Global types
│   └── common.types.ts
└── utils/                           # Global utilities
    └── cn.ts                        # Tailwind merge utility
```

### Rules
- `_components/` and `_hooks/` folders are page-specific (underscore prefix = not routable)
- `components/features/` for shared feature modules used across multiple pages
- `components/` can use barrel files (`index.tsx`)
- Route groups `(admin)`, `(public)` don't affect URL structure
- Page-specific code stays co-located with `page.tsx`
- Shared code goes to `components/features/`, `components/ui/`, or `components/layout/`

### Decision Tree: Where to Put Code?

**1. Is this code used only in ONE page?**
- ✅ Yes → `app/[route]/_components/` or `app/[route]/_hooks/`
- ❌ No → Go to step 2

**2. Is this code used in 2-3 related pages (same feature)?**
- ✅ Yes → `components/features/[featureName]/`
- ❌ No → Go to step 3

**3. Is this a UI primitive used everywhere?**
- ✅ Yes → `components/ui/`
- ❌ No → Go to step 4

**4. Is this a layout component (Header, Sidebar, Footer)?**
- ✅ Yes → `components/layout/`
- ❌ No → Go to step 5

**5. Is this a global utility or hook?**
- ✅ Yes → `hooks/` or `utils/`

### Examples

**Page-specific (co-located):**
```
app/(admin)/users/
├── page.tsx                    # Uses UserList, UserFilters
├── _components/
│   ├── UserList.tsx           # Only used in /admin/users
│   └── UserFilters.tsx        # Only used in /admin/users
└── _hooks/
    └── useUserFilters.ts      # Only used in /admin/users
```

**Shared feature (reusable):**
```
components/features/user/
├── components/
│   ├── UserCard.tsx           # Used in /users, /profile, /admin/users
│   └── UserAvatar.tsx         # Used in header, sidebar, comments
├── hooks/
│   └── useUserAPI.ts          # Used everywhere that needs user data
└── types/
    └── user.types.ts          # Shared user types
```

**UI primitives:**
```
components/ui/
├── Button/
│   └── index.tsx              # Used everywhere
├── Input/
│   └── index.tsx              # Used everywhere
└── Loading/
    └── index.tsx              # Used everywhere
```

**Layout components:**
```
components/layout/
├── Header/
│   └── index.tsx              # Used in root layout
├── Sidebar/
│   └── index.tsx              # Used in admin layout
└── Footer/
    └── index.tsx              # Used in public layout
```

### Import Patterns

```typescript
// ✅ Page-specific components (relative import)
import { UserList } from './_components/UserList';
import { useUserFilters } from './_hooks/useUserFilters';

// ✅ Shared feature components (absolute import)
import { UserCard } from '@/components/features/user/components/UserCard';
import { useUserAPI } from '@/components/features/user/hooks/useUserAPI';
import type { User } from '@/components/features/user/types/user.types';

// ✅ UI primitives (absolute import)
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// ✅ Layout components (absolute import)
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

// ✅ Global utilities (absolute import)
import { cn } from '@/utils/cn';
import { useDebounce } from '@/hooks/useDebounce';
```

## Database (`apps/api/prisma/`)

```
prisma/
├── schema.prisma                    # Main schema (imports all models)
├── prisma.config.ts                 # Prisma configuration
├── models/                          # Model definitions
│   ├── common.prisma                # Shared enums, types
│   └── [domain]/                    # Domain-specific models
│       └── [model].prisma           # e.g., user.prisma, product.prisma
├── migrations/                      # Migration history
│   ├── [timestamp]_[name]/
│   │   └── migration.sql
│   └── migration_lock.toml
└── seeds/                           # Seed data
    ├── index.ts                     # Main seed entry point
    ├── config.ts                    # Seed configuration
    └── [domain]/                    # Domain-specific seeds
        └── [seed].ts                # e.g., user.ts, product.ts
```

### Rules
- Split models by domain in `models/[domain]/`
- Common enums and types in `models/common.prisma`
- Main `schema.prisma` imports all model files
- Seeds organized by domain
- Never edit migrations manually

### Example: Multi-file Schema

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// Import all models
import "models/common.prisma"
import "models/auth/user.prisma"
import "models/auth/session.prisma"
import "models/product/product.prisma"
```

```prisma
// models/common.prisma
enum AUDIT_ACTION {
  CREATE
  UPDATE
  DELETE
}

enum APP_LANGUAGE {
  EN
  TH
}
```

```prisma
// models/auth/user.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  isDeleted Boolean  @default(false)

  @@index([email])
  @@index([isDeleted])
}
```

## File Size Guidelines

| File Type | Max Lines | Action if Exceeded |
|-----------|-----------|-------------------|
| Component | 300 | Split into sub-components |
| Hook | 150 | Split into focused hooks |
| Util | 200 | Group by domain |
| Service | 250 | Extract to separate services |
| Repository | 200 | Split by operation type |
| Handler | 150 | One handler per file |

## Barrel Files (index.tsx)

### ✅ Allowed
- `components/ui/Button/index.tsx`
- `components/layout/Header/index.tsx`
- `components/providers/ThemeProvider/index.tsx`
- `components/features/user/components/index.tsx` (optional)

### ❌ Not Allowed
- `app/users/_components/index.tsx` (page-specific, use direct imports)
- `features/index.tsx` (breaks tree-shaking)
- `utils/index.tsx` (import directly from source)

## Best Practices

### Start Local, Extract When Needed
1. Start with `_components/` (page-specific)
2. If used in 2+ pages → Move to `components/features/`
3. If used everywhere → Move to `components/ui/`

### Keep Related Code Together
- Page logic stays with `page.tsx`
- Feature logic stays in `components/features/[feature]/`
- Domain logic stays in backend `features/[feature]/`

### Avoid Deep Nesting
```typescript
// ❌ Bad - Too deep
components/features/user/profile/settings/components/UserSettingsForm.tsx

// ✅ Good - Flat structure
components/features/user/components/UserSettingsForm.tsx
```

### Use Descriptive Names
```typescript
// ❌ Bad - Generic names
features/data/list.handler.ts
components/features/item/components/Card.tsx

// ✅ Good - Specific names
features/user/listUsers.handler.ts
components/features/user/components/UserCard.tsx
```
