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

## 7. File & Directory Structure

All apps and packages must follow these directory structures.

### Backend (`apps/api/src`)

Feature-based structure with high cohesion.

**Feature Structure:**
```
src/features/[featureName]/
├── [featureName].router.ts          # Feature router (aggregates all handlers)
├── [moduleName]/
│   ├── [moduleName].handler.ts      # HTTP Entry, Validation, Effect Runtime
│   ├── [moduleName].service.ts      # Business logic, Orchestration
│   ├── [moduleName].repository.ts   # Database interaction (Prisma)
│   ├── [moduleName].schema.ts       # Zod validation & response schemas
│   └── [moduleName].utils.ts        # Module-specific helpers, constants, configs
└── utils.ts                         # Feature-level helpers (shared across modules)
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

## Pre-Submission Checklist

Before submitting any code changes, verify:

- [ ] File does not exceed 500 lines
- [ ] `bun lint` and `tsc --noEmit` pass (or `turbo run build`)
- [ ] Used `type` instead of `interface`
- [ ] Cognitive complexity < 15
- [ ] No commented-out code
- [ ] Date/time uses `date-fns` and ISO 8601 strings
- [ ] File naming follows conventions
- [ ] Directory structure follows Section 7
- [ ] No unnecessary `// biome-ignore` comments

**These rules apply to all files within this repository.**
