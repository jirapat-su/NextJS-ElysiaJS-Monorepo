---
inclusion: always
---

# API Integration

## Authentication
Cookie-based via better-auth (auto-managed, no manual token logic)

## @repo/internal-api (Elysia Backend)

### Client: `useApiClient` + TanStack Query

```tsx
'use client';
export const useUserAPI = () => {
  const api = useApiClient({ baseUrl: env.NEXT_PUBLIC_API_INTERNAL_URL });
  const queryClient = useQueryClient();

  const getMe = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const { data, error } = await api.users.me.get();
      if (error) throw error;
      return data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (input: { name: string }) => {
      const { data, error } = await api.users.me.patch(input);
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', 'me'] }),
  });

  return { getMe, updateProfile };
};
```

### Server: `createApiClient`

```tsx
import { cookies } from 'next/headers';
import { createApiClient } from '@repo/internal-api/server';

const { client } = createApiClient({
  baseUrl: env.NEXT_PUBLIC_API_INTERNAL_URL,
  getCookies: async () => (await cookies()).toString(),
});

const { data, error } = await client.users.me.get();
```

## @repo/fetch (External APIs)

```typescript
const client = createHttpClient({ baseUrl: 'https://api.external.com' });
const response = await client.fetch<Post[]>('/posts');
```

POST:
```typescript
const response = await client.fetch<Post>('/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Hello', body: 'World' }),
});
```

## Error Handling

Internal API:

```tsx
const { data, error, status } = await api.users.me.get();
if (error) {
  if (status === 401) redirect('/sign-in');
  if (status === 404) notFound();
  throw new Error('Failed to fetch user');
}
return data;
```

TanStack Query:

```tsx
const query = useQuery({
  queryKey: ['user'],
  queryFn: async () => {
    const { data, error } = await api.users.me.get();
    if (error) throw error;
    return data;
  },
  retry: 3,
});
```
