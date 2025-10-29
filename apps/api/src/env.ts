import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']).catch('development'),
    PORT: z.coerce.number().int().positive().catch(3001),
    DATABASE_URL: z.url().optional(),
    API_SECRET_KEY: z.string().min(32).optional(),
    JWT_SECRET: z.string().min(32).optional(),
    ALLOWED_ORIGINS: z.string().catch('http://localhost:3000'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
