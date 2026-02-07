---
applyTo: 'apps/client/**'
---

# Frontend Development Rules - React & Next.js

## 🚀 Performance - Mandatory Memoization

**All rules must be followed strictly.**

### `useMemo` and `useCallback`
```typescript
const processed = useMemo(() => data.map(expensive), [data]);
const handleClick = useCallback((id: string) => onSelect(id), [onSelect]);
```

### `React.memo` - **MANDATORY for ALL Components**
```typescript
export const UserCard = memo<UserCardProps>(({ user, onEdit }) => {
  const handleEdit = useCallback(() => onEdit(user.id), [user.id, onEdit]);
  return <div><h3>{user.name}</h3><button onClick={handleEdit}>Edit</button></div>;
});
UserCard.displayName = 'UserCard';
```

---

## 🏗️ File Organization

**Critical rules**
- **Shared components**: use `index.tsx` + related files
- **Features**: no `index.ts` (direct imports only)

**Before creating new components, check**
1. `src/components/`
2. `packages/shadcn`

### `src/components` Structure
- `ui/`: Custom UI components (that are NOT from shadcn or are customized)
- `layout/`: Application layouts
- `providers/`: Context providers

```
src/
├── components/
│   ├── ui/                       # Custom generic UI components
│   │   ├── [ComponentName]/
│   │   │   ├── index.tsx
│   │   │   └── styles.module.css
│   │
│   ├── layout/                   # Application layouts
│   │   ├── [LayoutName]/
│   │   │   ├── index.tsx
│   │   │   └── Sidebar.tsx
│   │
│   └── providers/                # Global providers
│       ├── [ProviderName]/
│       │   ├── index.tsx
│       │   └── context.ts
│
├── features/[moduleName]/        # SHARED Feature modules (used in multiple pages)
│   ├── index.tsx                 # Main feature component
│   ├── [SubComponent].tsx        # Feature specific sub-components
│   ├── use[Feature]API.ts        # Feature specific API hooks
│   └── helpers.ts                # Feature specific helpers
│
├── hooks/                        # Global hooks + common API hooks
│   └── useCommonAPI.ts           # Shared API operations
├── lib/                          # Global utils
└── types/                        # Global types
```

### Page-Specific Components (Co-location)

If a component, hook, or asset is **only used in one specific page**, co-locate it within that page's directory using `_` prefixed folders.

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

### Component Decomposition
- **Single responsibility**: split multi-step or multi-state UIs into sub-components.
- **Naming**: use descriptive names (e.g., `StepOne.tsx`, `StepTwo.tsx`).
- **Orchestration**: main component owns state; sub-components own UI logic.
- Tightly coupled layout pieces (layout + sidebar/topbar) must stay in the same feature folder.

### Import Rules
```typescript
// ✅ Shared components
import { Button } from '@/components/Button';

// ✅ Features (when using index.tsx)
import { UserProfile } from '@/features/user';

// ✅ Features (sub-components)
import { UserSettings } from '@/features/user/UserSettings';
```

---

## ⚡ Next.js

### Server vs Client
```typescript
// Server Component (default)
export default async function Page({ params }: Props) {
  const product = await db.product.findUnique({ where: { id: params.id } });
  return <ProductDetails product={product} />;
}

// Client Component
'use client';
export const ProductActions = memo(({ productId }: Props) => {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(!liked)}>Like</button>;
});
```

### Image Optimization
```typescript
import Image from 'next/image';
<Image src={src} alt={alt} width={500} height={500} priority />
```

---

## 🌐 API Client

See [api-integration.instructions.md](./api-integration.instructions.md).

---

## 📊 Data Fetching

### Database with cache
```typescript
import { cache } from 'react';
export const getUser = cache(async (id: string) => {
  return await db.user.findUnique({ where: { id } });
});
```

---

## 🔄 Caching and Revalidation
```typescript
import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';

export const getPosts = unstable_cache(
  async () => db.post.findMany(),
  ['posts'],
  { tags: ['posts'], revalidate: 3600 }
);

export async function createPost() {
  await db.post.create({ data: {} });
  revalidateTag('posts');
  revalidatePath('/blog');
}
```

---

## 🧭 Routing

```typescript
'use client';
import { useRouter, useSearchParams } from 'next/navigation';

// Navigation
const router = useRouter();
router.push('/dashboard');
router.refresh();

// URL state
const searchParams = useSearchParams();
const params = new URLSearchParams(searchParams);
params.set('q', value);
router.push(`?${params.toString()}`);
```

---

## 🎯 State Management

**Prop drilling > 2 levels? Use Zustand, not Context.**

```typescript
// stores/bearStore.ts
import { create } from 'zustand';

type BearStore = {
  bears: number;
  increase: (by: number) => void;
  reset: () => void;
};

export const useBearStore = create<BearStore>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  reset: () => set({ bears: 0 }),
}));

// Usage in component
'use client';
export const BearCounter = memo(() => {
  const bears = useBearStore((state) => state.bears);
  const increase = useBearStore((state) => state.increase);

  return <button onClick={() => increase(1)}>{bears} bears</button>;
});
```

---

## 📝 Forms and Server Actions

**All form validation must use zod.**

- **Separate schemas**: place Zod schemas in `ComponentName.schema.ts` in the same folder.

```typescript
// features/user/userForm.schema.ts
import { z } from 'zod';
export const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});
export type UserSchema = z.infer<typeof userSchema>;
```

---

## 🛡️ Error Handling

```typescript
// Server Actions - Use zod for validation
'use server';
import { z } from 'zod';
import { createApiClient } from '@repo/internal-api/server';
import { cookies } from 'next/headers';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function createUser(prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { client } = createApiClient({
    baseUrl: env.API_INTERNAL_URL,
    getCookies: async () => (await cookies()).toString(),
  });
  const { data, error } = await client.users.post(parsed.data);

  if (error) return { message: 'Failed to create user' };
  return { message: 'Success' };
}

// Client
'use client';
export const UserForm = memo(() => {
  const [state, formAction, pending] = useActionState(createUser, {});
  return (
    <form action={formAction}>
      <input name="email" />
      {state.errors?.email && <p>{state.errors.email[0]}</p>}
      <button disabled={pending}>Submit</button>
    </form>
  );
});

// Error Boundary
'use client';
export default function ErrorBoundary({ error, reset }: ErrorProps) {
  return <div><h2>Error</h2><button onClick={reset}>Retry</button></div>;
}
```

---

## 🔐 Security

```typescript
// DAL - use server-only + cache
import 'server-only';
import { cache } from 'react';
export const getUser = cache(async () => {
  const session = (await cookies()).get('session')?.value;
  return session ? db.user.findUnique({ where: { sessionToken: session } }) : null;
});

// Server Action - Verify Ownership
export async function deletePost(postId: string) {
  const user = await getUser();
  const post = await db.post.findUnique({ where: { id: postId } });
  if (post?.authorId !== user?.id) throw new Error('Forbidden');
  await db.post.delete({ where: { id: postId } });
}
```

**Warning:** Never expose sensitive data in Client Components.

---

## ⚡ Lazy Loading

```typescript
'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  ssr: false,
});

export const Dashboard = memo(() => (
  <div>
    <OverviewPanel />
    <HeavyChart />
  </div>
));

// External libraries
export const SearchBar = memo(() => {
  const handleSearch = useCallback(async (query: string) => {
    const Fuse = (await import('fuse.js')).default;
    const fuse = new Fuse(data);
    setResults(fuse.search(query));
  }, []);
  return <input onChange={(e) => handleSearch(e.target.value)} />;
});
```

---

## 📌 Checklist

See [quality.instructions.md](./quality.instructions.md) for global gates.

Before submitting frontend code, verify:

- [ ] `useMemo` and `useCallback` for expensive logic/handlers
- [ ] **Every component uses `React.memo` with `displayName`**
- [ ] **TanStack Query + `@repo/internal-api` for APIs**
- [ ] **All forms use zod + Server Actions**
- [ ] Heavy components lazy loaded
- [ ] No barrel files (`index.ts`) in features
- [ ] Checked `src/components/` and `packages/shadcn` before creating new components
