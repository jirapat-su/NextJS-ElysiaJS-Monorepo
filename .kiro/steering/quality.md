---
inclusion: always
---

# Quality Standards

## Core Rules
- Max 500 lines per file
- Zero lint/type errors: `bun lint` + `tsc --noEmit`
- Cognitive complexity < 15
- No commented-out code
- No `console.log` in production code
- Bun only (no npm/yarn/pnpm)

## Code Style
- Use early returns (guard clauses) over nested if/else
- Prefer `const` over `let`, never use `var`
- Use template literals over string concatenation
- Destructure objects and arrays when accessing multiple properties
- One component per file (except tightly coupled sub-components)

## TypeScript
- Always `type`, never `interface`
- No `any` — use `unknown` + type guards or Zod
- No unsafe `as` — use type guards or Zod
- Use `satisfies` for type checking without widening
- Prefer union types over enums for constants

```typescript
// ✅ Good
type User = { id: string; name: string };
type Status = 'active' | 'inactive' | 'pending';
const config = { timeout: 5000 } satisfies Config;

// ❌ Bad
interface User { id: string; name: string }
enum Status { Active, Inactive, Pending }
const config: Config = { timeout: 5000 };
```

## Naming
- Booleans: `is`, `has`, `can`, `should` prefix
- Components: PascalCase (`UserProfile.tsx`)
- Hooks/utils: camelCase (`useAuth.ts`, `formatDate.ts`)
- Types: camelCase + `.types.ts` (`user.types.ts`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- Private functions: prefix with underscore (`_handleInternalLogic`)
- Event handlers: `handle` prefix (`handleClick`, `handleSubmit`)
- Inline exports only

```typescript
// ✅ Good
export const MAX_RETRY_COUNT = 3;
export const myFunction = () => { ... };
const [isLoading, setIsLoading] = useState(false);
const handleClick = () => { ... };

// ❌ Bad
const myFunction = () => { ... }; export { myFunction };
const [loading, setLoading] = useState(false);
const onClick = () => { ... };
```

## Project Structure

See `structure.md` for complete directory structure guidelines including:
- Backend feature organization
- Frontend component hierarchy
- Database schema structure
- Decision tree for code placement
- Import patterns and examples

## Error Handling

### Frontend
```typescript
// ✅ Good - Specific error handling
try {
  const data = await fetchUser(id);
  return data;
} catch (error) {
  if (error instanceof NetworkError) {
    toast.error('Network error. Please check your connection.');
  } else if (error instanceof ValidationError) {
    toast.error(error.message);
  } else {
    toast.error('An unexpected error occurred.');
  }
  throw error;
}

// ❌ Bad - Generic error handling
try {
  const data = await fetchUser(id);
  return data;
} catch (error) {
  console.log(error);
  toast.error('Error');
}
```

### Backend
```typescript
// ✅ Good - Tagged errors with Effect
export class UserRepositoryError extends Data.TaggedError(
  'Repository/User/Error'
)<ErrorMsg> {
  static new = createErrorFactory(this);
}

// In handler - map to HTTP status
Effect.match(serviceResult, {
  onFailure: error => {
    switch (error._tag) {
      case 'Repository/User/NotFound':
        return status(404, { message: 'User not found' });
      case 'Repository/User/Error':
        return status(500, { message: 'Database error' });
      default:
        return status(500, { message: 'Internal server error' });
    }
  },
  onSuccess: data => status(200, data),
});
```

## Testing Conventions

### File naming
- Unit tests: `[filename].test.ts(x)`
- Integration tests: `[filename].integration.test.ts`
- E2E tests: `[feature].e2e.test.ts`

### Test structure
```typescript
describe('UserCard', () => {
  describe('when user is active', () => {
    it('should display active badge', () => {
      // Arrange
      const user = { id: '1', name: 'John', isActive: true };

      // Act
      render(<UserCard user={user} />);

      // Assert
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('when user is inactive', () => {
    it('should display inactive badge', () => {
      // Test implementation
    });
  });
});
```

## Performance Guidelines

### Frontend
- Use `React.memo` for all components
- Use `useMemo` for expensive computations
- Use `useCallback` for event handlers passed to children
- Lazy load heavy components with `dynamic()`
- Use `loading.tsx` and `error.tsx` for Suspense boundaries
- Optimize images with Next.js `<Image>` component

### Backend
- Use `Effect.all` for parallel operations
- Cache frequently accessed data with Redis
- Use database indexes for filtered/sorted queries
- Implement pagination for list endpoints
- Use connection pooling for database connections

## Security Best Practices

### Frontend
- Never store sensitive data in localStorage/sessionStorage
- Sanitize user input before rendering
- Use `httpOnly` cookies for authentication tokens
- Validate all user input with Zod schemas
- Use CSP headers for XSS protection

### Backend
- Always validate input with Zod schemas
- Use parameterized queries (Prisma handles this)
- Implement rate limiting on public endpoints
- Log security events (failed auth, suspicious activity)
- Never expose internal error details to clients
- Use soft deletes to preserve audit trail

## Git Commit Conventions

```bash
# Format: <type>(<scope>): <subject>

# Types:
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation only
style:    # Code style (formatting, missing semicolons)
refactor: # Code change that neither fixes a bug nor adds a feature
perf:     # Performance improvement
test:     # Adding or updating tests
chore:    # Maintenance tasks (deps, config)

# Examples:
feat(auth): add email verification flow
fix(user): resolve avatar upload issue
docs(api): update authentication guide
refactor(cart): simplify checkout logic
perf(db): add index on user email field
```

## Documentation

### When to add JSDoc
- Complex algorithms or business logic
- Public APIs or exported functions
- Non-obvious type parameters
- Functions with side effects

```typescript
/**
 * Calculates the discounted price based on user tier and promo code.
 *
 * @param originalPrice - The original price before discounts
 * @param userTier - User's membership tier (affects discount percentage)
 * @param promoCode - Optional promotional code for additional discount
 * @returns The final price after applying all discounts
 *
 * @example
 * calculateDiscount(100, 'premium', 'SAVE20') // Returns 64
 */
export const calculateDiscount = (
  originalPrice: number,
  userTier: UserTier,
  promoCode?: string
): number => {
  // Implementation
};
```

## Standards
- Barrel files (`index.tsx`) allowed only in `components/` folder
- Date/time: `date-fns` + ISO 8601 (`dd/MM/yyyy HH:mm:ss`)
- Env vars: `import { env } from '@/env'` (never `process.env`)
- Logging: Backend uses `logger`, frontend uses `console.error` only in error boundaries
- All async functions must have proper error handling
- Use Zod for all runtime validation (forms, API responses, env vars)
