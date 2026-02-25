# Copilot Instructions

This is a Turborepo monorepo using **Bun** exclusively as the runtime, package manager, and build tool.

## 📁 Architecture Overview

| App/Package | Description | Port |
|-------------|-------------|------|
| `apps/api` | Elysia.js backend (Bun runtime) with Effect-TS | 5005 |
| `apps/client` | Next.js 16 frontend (React 19.2 + React Compiler) | 3000 |
| `packages/internal-api` | Eden Treaty HTTP client for internal API | - |
| `packages/fetch` | Generic HTTP client for external APIs | - |
| `packages/shadcn` | Shared shadcn/ui components (Tailwind CSS v4) | - |
| `packages/typescript-config` | Shared TypeScript configurations | - |

### Infrastructure

Run `docker compose up -d` to start MySQL (port 3306), Redis (port 6379), and Redis Insight (port 5540).

---

## 🚀 Quick Commands

```bash
# Development
bun run dev                      # Start all apps
bun run dev --filter=api         # API only
bun run dev --filter=client      # Client only

# Linting & Build
bun run lint                     # Biome check + TypeScript validation
bun run format                   # Biome format
bun run build                    # Validate entire monorepo

# Database (run from apps/api)
cd apps/api
bun run db:generate              # Generate Prisma Client
bun run db:migrate               # Create migration (dev only)
bun run db:seed                  # Seed database
bun run db:reset                 # Reset and reseed (⚠️ dev only)

# Package Management
bunx taze -r                     # Check outdated deps
bunx taze -r --interactive       # Upgrade deps interactively
bun run clean-deps               # Remove node_modules, .turbo, .next
```

---

## 📚 Detailed Instructions

For comprehensive development guidelines, refer to:

| File | Scope | Description |
|------|-------|-------------|
| ⭐ [quality.instructions.md](instructions/quality.instructions.md) | `**` | **MUST READ** - Quality gates, file & directory structure, pre-submission checklist |
| [backend.instructions.md](instructions/backend.instructions.md) | `apps/api/**` | HSR architecture, Effect-TS patterns, Elysia handlers |
| [database.instructions.md](instructions/database.instructions.md) | `apps/api/**` | Prisma multi-file schema, migrations, model templates |
| [frontend.instructions.md](instructions/frontend.instructions.md) | `apps/client/**` | React patterns, performance rules, Next.js & Tailwind v4 specifics |
| [api-integration.instructions.md](instructions/api-integration.instructions.md) | `**` | Internal/external API clients, cookie-based auth |

---

## 📋 Task Confirmation (Required)

Before starting any implementation, **always present a bilingual summary and wait for confirmation**:

```
📋 Task Summary / สรุปงานที่จะทำ:
- [Main objective / วัตถุประสงค์หลัก]
- [Steps to complete / ขั้นตอนที่จะทำ]
- [Files to modify/create / ไฟล์ที่จะแก้ไข/สร้าง]

⏸️ Waiting for confirmation... (พิมพ์ "ok" หรือ "ลุย" เพื่อเริ่ม)
```

---

## ⚡ Critical Rules Summary

1. **Bun only** - Never use npm/yarn/pnpm
2. **No barrel files** in features - Direct imports only for tree-shaking
3. **React.memo mandatory** - All components with props must use `memo`
4. **Effect-TS** - All backend errors use `Data.TaggedError`
5. **HSR pattern** - Handler → Service → Repository for backend
6. **Do not proceed until user confirms** - Wait for explicit approval before implementation
7. **Check for deprecated functions** - Always verify functions are not deprecated before using
8. **Remove unused code** - Delete all unused functions, variables, and types
9. **Silent execution** - NO summaries, NO reasoning, NO explanations during task execution
10. **Completion signal** - After completing all tasks AND passing all checks, run command `say finished task`

---

## 🔧 Biome Configuration

- Line width: 80 characters
- Quote style: single quotes (JS/TS), double quotes (CSS/JSX)
- Semicolons: always
- Trailing commas: es5
- Indent: 2 spaces

---

## ✅ Pre-Submission Checklist

See [quality.instructions.md](instructions/quality.instructions.md) for the full checklist and gates.

