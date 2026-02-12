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

### `useEffectEvent` — **MANDATORY for Effect-only callbacks**

Use `useEffectEvent` when a callback is **only called from inside `useEffect`** and needs to read the latest props/state without re-triggering the Effect.

**Rules:**
- **MUST** only be called from inside `useEffect`, `useLayoutEffect`, `useInsertionEffect`, or other Effect Events.
- **MUST NOT** be passed to child components, called from event handlers (`onClick`, `onChange`, etc.), or called during render.
- **MUST NOT** be included in the Effect's dependency array.
- If a callback is used in both an Effect **and** an event handler, keep it as `useCallback`.
- Do NOT use `useEffectEvent` to hide dependencies — only for logic that genuinely should not re-trigger your Effect.

```typescript
// ✅ Good - callback only used inside useEffect, reads latest `theme`
const onConnected = useEffectEvent(() => {
  showNotification('Connected!', theme);
});

useEffect(() => {
  const connection = createConnection(roomId);
  connection.on('connected', onConnected);
  connection.connect();
  return () => connection.disconnect();
}, [roomId]); // onConnected is NOT in deps

// ✅ Good - timer reads latest state without restarting interval
const onTick = useEffectEvent(() => {
  setCount(count + increment);
});

useEffect(() => {
  const id = setInterval(() => onTick(), 1000);
  return () => clearInterval(id);
}, []); // stable interval, always reads latest count + increment

// ❌ Bad - used in onClick (event handler), NOT inside an Effect
const loadData = useEffectEvent(async () => {
  const result = await fetchData();
  setData(result);
});
// This is wrong because loadData is called from onClick:
<button onClick={loadData}>Refresh</button>

// ✅ Correct - use useCallback instead when called from event handlers
const loadData = useCallback(async () => {
  const result = await fetchData();
  setData(result);
}, []);
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

## 🆕 React 19 Features

### `useActionState` — Form Actions with pending state
```typescript
'use client';
import { useActionState } from 'react';

const [state, submitAction, isPending] = useActionState(
  async (previousState, formData) => {
    const error = await updateName(formData.get('name'));
    if (error) return error;
    return null;
  },
  null,
);

return (
  <form action={submitAction}>
    <input type="text" name="name" />
    <button type="submit" disabled={isPending}>Update</button>
    {state && <p>{state}</p>}
  </form>
);
```

### `useOptimistic` — Optimistic UI updates
```typescript
'use client';
import { useOptimistic } from 'react';

const [optimisticName, setOptimisticName] = useOptimistic(currentName);

const submitAction = async (formData: FormData) => {
  const newName = formData.get('name') as string;
  setOptimisticName(newName); // show immediately
  const updatedName = await updateName(newName);
  onUpdateName(updatedName);
};
```

### `use` — Read promises and context conditionally
```typescript
import { use, Suspense } from 'react';

// Read a promise (must come from outside render, e.g. parent component)
function Comments({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  const comments = use(commentsPromise); // suspends until resolved
  return comments.map(c => <p key={c.id}>{c.text}</p>);
}

// Read context conditionally (impossible with useContext)
function Heading({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  const theme = use(ThemeContext); // OK after early return
  return <h1 style={{ color: theme.color }}>{children}</h1>;
}
```

### `ref` as a prop — No more `forwardRef`
```typescript
// ✅ React 19 - ref is a regular prop
function MyInput({ placeholder, ref }: { placeholder: string; ref?: React.Ref<HTMLInputElement> }) {
  return <input placeholder={placeholder} ref={ref} />;
}

// ❌ Deprecated - forwardRef
const MyInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <input {...props} ref={ref} />;
});
```

### `<Context>` as provider — Simpler context
```typescript
const ThemeContext = createContext('');

// ✅ React 19
<ThemeContext value="dark">{children}</ThemeContext>

// ❌ Deprecated
<ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>
```

### Ref cleanup functions
```typescript
<input ref={(node) => {
  // ref created — setup logic
  return () => {
    // cleanup when element is removed from DOM
  };
}} />
```

---

## 🏗️ File Organization

**See [quality.instructions.md](./quality.instructions.md) for directory structure (Section 7).**

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
- [ ] **`useEffectEvent` for callbacks only used inside Effects** (never in event handlers or passed to children)
- [ ] **Every component uses `React.memo` with `displayName`**
- [ ] **TanStack Query + `@repo/internal-api` for APIs**
- [ ] **All forms use zod + Server Actions**
- [ ] No `forwardRef` — use `ref` as a prop (React 19)
- [ ] Heavy components lazy loaded
- [ ] No barrel files (`index.ts`) in features
- [ ] Checked `src/components/` and `packages/shadcn` before creating new components
