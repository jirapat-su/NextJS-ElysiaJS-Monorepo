# GitHub Copilot Instructions

This file provides context and guidelines for GitHub Copilot when working with this repository.

## 🚨 CRITICAL RULES

**Summarize** - Present task summary in Thai/English:

```
📋 Task Summary / สรุปงานที่จะทำ:
- [Main objective]
- [Steps to complete]
- [Files to modify/create]
- [Expected outcome]

⏸️ Waiting for confirmation... (พิมพ์ "ok" หรือ "ลุย" เพื่อเริ่ม)
```

**Wait** - Do not proceed until user confirms

**After confirmation** - Silent execution:
- Execute tasks directly without explaining what you're doing
- Skip all reasoning and planning commentary
- Provide only essential output (errors, results, confirmations)
- No verbose descriptions of actions taken

## Project Overview

This is a **Turborepo monorepo** containing:
- **API** (apps/api): Backend API built with Elysia, Effect-TS, and Prisma
- **Web** (apps/web): Frontend built with Next.js and Material-UI
- **Shared packages**: TypeScript configurations

## Tech Stack

### Backend (apps/api)
- **Runtime**: Bun
- **Framework**: Elysia
- **Effect Management**: Effect-TS
- **Database**: Prisma ORM
- **Environment Variables**: dotenvx
- **Code Quality**: Biome

### Frontend (apps/web)
- **Framework**: Next.js (App Router)
- **UI Library**: Material-UI (MUI)
- **Styling**: Emotion
- **TypeScript**: Strict mode enabled

### Monorepo Tools
- **Package Manager**: Bun workspaces
- **Build System**: Turborepo
- **Linter/Formatter**: Biome

## Code Style Guidelines

### General
- Use **TypeScript** for all code
- Follow **strict TypeScript** configuration
- Use **functional programming** patterns where possible
- Prefer **immutability** and **pure functions**
- **CRITICAL**: Never write files exceeding **350 lines of code**
  - If a file approaches this limit, split it into smaller modules
  - Use proper separation of concerns
  - Extract reusable logic into separate files
- **Always use tree-shakable imports** (named imports only)
  - ✅ Good: `import { Component } from 'library'`
  - ❌ Bad: `import * as Library from 'library'`
  - ❌ Bad: `import Library from 'library'` (unless it's the only export)
- **Read relevant documentation first** before starting any task
  - Check `.github/instructions/` for tool-specific guidelines
  - Understand the patterns and best practices for the technology you're working with
  - Reference the instruction files for Bun, Effect-TS, Elysia, Prisma, Next.js, MUI, etc.
- **CRITICAL**: Before completing any task, always run `bun run lint` and fix all issues
  - Never submit work with linting errors
  - Ensure all code passes Biome checks
  - Fix formatting and code quality issues before delivery
- **Never use deprecated functions or APIs**
  - Always use the latest stable APIs
  - Check documentation for deprecated warnings
  - Upgrade to modern alternatives
- **No commented-out code** - Delete unused code instead of commenting
  - Exception: Use **JSDoc** for all functions with specific business logic
  - JSDoc must include `@param`, `@returns`, and description
  - Example:
    ```typescript
    /**
     * Calculate user's total points based on activities
     * @param userId - The unique identifier of the user
     * @param activities - Array of user activities
     * @returns Total points calculated
     */
    function calculatePoints(userId: string, activities: Activity[]): number {
      // implementation
    }
    ```

### Backend (Elysia + Effect-TS)
- Use **Effect-TS** for error handling and side effects
- Follow **Effect-TS** best practices (pipes, layers, services)
- Use **Elysia** decorators and plugins appropriately
- Keep routes clean and delegate logic to services

### Validation (Zod)
- **CRITICAL**: Never use `z.transform()` for data transformation
  - ❌ Bad: `z.string().transform((val) => val.split(','))`
  - ✅ Good: Use **Zod Codecs** (custom schema types) instead for transformations
- Use Zod only for **validation**, not transformation
- For complex transformations, create custom Zod schemas or use preprocessing
- Example with Zod Codecs:
  ```typescript
  import { z } from 'zod'
  
  // Create a custom codec for comma-separated strings
  const CommaSeparatedArray = z.string().pipe(
    z.custom<string[]>((val) => {
      if (typeof val !== 'string') return false
      return true
    }).transform((val) => val.split(','))
  )
  
  // Or use preprocess for safer approach
  const CommaSeparatedArray = z.preprocess(
    (val) => typeof val === 'string' ? val.split(',') : val,
    z.array(z.string())
  )
  ```

### Frontend (Next.js + MUI)
- Use **Next.js App Router** conventions
- Prefer **Server Components** by default
- Use **"use client"** directive only when needed
- Follow **MUI theming** system (see src/theme.ts)

### Database (Prisma)
- Define schemas in `apps/api/prisma/schema.prisma`
- Use **Prisma migrations** for schema changes
- Follow Prisma naming conventions

## Environment Variables

- Use **dotenvx** for environment variable management
- Follow the patterns in `DOTENVX_GUIDE.md`
- Never commit unencrypted `.env` files
- Use `dotenvx encrypt` for production secrets

## File Structure

```
/
├── apps/
│   ├── api/          # Backend application
│   │   ├── src/      # Source code
│   │   └── prisma/   # Database schema
│   └── web/          # Frontend application
│       └── src/      # Source code
├── packages/
│   └── typescript-config/  # Shared TS configs
└── .github/
    └── instructions/       # Detailed tool instructions
```

## Common Commands

### Development
```bash
# Install dependencies
bun install

# Run all apps in dev mode
bun dev

# Run specific app
bun dev --filter=api
bun dev --filter=web

# Run with environment variables
dotenvx run -- bun dev
```

### Database
```bash
# Generate Prisma client
cd apps/api
bunx prisma generate

# Run migrations
bunx prisma migrate dev

# Open Prisma Studio
bunx prisma studio
```

### Build & Test
```bash
# Build all apps
bun run build

# Run linter
bun run lint

# Format code
bun run format
```

## Best Practices

### When Suggesting Code

1. **Use Bun APIs** instead of Node.js where applicable
2. **Follow Effect-TS patterns** for backend code
3. **Use MUI components** for frontend UI
4. **Respect TypeScript types** - no `any` types
5. **Keep components small** and focused
6. **Write descriptive comments** for complex logic

### When Working with Files

1. **Check existing patterns** before creating new ones
2. **Follow the monorepo structure** strictly
3. **Update package.json** when adding dependencies
4. **Run type checks** after changes
5. **Use workspace dependencies** with `workspace:*`

### Error Handling

1. **Backend**: Use Effect-TS for error handling
2. **Frontend**: Use error boundaries for React errors
3. **Always handle edge cases** gracefully
4. **Provide meaningful error messages**

## Important References

- Detailed instructions in `.github/instructions/` folder for specific tool documentation
- Current available instruction files include:
  - Bun, dotenvx, Effect-TS, Elysia
  - Material-UI (MUI), Next.js, Prisma
  - Turborepo, Zod
- Always check this directory for the latest tool-specific guidelines before implementing features

## Additional Notes

- This project uses **Bun** as the primary package manager and runtime
- Environment variables are managed with **dotenvx** for security
- The API uses **Effect-TS** for functional programming patterns
- The frontend follows **Next.js App Router** conventions
- All code must pass **Biome** linting and formatting

---

When in doubt, refer to the detailed instruction files in `.github/instructions/` for specific tool documentation.
