import '@dotenvx/dotenvx/config'
import { cors } from '@elysiajs/cors'
import { Effect } from 'effect'
import { Elysia } from 'elysia'
import { z } from 'zod'

// Schema example using Zod
const UserSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
})

// Effect example
const getUserEffect = (id: string) =>
  Effect.gen(function* () {
    // Simulated database call
    yield* Effect.sleep('100 millis')
    return {
      id,
      name: 'John Doe',
      email: 'john@example.com',
    }
  })

// Environment variables
const PORT = process.env.PORT || 3001
const NODE_ENV = process.env.NODE_ENV || 'development'
const DATABASE_URL = process.env.DATABASE_URL

export const app = new Elysia()
  .use(cors())
  .get('/', () => ({
    message: 'Hello from Elysia + Effect + Zod!',
    environment: NODE_ENV,
    port: PORT,
  }))
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    databaseConnected: !!DATABASE_URL,
  }))
  .get('/env', () => ({
    environment: NODE_ENV,
    port: PORT,
    hasDatabase: !!DATABASE_URL,
    apiSecretKey: process.env.API_SECRET_KEY ? '***' : undefined,
    jwtSecret: process.env.JWT_SECRET ? '***' : undefined,
  }))
  .post('/users', async ({ body }) => {
    const validated = UserSchema.parse(body)
    return {
      success: true,
      data: validated,
    }
  })
  .get('/users/:id', async ({ params: { id } }) => {
    const user = await Effect.runPromise(getUserEffect(id))
    return user
  })
  .listen(PORT, ({ url }) => {
    console.log(`🦊 Elysia is running at ${url}`)
    console.log(`📦 Environment: ${NODE_ENV}`)
    console.log(`🗄️  Database: ${DATABASE_URL ? 'Connected' : 'Not configured'}`)
  })

