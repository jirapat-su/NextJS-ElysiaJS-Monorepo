import { Elysia } from 'elysia';
import { appStatusHandler } from './appStatus/appStatus.handler';
import { healthCheckHandler } from './healthCheck/healthCheck.handler';

export const generalRouter = new Elysia({
  name: 'general.router',
  tags: ['General'],
  detail: {
    description: 'General application endpoints',
    tags: ['General'],
  },
})
  .use(appStatusHandler)
  .use(healthCheckHandler);
