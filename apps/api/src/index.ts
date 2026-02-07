import cors from '@elysiajs/cors';
import { fromTypes, openapi } from '@elysiajs/openapi';
import { Elysia } from 'elysia';
import z from 'zod';
import * as packageJson from '../package.json';
import { SYSTEM_CONFIG } from './constants/system';
import { env } from './env';
import { auth, authOpenAPI } from './libs/auth';
import { logger } from './libs/logger';
import { disableCaching } from './plugins/disableCaching';
import { rateLimitPlugin } from './plugins/rateLimit';
import { requestID } from './plugins/requestID';

const BETTER_AUTH_PATH = '/auth';

const app = new Elysia({ name: 'api-app' })
  .use(requestID)
  .use(disableCaching)
  .use(
    rateLimitPlugin({
      max: 15, // 15 requests
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
  )
  .get('/', () => {
    return {
      status: 'ok',
      timezone: env.TZ,
    };
  });

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
