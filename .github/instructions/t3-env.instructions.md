---
applyTo: 'apps/api/**, apps/web/**'
---

# T3 Env - Typesafe Environment Variables

> Validated environment variables with type safety using Zod and t3-env

## Overview

T3 Env provides a simple way to define and validate environment variables with full type safety. It prevents runtime errors from missing or invalid environment variables and ensures server-only variables are never accessed on the client.

## Key Benefits

- ✅ **Type Safety**: Full TypeScript support with autocomplete
- 🔒 **Runtime Validation**: Validates at build/startup time
- 🛡️ **Security**: Prevents server vars from leaking to client
- 🎯 **DX**: Clear error messages for missing/invalid vars
- 🚀 **Framework Agnostic**: Works with Next.js, Node.js, Bun, etc.

## Installation

```bash
# For Next.js (apps/web)
bun add @t3-oss/env-nextjs zod

# For Node/Bun API (apps/api)
bun add @t3-oss/env-core zod
```

## Usage for Next.js (apps/web)

### Basic Setup

```ts
// apps/web/src/env.ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables
   * Will throw if accessed on the client
   */
  server: {
    DATABASE_URL: z.string().url(),
    STRIPE_SECRET_KEY: z.string().min(1),
    OPENAI_API_KEY: z.string().min(1),
  },

  /**
   * Client-side environment variables
   * MUST be prefixed with NEXT_PUBLIC_
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  },

  /**
   * Shared variables available on both server and client
   * Common for build-time variables
   */
  shared: {
    NODE_ENV: z.enum(["development", "production", "test"]),
  },

  /**
   * Runtime environment variables
   * For Next.js >= 13.4.4, use experimental__runtimeEnv for client vars
   */
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
  },
});
```

### For Next.js < 13.4.4

```ts
// apps/web/src/env.ts
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  // Must destructure ALL variables manually
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
```

### Separate Server/Client Files (Recommended for Sensitive Schemas)

If you consider the **names** of server variables sensitive:

```ts
// apps/web/src/env/server.ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    STRIPE_SECRET_KEY: z.string().min(1),
  },
  experimental__runtimeEnv: process.env,
});
```

```ts
// apps/web/src/env/client.ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
```

## Usage for API/Backend (apps/api)

### Elysia/Bun Setup

```ts
// apps/api/src/env.ts
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

```ts
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side variables (all variables in API)
   */
  server: {
    DATABASE_URL: z.url(),  // ✅ Zod v4 - use z.url() not z.string().url()
    JWT_SECRET: z.string().min(32),
    PORT: z.coerce.number().catch(3000),  // ✅ Use .catch() for defaults with coercion
    REDIS_URL: z.url().optional(),  // ✅ Zod v4
  },

  /**
   * Client-side variables (if API serves a frontend)
   * Must be prefixed with PUBLIC_
   */
  clientPrefix: "PUBLIC_",
  client: {
    PUBLIC_API_URL: z.url(),  // ✅ Zod v4
  },

  /**
   * Runtime environment - use process.env or Bun.env
   */
  runtimeEnv: process.env,

  /**
   * Treat empty strings as undefined
   * Recommended for all new projects
   */
  emptyStringAsUndefined: true,
});
```
```

### Server-Only Mode (No Client Variables)

```ts
// apps/api/src/env.ts
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),  // ✅ Zod v4
    JWT_SECRET: z.string().min(32),
    PORT: z.coerce.number().catch(3000),  // ✅ Use .catch() for defaults
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
```

### With dotenvx Integration

```ts
// apps/api/src/env.ts
import "@dotenvx/dotenvx/config"; // Load encrypted .env first
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),  // ✅ Zod v4
    JWT_SECRET: z.string().min(32),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
```

## Using Environment Variables

```ts
// Import and use with full type safety
import { env } from "./env";

// ✅ Type-safe access with autocomplete
const dbUrl = env.DATABASE_URL;
const port = env.PORT; // number type

// ❌ TypeScript error - variable doesn't exist
const invalid = env.TYPO; // Error!

// ❌ Runtime error - accessing server var on client
// (Only in Next.js with server/client split)
const secret = env.JWT_SECRET; // Throws in browser!
```

## Validation Options

### Zod Schema Examples

```ts
import { z } from "zod";

const envSchema = {
  // Strings
  API_KEY: z.string().min(1),
  API_KEY_OPTIONAL: z.string().optional(),
  
  // URLs - ✅ Zod v4
  DATABASE_URL: z.url(),  // Use z.url() not z.string().url()
  
  // Numbers - ✅ Use .catch() for defaults with coercion
  PORT: z.coerce.number().catch(3000),
  MAX_CONNECTIONS: z.coerce.number().int().positive(),
  
  // Enums
  NODE_ENV: z.enum(["development", "production", "test"]),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]),
  
  // Booleans - ✅ Zod v4 native stringBool
  ENABLE_FEATURE: z.coerce.boolean().catch(false),
  DEBUG: z.stringBool(),  // Native in Zod v4
  
  // Emails - ✅ Zod v4
  ADMIN_EMAIL: z.email(),  // Use z.email() not z.string().email()
  
  // Custom validation
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  
  // Arrays - ✅ Use preprocessing, not .transform()
  ALLOWED_ORIGINS: z.preprocess(
    (val) => typeof val === "string" ? val.split(",") : val,
    z.array(z.url())  // ✅ Zod v4
  ),
};
```

### Default Values

```ts
export const env = createEnv({
  server: {
    // ✅ Use .catch() for defaults with coercion
    PORT: z.coerce.number().catch(3000),
    LOG_LEVEL: z.enum(["debug", "info", "warn"]).catch("info"),
    ENABLE_CACHE: z.coerce.boolean().catch(true),
  },
  runtimeEnv: process.env,
});
```

### Optional Variables

```ts
export const env = createEnv({
  server: {
    REDIS_URL: z.url().optional(),  // ✅ Zod v4
    SENTRY_DSN: z.string().optional(),
    // Use nullish for nullable
    CUSTOM_VAR: z.string().nullish(),
  },
  runtimeEnv: process.env,
});
```

## Advanced Features

### Custom Error Handling

```ts
export const env = createEnv({
  server: { /* ... */ },
  runtimeEnv: process.env,
  
  // Custom validation error handler
  onValidationError: (issues) => {
    console.error("❌ Invalid environment variables:");
    issues.forEach((issue) => {
      console.error(`  - ${issue.path?.join(".")}: ${issue.message}`);
    });
    throw new Error("Environment validation failed");
  },
  
  // Custom client access error handler
  onInvalidAccess: (variable) => {
    throw new Error(
      `🚫 Cannot access server variable "${variable}" on client`
    );
  },
});
```

### Server Detection

```ts
export const env = createEnv({
  server: { /* ... */ },
  client: { /* ... */ },
  clientPrefix: "PUBLIC_",
  runtimeEnv: process.env,
  
  // Custom server detection
  isServer: typeof window === "undefined",
});
```

### Skip Validation (Development Only)

```ts
// ⚠️ Use with caution - only for local development
export const env = createEnv({
  server: { /* ... */ },
  runtimeEnv: process.env,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
```

### Empty String as Undefined

```ts
export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(3000),
  },
  runtimeEnv: process.env,
  
  // Treats PORT="" as undefined, applies default
  emptyStringAsUndefined: true,
});
```

### Schema Refinement

```ts
export const env = createEnv({
  server: {
    SKIP_AUTH: z.boolean().optional(),
    EMAIL: z.string().email().optional(),
    PASSWORD: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  
  // Further refinement
  createFinalSchema: (shape) =>
    z.object(shape).refine(
      (env) => {
        if (env.SKIP_AUTH) return true;
        return env.EMAIL && env.PASSWORD;
      },
      {
        message: "EMAIL and PASSWORD required when SKIP_AUTH is false",
      }
    ),
});
```

## Common Patterns

### Database URLs

```ts
server: {
  DATABASE_URL: z.url(),  // ✅ Zod v4
  // Postgres-specific validation - ✅ Use .refine() for additional checks
  POSTGRES_URL: z.url().refine(url => url.startsWith("postgresql://"), {
    message: "Must be a PostgreSQL URL"
  }),
  // With connection pooling
  DATABASE_URL_POOLED: z.url().optional(),  // ✅ Zod v4
}
```

### API Keys and Secrets

```ts
server: {
  // Minimum length
  JWT_SECRET: z.string().min(32),
  // Specific format
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  // Optional third-party
  OPENAI_API_KEY: z.string().startsWith("sk-").optional(),
}
```

### Multiple Environments

```ts
// .env.development
DATABASE_URL=postgresql://localhost:5432/dev

// .env.production
DATABASE_URL=postgresql://prod-server:5432/prod

// env.ts - same schema works for both
server: {
  DATABASE_URL: z.string().url(),
}
```

### Feature Flags

```ts
server: {
  // ✅ Use .catch() for defaults with coercion
  ENABLE_AI_FEATURES: z.coerce.boolean().catch(false),
  ENABLE_ANALYTICS: z.coerce.boolean().catch(true),
  ENABLE_BETA_UI: z.coerce.boolean().catch(false),
}
```

## Integration with Turborepo

### Root Environment File

```bash
# Root .env for shared variables
TURBO_TOKEN=xxx
TURBO_TEAM=xxx
```

### App-Specific Environment Files

```bash
# apps/web/.env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://localhost:5432/web

# apps/api/.env.local
PORT=3001
DATABASE_URL=postgresql://localhost:5432/api
JWT_SECRET=xxx
```

### Validate on Build

```json
// apps/web/package.json
{
  "scripts": {
    "build": "node -r ./src/env.ts next build"
  }
}

// apps/api/package.json
{
  "scripts": {
    "build": "bun run src/env.ts && bun build ./src/index.ts"
  }
}
```

## Error Examples

### Missing Required Variable

```
❌ Invalid environment variables:
  - DATABASE_URL: Required
```

### Invalid Format

```
❌ Invalid environment variables:
  - DATABASE_URL: Invalid url
  - PORT: Expected number, received nan
```

### Client Variable Without Prefix

```ts
client: {
  // ❌ Error: CLIENT_URL is not prefixed with NEXT_PUBLIC_
  CLIENT_URL: z.string().url(),
  
  // ✅ Correct
  NEXT_PUBLIC_CLIENT_URL: z.string().url(),
}
```

### Accessing Server Variable on Client

```
❌ Attempted to access a server-side environment variable on the client
Error accessing: DATABASE_URL
```

## Best Practices

### ✅ DO

```ts
// ✅ Use Zod v4 top-level formats
DATABASE_URL: z.url()  // NOT z.string().url()
ADMIN_EMAIL: z.email()  // NOT z.string().email()

// ✅ Add helpful error messages
JWT_SECRET: z.string().min(32, "Must be at least 32 chars for security")

// ✅ Use appropriate types
PORT: z.coerce.number().int().positive()

// ✅ Use .catch() for defaults with coercion
LOG_LEVEL: z.enum(["debug", "info", "warn"]).catch("info")

// ✅ Validate at app startup
import "./env"; // Top of main file

// ✅ Use emptyStringAsUndefined
emptyStringAsUndefined: true

// ✅ Use z.stringBool() for boolean env vars
DEBUG: z.stringBool()  // Native in Zod v4
```

### ❌ DON'T

```ts
// ❌ Don't use deprecated Zod v3 APIs
DATABASE_URL: z.string().url()  // Use z.url()
ADMIN_EMAIL: z.string().email()  // Use z.email()

// ❌ Don't use .default() with coercion/pipes
PORT: z.coerce.number().default(3000)  // Use .catch(3000)

// ❌ Don't use .transform() for validation
VALUE: z.string().transform(val => val.split(','))  // Use preprocessing

// ❌ Don't use loose validation
API_KEY: z.string() // No min length

// ❌ Don't skip validation in production
skipValidation: true // Only for development!

// ❌ Don't access process.env directly
const url = process.env.DATABASE_URL; // Use env.DATABASE_URL

// ❌ Don't mix server/client in same import on client
import { env } from "./env"; // env.SERVER_VAR throws on client

// ❌ Don't commit secrets to .env files
JWT_SECRET=hardcoded-secret // Use dotenvx encryption!
```

## Troubleshooting

### Type Errors After Adding New Variables

```bash
# Restart TypeScript server
# VS Code: Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

### Variables Not Loading

```ts
// Check runtimeEnv is correct
runtimeEnv: process.env, // Node.js
runtimeEnv: Bun.env,     // Bun
runtimeEnv: import.meta.env, // Vite/Astro
```

### Build Fails with Missing Variables

```bash
# Ensure .env files are loaded before validation
# Use dotenvx for encrypted vars
dotenvx run -- bun run build
```

## Migration from Plain process.env

### Before

```ts
// ❌ No validation, no types
const dbUrl = process.env.DATABASE_URL;
const port = parseInt(process.env.PORT || "3000");
```

### After

```ts
// ✅ Validated, typed, with defaults (Zod v4)
import { env } from "./env";

const dbUrl = env.DATABASE_URL; // string (validated URL via z.url())
const port = env.PORT;          // number (with default via .catch())
```

## Resources

- [T3 Env Documentation](https://env.t3.gg)
- [Standard Schema Spec](https://standardschema.dev)
- [Zod Documentation](https://zod.dev)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

## Summary

1. **Install**: `@t3-oss/env-nextjs` or `@t3-oss/env-core` + `zod`
2. **Define**: Create `env.ts` with server/client schemas
3. **Validate**: Import env file at app startup
4. **Use**: Access via `env.VARIABLE_NAME` with type safety
5. **Secure**: Server vars never leak to client
6. **Combine**: Works seamlessly with dotenvx encryption

T3 Env provides the best developer experience for managing environment variables with full type safety and runtime validation.
