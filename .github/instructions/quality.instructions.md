---
applyTo: '**'
---

# Quality Standards and Code Guidelines

All code changes must follow these standards to keep the codebase consistent and maintainable.

## 1. File Length Limit

- **Files must not exceed 500 lines.**
- If a file exceeds this limit, refactor into separate components, custom hooks, or utility functions.

## 2. Linting and Type Validation

- **Zero warnings and zero errors are required.**
- **Mandatory after every change:** run `bun run lint` and fix **all** errors and warnings from **any** file.
- Run `bun lint` and `tsc --noEmit` (or `turbo run build`).
- Biome does NOT check TypeScript types; TypeScript validation is mandatory.
- Do not use `// biome-ignore` unless absolutely necessary and justified with a clear comment.

## 3. TypeScript and Typing Standards

- **Always use the `type` keyword for definitions. Do not use `interface`.**
- Keep `strict` mode enabled.
- Use JSDoc for complex logic (params + return value).

```typescript
// ✅ Correct
type User = { id: string; name: string };

// ❌ Wrong
interface User { id: string; name: string }
```

## 4. Complexity Control

- Keep **Cognitive Complexity below 15** (as checked by Biome).
- Use **Guard Clauses** instead of deeply nested if/else statements.

```typescript
// ✅ Good - Guard clauses
function processUser(user: User | null) {
  if (!user) return;
  if (!user.isActive) return;
  if (!user.hasPermission) return;

  // Main logic here
  performAction(user);
}

// ❌ Bad - Nested conditions
function processUser(user: User | null) {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        performAction(user);
      }
    }
  }
}
```

## 5. Testing

- Key features and critical logic must be covered by Unit or Integration Tests.

## 6. File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| **Components** | PascalCase | `UserProfile.tsx`, `SubmitButton.tsx` |
| **Hooks** | camelCase | `useAuth.ts`, `useLocalStorage.ts` |
| **Utilities** | camelCase | `apiClient.ts`, `formatDate.ts` |
| **Types** | camelCase + `.types.ts` | `userInformation.types.ts` |
| **Styles** | camelCase | `userProfile.module.css` |
| **Tests** | Match source + `.test.ts(x)` | `UserProfile.test.tsx`, `validateEmail.test.ts` |

## 7. Export Pattern

Always use **inline named exports** directly on declaration. Do not declare first and export separately.

```typescript
// ✅ Good - Inline export on declaration
export const myFunction = () => { ... };
export const myVariable = 'value';
export const myPlugin = new Elysia({ name: 'my-plugin' });
export type MyType = { id: string };

// ❌ Bad - Separate export statement
const myFunction = () => { ... };
const myVariable = 'value';
type MyType = { id: string };

export { myFunction, myVariable };
export type { MyType };
```

## 8. File & Directory Structure

All apps and packages must follow these directory structures.

### Backend (`apps/api/src`)

Feature-based structure with high cohesion.

**Feature Structure:**
```
src/features/
├── router.ts                        # Central app router (registers all feature routers)
└── [featureName]/
    ├── [featureName].router.ts      # Feature router (aggregates all handlers)
    ├── [moduleName]/
    │   ├── [moduleName].handler.ts  # HTTP Entry, Validation, Effect Runtime
    │   ├── [moduleName].service.ts  # Business logic, Orchestration
    │   ├── [moduleName].repository.ts # Database interaction (Prisma)
    │   ├── [moduleName].schema.ts   # Zod validation & response schemas
    │   └── [moduleName].utils.ts    # Module-specific helpers, constants, configs
    └── utils.ts                     # Feature-level helpers (shared across modules)
```

**Libs & Plugins:** directory-based structure under `src/libs/` and `src/plugins/`:
```
[libName]/ or [pluginName]/
├── index.ts        # Main export
├── config.ts       # Configuration & constants
└── types.ts        # Types (optional)
```

### Frontend (`apps/client/src`)

- **Shared components**: use `index.tsx` + related files
- **Features**: no `index.ts` (direct imports only)
- **Before creating new components**, check `src/components/` and `packages/shadcn`

```
src/
├── components/
│   ├── ui/                       # Custom generic UI components
│   │   └── [ComponentName]/
│   │       ├── index.tsx
│   │       └── styles.module.css
│   ├── layout/                   # Application layouts
│   │   └── [LayoutName]/
│   │       ├── index.tsx
│   │       └── Sidebar.tsx
│   └── providers/                # Global providers
│       └── [ProviderName]/
│           ├── index.tsx
│           └── context.ts
├── features/[moduleName]/        # SHARED Feature modules (used in multiple pages)
│   ├── index.tsx
│   ├── [SubComponent].tsx
│   ├── use[Feature]API.ts
│   └── helpers.ts
├── hooks/                        # Global hooks + common API hooks
├── libs/                         # Global utils
└── types/                        # Global types
```

**Page-Specific Components (Co-location):** If a component, hook, or asset is **only used in one specific page**, co-locate it using `_` prefixed folders.

```
src/app/(public)/sign-in/
├── page.tsx
├── _components/
│   └── SignInForm.tsx
├── _hooks/
│   └── useSignInAPI.ts
├── _assets/
│   └── logo.png
```

### Database (`apps/api/prisma`)

```
apps/api/prisma/
├── schema.prisma          # Main schema file (datasource, generator)
├── prisma.config.ts       # Prisma configuration
├── models/
│   ├── common.prisma      # Shared enums and types
│   └── [domain]/
│       └── [model].prisma # Domain-specific models
├── migrations/
│   └── ...
└── seeds/
    ├── index.ts
    └── [domain]/
        └── [seed].ts
```

---

## 8. Performance and Tree Shaking

- **No Re-exports (Barrel Files)** in features: avoid `index.ts` re-exports.
- Import from the direct source to keep tree shaking effective.

```typescript
// ✅ Good - Direct imports (features only)
import { UserProfile } from '@/features/user/UserProfile';

// ❌ Bad - Barrel file in features
import { UserProfile } from '@/features/user';
```

**Exception:** Shared components in `src/components/` can use `index.tsx` for cleaner imports.

## 9. Documentation and Comments

- **No commented-out code.**
- **JSDoc only** for complex logic, parameters, and return types.

```typescript
/**
 * Processes user authentication and generates JWT token
 * @param credentials - User login credentials
 * @returns Authentication token with expiry
 * @throws AuthenticationError if credentials are invalid
 */
export async function authenticate(credentials: Credentials): Promise<AuthToken> {
  // Implementation
}
```

## 10. Error Handling and Logic Preservation

- **Zero Errors Policy**: Do not submit with lint, type, or build errors.
- **Logic Preservation**: Bug fixes and refactors must not change intended behavior.

## 11. Tooling and Runtime

- **Bun Only**: This project exclusively uses **Bun** as its package manager, test runner, and runtime.
- Do not use `npm`, `yarn`, or `pnpm`.

```bash
# ✅ Correct
bun install
bun run dev
bun test

# ❌ Wrong
npm install
yarn dev
pnpm test
```

## 12. Date and Time Standards

- **Library**: Use `date-fns` for all date and time manipulations.
- **Data Handling**: Always store and transmit date/time data between frontend and backend as **ISO 8601 strings** only.
- **Display Format**: All date and time displays in the UI must follow the format `dd/MM/yyyy HH:mm:ss`.

```typescript
import { format, parseISO } from 'date-fns';

// ✅ Correct - ISO 8601 for API
const apiDate = new Date().toISOString(); // "2026-01-30T10:30:00.000Z"

// ✅ Correct - Format for display
const displayDate = format(parseISO(apiDate), 'dd/MM/yyyy HH:mm:ss');
// "30/01/2026 17:30:00"
```

---

## 13. Environment Variables (t3-env)

All environment variables must be validated at startup using `@t3-oss/env-*` with Zod schemas. Never use `process.env` directly — always import from `env/index.ts`.

### Frontend (`apps/client/src/env/`)

Uses `@t3-oss/env-nextjs`. Split into 3 files for clarity:

```
src/env/
├── index.ts    # createEnv - combines server + client schemas
├── server.ts   # Server-only schema + runtimeEnv mapping
└── client.ts   # Client schema (NEXT_PUBLIC_*) + runtimeEnv mapping
```

**`client.ts`** — Client-side variables (exposed to browser):

```typescript
import { z } from 'zod';

/**
 * Client-side environment variables schema
 * These are exposed to the browser (must be prefixed with NEXT_PUBLIC_)
 */
export const clientSchema = {
  NEXT_PUBLIC_API_INTERNAL_URL: z.url(),
};

/**
 * Client-side runtime environment mapping
 */
export const clientRuntimeEnv = {
  NEXT_PUBLIC_API_INTERNAL_URL: process.env.NEXT_PUBLIC_API_INTERNAL_URL,
};
```

**`server.ts`** — Server-only variables:

```typescript
import { z } from 'zod';

/**
 * Server-side environment variables schema
 * These are only available on the server and never exposed to the client
 */
export const serverSchema = {
  TZ: z.string().trim().refine(/* ... */).readonly().default('Asia/Bangkok'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
};

/**
 * Server-side runtime environment mapping
 */
export const serverRuntimeEnv = {
  TZ: process.env.TZ,
  NODE_ENV: process.env.NODE_ENV,
};
```

**`index.ts`** — Combines schemas and exports `env`:

```typescript
import { createEnv } from '@t3-oss/env-nextjs';
import { vercel } from '@t3-oss/env-nextjs/presets-zod';
import { clientRuntimeEnv, clientSchema } from './client';
import { serverRuntimeEnv, serverSchema } from './server';

export const env = createEnv({
  server: serverSchema,
  client: clientSchema,
  extends: [vercel()],
  experimental__runtimeEnv: {
    ...clientRuntimeEnv,
    ...serverRuntimeEnv,
  },
  emptyStringAsUndefined: true,
  onValidationError: issues => {
    console.error('❌ Environment validation failed:');
    for (const issue of issues) {
      const path = issue.path?.join('.') ?? 'unknown';
      console.error(`  - ${path}: ${issue.message}`);
    }
    throw new Error('Invalid environment variables');
  },
});
```

### Backend (`apps/api/src/env/`)

Uses `@t3-oss/env-core`. Split into 2 files:

```
src/env/
├── index.ts    # createEnv - combines server schema + runtimeEnv
└── server.ts   # Server-only schema + runtimeEnv mapping
```

**`server.ts`** — Server-only variables:

```typescript
import z from 'zod';

/**
 * Server-side environment variables schema
 * These are only available on the server and never exposed to the client
 */
export const serverSchema = {
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development').readonly(),
  DATABASE_URL: z.url().min(1).readonly(),
  REDIS_URL: z.url().min(1).readonly(),
  PORT: z.coerce.number().min(1).max(65535).default(5005).readonly(),
  // ... other server variables
};

/**
 * Server-side runtime environment mapping
 */
export const serverRuntimeEnv = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  PORT: process.env.PORT,
  // ... other server variables
};
```

**`index.ts`** — Combines schema and exports `env`:

```typescript
import { createEnv } from '@t3-oss/env-core';
import { vercel } from '@t3-oss/env-core/presets-zod';
import { serverRuntimeEnv, serverSchema } from './server';

export const env = createEnv({
  extends: [vercel()],
  server: serverSchema,
  runtimeEnv: {
    ...serverRuntimeEnv,
  },
  emptyStringAsUndefined: true,
  isServer: true,
  onValidationError: issues => {
    console.error('❌ Environment validation failed:');
    for (const issue of issues) {
      const path = issue.path?.join('.') ?? 'unknown';
      console.error(`  - ${path}: ${issue.message}`);
    }
    throw new Error('Invalid environment variables');
  },
});
```

### Rules

- **Never use `process.env` directly** — always `import { env } from '@/env'`
- **Zod schemas are required** for all variables
- Use `.readonly()` for values that should not be reassigned
- Use `.default()` for variables with sensible defaults
- `emptyStringAsUndefined: true` — empty strings are treated as missing
- Frontend variables **must** be prefixed with `NEXT_PUBLIC_`
- Add `onValidationError` handler for clear error messages at startup

---

## Pre-Submission Checklist

Before submitting any code changes, verify:

- [ ] File does not exceed 500 lines
- [ ] `bun lint` and `tsc --noEmit` pass (or `turbo run build`)
- [ ] Used `type` instead of `interface`
- [ ] Cognitive complexity < 15
- [ ] No commented-out code
- [ ] Date/time uses `date-fns` and ISO 8601 strings
- [ ] File naming follows conventions
- [ ] Directory structure follows Section 8
- [ ] No unnecessary `// biome-ignore` comments
- [ ] Environment variables use `@t3-oss/env-*` with Zod validation

**These rules apply to all files within this repository.**
