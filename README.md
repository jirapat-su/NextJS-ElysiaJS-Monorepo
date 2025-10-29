# Monorepo

Turborepo monorepo with Bun runtime, configured with Biome for linting and formatting.

## Apps

- **api** (`apps/api`): Backend API using Elysia, Effect, Zod, and Prisma
  - Runs on http://localhost:3001
  - Technologies: Elysia, Effect, Zod, Prisma, PostgreSQL

- **web** (`apps/web`): Frontend web app using Next.js 16, Material-UI, and Zod
  - Runs on http://localhost:3000
  - Technologies: Next.js 16, MUI v6, Zod, Emotion

## Packages

- **@repo/typescript-config**: Shared TypeScript configurations
  - `base.json` - Base configuration
  - `nextjs.json` - Next.js specific configuration
  - `node.json` - Node/Bun specific configuration

## Tech Stack

- **Runtime**: Bun (NO Node.js)
- **Monorepo**: Turborepo
- **Linter/Formatter**: Biome (NO ESLint/Prettier)
- **Type Safety**: TypeScript
- **Validation**: Zod v4

## Getting Started

1. Install dependencies:
```bash
bun install
```

2. Setup API database (if using Prisma):
```bash
cd apps/api
cp .env.example .env
# Edit .env with your database connection string
bun db:generate
bun db:push
```

3. Start development for all apps:
```bash
bun dev
```

Or start individual apps:
```bash
# API only
cd apps/api && bun dev

# Web only
cd apps/web && bun dev
```

## Available Scripts

### Root Level
- `bun dev` - Start all apps in development mode
- `bun build` - Build all apps
- `bun lint` - Lint all apps with Biome
- `bun run format` - Format all apps with Biome
- `bun run type-check` - Type check all apps

### API App (`apps/api`)
- `bun dev` - Start API server with hot reload (port 3001)
- `bun build` - Build for production
- `bun start` - Start production server
- `bun db:generate` - Generate Prisma client
- `bun db:push` - Push database schema
- `bun db:studio` - Open Prisma Studio

### Web App (`apps/web`)
- `bun dev` - Start Next.js dev server (port 3000)
- `bun build` - Build for production
- `bun start` - Start production server

## Project Structure

```
.
├── apps/
│   ├── api/              # Elysia + Effect + Prisma API
│   │   ├── src/
│   │   ├── prisma/
│   │   └── package.json
│   └── web/              # Next.js 16 + MUI web app
│       ├── src/
│       │   └── app/
│       └── package.json
├── packages/
│   └── typescript-config/ # Shared TypeScript configs
├── biome.json            # Biome configuration
├── turbo.json            # Turborepo configuration
└── package.json          # Root package.json
```

## Key Features

✅ Turborepo for efficient monorepo management  
✅ Bun runtime (faster than Node.js)  
✅ Biome for linting and formatting (replaces ESLint + Prettier)  
✅ TypeScript for type safety  
✅ Zod v4 for schema validation  
✅ Shared TypeScript configurations  
✅ Hot reload for all apps  

## Notes

- This project uses **Bun** exclusively - no Node.js dependencies
- **Biome** is used instead of ESLint and Prettier for better performance
- Both apps use **Zod v4** for schema validation
- API uses **Effect** for functional programming patterns
- Web uses **Next.js 16** with App Router and **MUI v6**

