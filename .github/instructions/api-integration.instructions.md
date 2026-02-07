---
applyTo: '**'
---

# API Integration Guide

This document summarizes API client usage for internal (Elysia) and external services.

## 🔐 Authentication Architecture

**Cookie-based authentication** via **better-auth**:

- better-auth manages session tokens in `httpOnly` cookies automatically
- Frontend sends cookies with `withCredentials: true`
- Session refresh is handled by better-auth internally (no manual refresh token logic)
- No token management needed in frontend state

```
Browser (Client) <-> Backend (Elysia + better-auth) via cookies
Next.js (Server) <-> Backend (Elysia + better-auth) via getCookies()
```

---

## 🔗 @repo/internal-api (Internal API Client)

Use for all calls to the Elysia backend (`apps/api`).

---

### Client-side: `useApiClient`

#### Basic Usage

```tsx
'use client';

import { memo, useEffect, useState } from 'react';
import { useApiClient } from '@repo/internal-api/client';
import { env } from '@/env';

export const UserProfile = memo(() => {
  const api = useApiClient({
    baseUrl: env.NEXT_PUBLIC_API_URL,
  });
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await api.users.me.get();
      if (data) setUser(data);
    };
    fetchUser();
  }, [api]);

  if (!user) return <div>Loading...</div>;
  return <div>{user.name}</div>;
});
UserProfile.displayName = 'UserProfile';
```

#### With TanStack Query (Recommended)

```tsx
'use client';
import { memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@repo/internal-api/client';
import { env } from '@/env';

export const useUserAPI = () => {
  const api = useApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });

  return { getMe, updateProfile };
};

// Usage in component
export const ProfileEditor = memo(() => {
  const { getMe, updateProfile } = useUserAPI();

  if (getMe.isLoading) return <div>Loading...</div>;
  if (getMe.error) return <div>Error: {getMe.error.message}</div>;

  return (
    <div>
      <h1>{getMe.data?.name}</h1>
      <button
        onClick={() => updateProfile.mutate({ name: 'New Name' })}
        disabled={updateProfile.isPending}
      >
        Update
      </button>
    </div>
  );
});
ProfileEditor.displayName = 'ProfileEditor';
```

### Server-side: `createApiClient`

#### Server Component Usage

```tsx
// app/dashboard/page.tsx
import { cookies } from 'next/headers';
import { createApiClient } from '@repo/internal-api/server';
import { env } from '@/env';

export default async function DashboardPage() {
  const { client } = createApiClient({
    baseUrl: env.API_INTERNAL_URL,
    getCookies: async () => (await cookies()).toString(),
  });

  const { data: user, error } = await client.users.me.get();

  if (error) {
    return <div>Error loading user</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
    </div>
  );
}
```

#### Without Cookie Forwarding (Public Endpoints)

```tsx
// For public endpoints that don't need authentication
const { client } = createApiClient({
  baseUrl: env.API_INTERNAL_URL,
});

const { data } = await client.public.health.get();
```

---

## 🌐 @repo/fetch (External API Client)

Use for external or third-party APIs.

### Basic Usage

```typescript
import { createHttpClient } from '@repo/fetch';

const client = createHttpClient({
  baseUrl: 'https://api.external-service.com',
});

// GET request with typed response
type Post = {
  id: number;
  title: string;
  body: string;
};

const response = await client.fetch<Post[]>('/posts');
console.log(response.data);    // Post[]
console.log(response.status);  // 200
```

### POST Request

```typescript
const client = createHttpClient({
  baseUrl: 'https://api.external-service.com',
});

type CreatePostInput = {
  title: string;
  body: string;
};

type Post = {
  id: number;
  title: string;
  body: string;
};

const response = await client.fetch<Post>('/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Hello World',
    body: 'This is a post',
  } satisfies CreatePostInput),
});

console.log(response.data.id);  // number
```

### With Authentication Headers

```typescript
const client = createHttpClient({
  baseUrl: 'https://api.github.com',
  headers: {
    'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
  },
  withCredentials: false,  // Disable for cross-origin requests
});

type Repo = {
  id: number;
  name: string;
  full_name: string;
};

const response = await client.fetch<Repo[]>('/user/repos');
```

### In Server Component

```tsx
// app/github/page.tsx
import { createHttpClient } from '@repo/fetch';

type GitHubUser = {
  login: string;
  name: string;
  avatar_url: string;
};

export default async function GitHubPage() {
  const client = createHttpClient({
    baseUrl: 'https://api.github.com',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
    },
    withCredentials: false,
  });

  const response = await client.fetch<GitHubUser>('/users/octocat');

  return (
    <div>
      <img src={response.data.avatar_url} alt={response.data.name} />
      <h1>{response.data.name}</h1>
    </div>
  );
}
```

### In Client Component with TanStack Query

```tsx
'use client';
import { memo, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createHttpClient } from '@repo/fetch';

type WeatherData = {
  temperature: number;
  description: string;
};

export const WeatherWidget = memo(() => {
  const client = useMemo(
    () =>
      createHttpClient({
        baseUrl: 'https://api.weather.com',
        headers: { 'X-API-Key': process.env.NEXT_PUBLIC_WEATHER_API_KEY! },
        withCredentials: false,
      }),
    []
  );

  const weather = useQuery({
    queryKey: ['weather', 'bangkok'],
    queryFn: async () => {
      const response = await client.fetch<WeatherData>('/current?city=bangkok');
      return response.data;
    },
  });

  if (weather.isLoading) return <div>Loading...</div>;
  if (weather.error) return <div>Error</div>;

  return (
    <div>
      <p>Temperature: {weather.data?.temperature}°C</p>
      <p>{weather.data?.description}</p>
    </div>
  );
});
WeatherWidget.displayName = 'WeatherWidget';
```

## 🔄 Error Handling Patterns

### Internal API (Eden Treaty)

```tsx
const { data, error, status } = await api.users.me.get();

if (error) {
  // error is typed based on API response
  console.error('API Error:', error);

  if (status === 401) {
    // Unauthorized - session expired or not logged in
    redirect('/sign-in');
  }

  if (status === 404) {
    // Not found
    notFound();
  }

  throw new Error('Failed to fetch user');
}

// data is typed as User
return data;
```

### External API (@repo/fetch)

```tsx
import { createHttpClient } from '@repo/fetch';

const client = createHttpClient({ baseUrl: 'https://api.example.com' });

try {
  const response = await client.fetch<User>('/users/1');
  return response.data;
} catch (error) {
  if (error instanceof TypeError) {
    // Network error or request failed
    console.error('Network error:', error.message);
  }
  throw error;
}
```

### With TanStack Query

```tsx
const query = useQuery({
  queryKey: ['user'],
  queryFn: async () => {
    const { data, error } = await api.users.me.get();
    if (error) throw error;  // Let TanStack Query handle the error
    return data;
  },
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

// Access error state
if (query.isError) {
  return <ErrorDisplay error={query.error} />;
}
```

---

## 📋 Quick Reference

See [quality.instructions.md](./quality.instructions.md) for global gates.

### Environment Variables

```bash
# .env.local (Next.js apps)
# Client-side (exposed to browser)
NEXT_PUBLIC_API_URL=http://localhost:5005

# Server-side only
API_INTERNAL_URL=http://localhost:5005
```

### Checklist

- Use `@repo/internal-api` for Elysia backend calls
- Use `@repo/fetch` for external APIs
- Use TanStack Query for client-side fetching
- Forward cookies in server-side calls with `getCookies`
- Authentication is managed by better-auth (no manual refresh token logic)
