import path from 'node:path';
import { defineConfig, env } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  migrations: {
    path: path.join(process.cwd(), 'prisma', 'migrations'),
    seed: 'bun ./prisma/seeds/index.ts',
  },
  schema: path.join(process.cwd(), 'prisma'),
  datasource: {
    url: env('DATABASE_URL'),
  },
});
