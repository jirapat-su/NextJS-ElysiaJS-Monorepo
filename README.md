# App Monorepo

A modern full-stack monorepo powered by **Turborepo**, **Bun**, and **Biome**.

## Tech Stack

- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **Monorepo Tool**: [Turborepo](https://turborepo.com/)
- **Linting & Formatting**: [Biome](https://biomejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## What's Inside?

### Apps

| App | Description | Port | Framework |
|-----|-------------|------|-----------|
| `client` | Frontend application | 5006 | [vinext](https://github.com/nicholasgriffintn/vinext) (Vite) + [Next.js](https://nextjs.org/) v16 + React 19 |
| `api` | Backend API server | 5005 | [Elysia](https://elysiajs.com/) + Effect-TS |

### Packages

| Package | Description |
|---------|-------------|
| `@repo/internal-api` | Type-safe HTTP client for internal Elysia API (Eden + Axios) |
| `@repo/fetch` | Generic HTTP client for external APIs |
| `@repo/shadcn` | Shared UI component library (shadcn/ui + Tailwind CSS v4) |
| `@repo/typescript-config` | Shared TypeScript configurations |

## Project Structure

```
App Monorepo/
├── apps/
│   ├── api/                 # Elysia API server (Bun runtime)
│   │   ├── src/
│   │   │   ├── libs/        # Shared libraries (auth, cache, etc.)
│   │   │   ├── plugins/     # Elysia plugins (rateLimit, etc.)
│   │   │   └── features/    # Business logic features
│   │   └── ...
│   └── client/              # Next.js 16 frontend
│       ├── src/
│       │   ├── app/         # Next.js App Router
│       │   ├── components/  # Shared components (ui, layouts, providers)
│       │   └── features/    # Shared feature modules (e.g., Auth, Users)
│       └── ...
├── packages/
│   ├── internal-api/        # Type-safe client for internal API
│   ├── fetch/               # Generic HTTP client for external APIs
│   ├── shadcn/              # Shared UI components
│   │   ├── src/components/ui/   # UI components (Button, etc.)
│   │   ├── src/hooks/           # Shared hooks
│   │   └── src/lib/             # Utilities (cn, etc.)
│   └── typescript-config/   # Shared tsconfig
├── biome.json               # Biome configuration
├── turbo.json               # Turborepo configuration
└── package.json             # Root package configuration
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.3.0 or higher
- [Node.js](https://nodejs.org/) v24 or higher

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd "NextJS-ElysiaJS-Monorepo"

# Install dependencies
bun install
```

### Development

```bash
# Run all apps in development mode
bun run dev

# Run specific app
bun run dev --filter=client      # Frontend only (port 5006)
bun run dev --filter=api         # API only (port 5005)
```

### Infrastructure (Docker)

The project includes a `docker-compose.yml` file to spin up required services like MySQL and Redis.

```bash
# Start all infrastructure services
docker compose up -d

# Stop infrastructure services
docker compose down
```

The following services will be available:
- **MySQL**: `localhost:3306` (User: `root`, Password: `root`)
- **Redis**: `localhost:6379`
- **Redis Insight**: `localhost:5540` (GUI for Redis)

### Database Setup (Prisma)

The API uses Prisma ORM with a **multi-file schema** approach. Schemas are organized in `apps/api/prisma/models/` by domain.

```bash
# Navigate to API directory
cd apps/api

# Generate Prisma Client (runs automatically on postinstall)
bun run db:generate

# Create a new migration
bun run db:migrate

# Apply migrations
bun run db:migrate:deploy

# Seed database with initial data
bun run db:seed

# Reset database (⚠️ Development only - drops all data)
bun run db:reset

# Return to root
cd ../..
```

**Database Models:**
- User management with role-based access (TEACHER/STUDENT)
- Audit logging for user actions
- Multi-file schema organization in `prisma/models/`

### Build

```bash
# Build all apps
bun run build

# Build specific app
bun run build --filter=client
bun run build --filter=api
```

### Linting & Formatting

```bash
# Lint all packages
bun run lint

# Format all packages
bun run format
```

### Dependency Management

```bash
# Check for outdated dependencies
bun run check-deps

# Interactively upgrade dependencies
bun run upgrade-deps

# Clean all node_modules, .turbo, .next, and lock files
bun run clean-deps
```

## Features

### Client (`apps/client`)
- 🚀 **vinext** — Vite-based runner that wraps Next.js, enabling Vite-native dev server and build pipeline on top of Next.js 16
- ⚡ **Next.js 16** with App Router (served via vinext)
- ⚛️ **React 19** with React Compiler enabled
- 🎨 **Tailwind CSS v4** for styling
- 🧩 **shadcn/ui** components from `@repo/shadcn`
- 📁 **Optimized Structure** with `app/`, `features/` (shared), and `components/` (shared)

### API (`apps/api`)
- 🦊 **Elysia** - Bun-first web framework with OpenAPI support
- ⚡ **Effect-TS** - Functional error handling and type-safe side effects
- 🗄️ **Prisma** - Type-safe ORM with multi-file schema organization
- 🔐 **Cookie-based authentication** with automatic token refresh
- 📊 **HSR Architecture** (Handler-Service-Repository pattern)
- 🚀 Hot reload with `bun run --watch`
- 📝 **Audit logging** for user actions
- 🔧 TypeScript support with strict mode
- 🏗️ **Structured Libs & Plugins** for better organization

### Shared Packages
- 📡 **@repo/internal-api** - Type-safe API client for Elysia backend with cookie-based auth
- 🌐 **@repo/fetch** - Generic HTTP client for external/third-party APIs
- 🎨 **@repo/shadcn** - Pre-built UI components with Tailwind CSS v4
- ⚙️ **@repo/typescript-config** - Shared TypeScript configs

## Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started at [vercel.com](https://vercel.com/signup)

Turborepo supports [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share build caches across machines and CI/CD pipelines.

```bash
# Login to Vercel
bunx turbo login

# Link your repo to Remote Cache
bunx turbo link
```

## Documentation

Comprehensive development guides are available in `.github/instructions/`:

| Guide | Description |
|-------|-------------|
| [Backend Guide](/.github/instructions/backend.instructions.md) | HSR architecture, Effect-TS patterns, Prisma multi-file setup |
| [Frontend Guide](/.github/instructions/frontend.instructions.md) | Component patterns, React 19 + Compiler, performance optimization |
| [API Integration](/.github/instructions/api-integration.instructions.md) | Internal API client usage, authentication patterns |
| [Quality Standards](/.github/instructions/quality.instructions.md) | Code quality rules, linting, testing requirements |

**Key Architectural Patterns:**
- **Backend:** HSR (Handler-Service-Repository) with Effect-TS for functional error handling
- **Frontend:** Feature-based structure with React.memo, useCallback, useMemo for performance
- **API Client:** Cookie-based auth with automatic token refresh via `@repo/internal-api`
- **Styling:** Tailwind CSS v4 with shadcn/ui components
- **Database:** Prisma ORM with multi-file schema organization

## Useful Links

- **Turborepo**: [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks) | [Caching](https://turborepo.com/docs/crafting-your-repository/caching) | [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- **vinext**: [GitHub](https://github.com/nicholasgriffintn/vinext) — Vite-based Next.js runner
- **Next.js**: [Documentation](https://nextjs.org/docs) | [App Router](https://nextjs.org/docs/app)
- **Elysia**: [Documentation](https://elysiajs.com/)
- **Effect-TS**: [Documentation](https://effect.website/)
- **Prisma**: [Documentation](https://www.prisma.io/docs)
- **Biome**: [Documentation](https://biomejs.dev/)
- **Bun**: [Documentation](https://bun.sh/docs)
- **Better Auth**: [Documentation](https://www.better-auth.com/docs)

## License

MIT

