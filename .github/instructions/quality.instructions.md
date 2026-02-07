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

## 7. Performance and Tree Shaking

- **No Re-exports (Barrel Files)** in features: avoid `index.ts` re-exports.
- Import from the direct source to keep tree shaking effective.

```typescript
// ✅ Good - Direct imports (features only)
import { UserProfile } from '@/features/user/UserProfile';

// ❌ Bad - Barrel file in features
import { UserProfile } from '@/features/user';
```

**Exception:** Shared components in `src/components/` can use `index.tsx` for cleaner imports.

## 8. Documentation and Comments

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

## 9. Error Handling and Logic Preservation

- **Zero Errors Policy**: Do not submit with lint, type, or build errors.
- **Logic Preservation**: Bug fixes and refactors must not change intended behavior.

## 10. Tooling and Runtime

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

## 11. Date and Time Standards

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
- [ ] No unnecessary `// biome-ignore` comments

**These rules apply to all files within this repository.**
