import cors from '@elysiajs/cors';
import { fromTypes, openapi } from '@elysiajs/openapi';
import { Elysia } from 'elysia';
import z from 'zod';
import * as packageJson from '../package.json';
import { SYSTEM_CONFIG } from './constants/system';
import { env } from './env';
import { appRouter } from './features/router';
import { auth } from './libs/auth';
import { authOpenAPI } from './libs/auth/openapi';
import { logger } from './libs/logger';
import { disableCachingPlugin } from './plugins/disableCaching';
import { rateLimitPlugin } from './plugins/rateLimit';
import { requestIDPlugin } from './plugins/requestID';

const BETTER_AUTH_PATH = '/auth';

const app = new Elysia({ name: 'api-app' })
  .use(requestIDPlugin)
  .use(disableCachingPlugin)
  .use(
    rateLimitPlugin({
      max: 20, // 20 requests
      window: 30000, // 30 seconds
    })
  )
  .use(
    cors({
      origin: env.BETTER_AUTH_TRUSTED_ORIGINS,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        SYSTEM_CONFIG.CLIENT_APP_HEADER,
      ],
    })
  )
  .mount(BETTER_AUTH_PATH, auth.handler)
  .use(appRouter)
  .use(
    openapi({
      mapJsonSchema: {
        zod: z.toJSONSchema,
      },
      documentation: {
        components: await authOpenAPI.components,
        paths: await authOpenAPI.getPaths(BETTER_AUTH_PATH),
        info: {
          title: 'API Documentation',
          version: packageJson.version,
          description: 'API documentation',
        },
      },
      path: '/docs',
      provider: 'scalar',
      references: fromTypes(
        env.NODE_ENV === 'development' ? 'src/index.ts' : 'index.d.mts'
      ),
      specPath: '/docs/json',
      enabled: true,
      exclude: {
        methods: ['all', 'options', 'head'],
      },
    })
  );

function createServer() {
  if (env.VERCEL !== '1') {
    return app.listen(env.PORT, server => {
      logger.info(`🚀 Server ready at ${server.url}`);
    });
  }

  return app;
}

export type ApiType = typeof app;
export default createServer();
