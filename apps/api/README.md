# API App

Backend API built with:
- **Elysia** - Fast web framework for Bun
- **Effect** - Powerful system for building resilient TypeScript applications
- **Zod** - TypeScript-first schema validation
- **Prisma** - Next-generation ORM

## Getting Started

1. Copy the `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the `DATABASE_URL` in `.env` with your PostgreSQL connection string

3. Generate Prisma client:
```bash
bun db:generate
```

4. Push database schema:
```bash
bun db:push
```

5. Start development server:
```bash
bun dev
```

The API will be available at http://localhost:3001

## Available Scripts

- `bun dev` - Start development server with hot reload
- `bun build` - Build for production
- `bun start` - Start production server
- `bun db:generate` - Generate Prisma client
- `bun db:push` - Push schema changes to database
- `bun db:studio` - Open Prisma Studio
