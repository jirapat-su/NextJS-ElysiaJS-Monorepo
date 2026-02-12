import { Elysia } from 'elysia';
import { HEALTH_CHECK_RESPONSE_SCHEMA } from './healthCheck.schema';

export const healthCheckHandler = new Elysia({
  name: 'healthCheck.handler',
}).get(
  '/health',
  ({ status }) => {
    return status(200, {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  },
  {
    response: {
      200: HEALTH_CHECK_RESPONSE_SCHEMA,
    },
    detail: {
      summary: 'Health check',
      description: 'Returns application health status',
    },
  }
);
