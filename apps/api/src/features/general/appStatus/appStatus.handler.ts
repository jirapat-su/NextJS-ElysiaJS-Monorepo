import { Elysia } from 'elysia';
import { env } from '../../../env';
import { APP_STATUS_RESPONSE_SCHEMA } from './appStatus.schema';

export const appStatusHandler = new Elysia({
  name: 'appStatus.handler',
}).get(
  '/',
  ({ status }) => {
    return status(200, {
      status: 'ok',
      timezone: env.TZ,
    });
  },
  {
    response: {
      200: APP_STATUS_RESPONSE_SCHEMA,
    },
    detail: {
      summary: 'App status',
      description: 'Returns application status and timezone',
    },
  }
);
