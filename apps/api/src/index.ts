import { cors } from '@elysiajs/cors'
import { Effect } from 'effect'
import { Elysia } from 'elysia'
import { z } from 'zod'
import { env } from './env'

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

export const app = new Elysia()
  .use(cors())
  .get('/', () => ({
    message: 'Hello from Elysia + Effect + Zod!',
    environment: env.NODE_ENV,
    port: env.PORT,
  }))
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    databaseConnected: !!env.DATABASE_URL,
  }))
  .get('/env', () => ({
    environment: env.NODE_ENV,
    port: env.PORT,
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
  .listen(env.PORT, ({ url }) => {
    console.log(`🦊 Elysia is running at ${url}`)
    console.log(`📦 Environment: ${env.NODE_ENV}`)
  })
