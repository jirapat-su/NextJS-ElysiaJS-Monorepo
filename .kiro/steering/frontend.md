---
inclusion: fileMatch
fileMatchPattern: "apps/client/**"
---

# Frontend - React & Next.js

## Performance (Mandatory)

### Memoization
```typescript
const processed = useMemo(() => data.map(expensive), [data]);
const handleClick = useCallback((id: string) => onSelect(id), [onSelect]);
```

### `useEffectEvent` (Effect-only callbacks)
Only for callbacks called inside `useEffect` that need latest props/state without re-triggering Effect.

Rules:
- MUST only be called inside Effects
- MUST NOT be passed to children or event handlers
- MUST NOT be in dependency array

```typescript
// ✅ Inside useEffect
const onTick = useEffectEvent(() => setCount(count + increment));
useEffect(() => {
  const id = setInterval(() => onTick(), 1000);
  return () => clearInterval(id);
}, []);

// ❌ Event handler - use useCallback
const loadData = useCallback(async () => {
  const result = await fetchData();
  setData(result);
}, []);
```

### `React.memo` (ALL components)
```typescript
export const UserCard = memo<UserCardProps>(({ user, onEdit }) => {
  const handleEdit = useCallback(() => onEdit(user.id), [user.id, onEdit]);
  return <div><h3>{user.name}</h3><button onClick={handleEdit}>Edit</button></div>;
});
UserCard.displayName = 'UserCard';
```

## React 19 Features

### `useActionState`
```typescript
const [state, submitAction, isPending] = useActionState(
  async (prev, formData) => {
    const error = await updateName(formData.get('name'));
    return error ?? null;
  },
  null
);
```

### `useOptimistic`
```typescript
const [optimisticName, setOptimisticName] = useOptimistic(currentName);
const submitAction = async (formData: FormData) => {
  const newName = formData.get('name') as string;
  setOptimisticName(newName);
  const updated = await updateName(newName);
  onUpdateName(updated);
};
```

### `use`
```typescript
// Read promise
const comments = use(commentsPromise);

// Read context conditionally
if (!children) return null;
const theme = use(ThemeContext);
```

### `ref` as prop (no `forwardRef`)
```typescript
// ✅ React 19
function MyInput({ ref }: { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} />;
}
```

### `<Context>` as provider
```typescript
// ✅ React 19
<ThemeContext value="dark">{children}</ThemeContext>
```

## Tailwind CSS v4 (CSS-first, no config.js)

```css
@import "tailwindcss";
@theme {
  --color-primary: oklch(0.7 0.2 240);
  --spacing-18: 4.5rem;
}
```

Import shadcn tokens: `@import "@repo/shadcn/styles/globals.css";`

## Next.js

### Server vs Client
```typescript
// Server (default)
export default async function Page({ params }: Props) {
  const product = await db.product.findUnique({ where: { id: params.id } });
  return <ProductDetails product={product} />;
}

// Client
'use client';
export const Actions = memo(() => {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(!liked)}>Like</button>;
});
```

### Data Fetching
```typescript
import { cache } from 'react';
export const getUser = cache(async (id: string) =>
  db.user.findUnique({ where: { id } })
);
```

### Caching
```typescript
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

### Routing

```typescript
const router = useRouter();
router.push('/dashboard');

const searchParams = useSearchParams();
const params = new URLSearchParams(searchParams);
params.set('q', value);
router.push(`?${params.toString()}`);
```

## State Management (Zustand > Context)

```typescript
export const useBearStore = create<BearStore>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}));

const bears = useBearStore((state) => state.bears);
```

### Example: Break re-render chains with feature stores + granular selectors

**Goal:** Filter changes should re-render only the filter UI, not the product list.

```typescript
// stores/advertCreate/store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type State = {
  step: number;
  filters: { query: string; page: number };
  products: string[];
  setStep: (n: number) => void;
  setFilters: (f: Partial<State['filters']>) => void;
  setProducts: (p: string[]) => void;
};

export const useCreateStore = create<State>()(
  devtools((set) => ({
    step: 1,
    filters: { query: '', page: 1 },
    products: [],
    setStep: (n) => set({ step: n }),
    setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
    setProducts: (p) => set({ products: p }),
  }), { name: 'createStore' })
);
```

```tsx
// FilterComponent.tsx
import { useCreateStore } from './stores/advertCreate/store';

export function FilterComponent() {
  const query = useCreateStore((s) => s.filters.query);
  const setFilters = useCreateStore((s) => s.setFilters);

  return (
    <input
      value={query}
      onChange={(e) => setFilters({ query: e.target.value, page: 1 })}
    />
  );
}
```

```tsx
// ProductList.tsx
import { useCreateStore } from './stores/advertCreate/store';

export function ProductList() {
  const products = useCreateStore((s) => s.products);

  return (
    <ul>
      {products.map((p) => (
        <li key={p}>{p}</li>
      ))}
    </ul>
  );
}
```

**Notes:**
- Always select the smallest slice of state needed by a component.
- Prefer feature-based stores (create/detail/list/shared) to avoid mega-stores.
- Avoid passing whole store objects to children; it reintroduces broad re-renders.

**Context anti-pattern (for comparison):**
```tsx
const CreateContext = createContext(null);

function CreateProvider({ children }) {
  const [filters, setFilters] = useState({ query: '', page: 1 });
  const [products, setProducts] = useState<string[]>([]);
  const value = { filters, setFilters, products, setProducts };
  return <CreateContext.Provider value={value}>{children}</CreateContext.Provider>;
}

// Any consumer re-renders when value changes
```

### Server state: TanStack Query + UI state: Zustand

**Principle:** Server state (cache/fetch/sync) lives in TanStack Query. UI/client state lives in Zustand.

```tsx
// queries/products.ts
import { useQuery } from '@tanstack/react-query';

export function useProducts(query: string, page: number) {
  return useQuery({
    queryKey: ['products', { query, page }],
    queryFn: async () => {
      const res = await fetch(`/api/products?query=${query}&page=${page}`);
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<string[]>;
    },
    staleTime: 60_000,
  });
}
```

```ts
// stores/ui.ts
import { create } from 'zustand';

type UIState = {
  query: string;
  page: number;
  setQuery: (q: string) => void;
  setPage: (p: number) => void;
};

export const useUIStore = create<UIState>((set) => ({
  query: '',
  page: 1,
  setQuery: (q) => set({ query: q, page: 1 }),
  setPage: (p) => set({ page: p }),
}));
```

```tsx
// ProductList.tsx
import { useUIStore } from './stores/ui';
import { useProducts } from './queries/products';

export function ProductList() {
  const query = useUIStore((s) => s.query);
  const page = useUIStore((s) => s.page);
  const { data, isLoading } = useProducts(query, page);

  if (isLoading) return <div>Loading...</div>;
  return <ul>{data?.map((p) => <li key={p}>{p}</li>)}</ul>;
}
```

**Notes:**
- TanStack Query handles cache, dedupe, retry, stale data, and refetching.
- Zustand should keep UI state only (filters, modals, steps), not server data.

## Forms (zod + Server Actions)

```typescript
// Server Action
const schema = z.object({ email: z.string().email() });

export async function createUser(prev: FormState, formData: FormData) {
  const parsed = schema.safeParse({ email: formData.get('email') });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { data, error } = await client.users.post(parsed.data);
  if (error) return { message: 'Failed' };
  return { message: 'Success' };
}

// Client
const [state, formAction, pending] = useActionState(createUser, {});
```

## Security

```typescript
// DAL
import 'server-only';
export const getUser = cache(async () => {
  const session = (await cookies()).get('session')?.value;
  return session ? db.user.findUnique({ where: { sessionToken: session } }) : null;
});

// Verify ownership
export async function deletePost(postId: string) {
  const user = await getUser();
  const post = await db.post.findUnique({ where: { id: postId } });
  if (post?.authorId !== user?.id) throw new Error('Forbidden');
  await db.post.delete({ where: { id: postId } });
}
```

## Lazy Loading

```typescript
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), { ssr: false });

// External libs
const handleSearch = useCallback(async (query: string) => {
  const Fuse = (await import('fuse.js')).default;
  const fuse = new Fuse(data);
  setResults(fuse.search(query));
}, []);
```
