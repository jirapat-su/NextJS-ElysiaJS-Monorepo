import Elysia from 'elysia';
import { env } from '../../env';

export const generalRouter = new Elysia({
  name: 'general.router',
  tags: ['General'],
  detail: {
    description: 'General application endpoints',
    tags: ['General'],
  },
})
  .get('/health', ({ status }) => {
    return status(200, {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  })
  .get('/', ({ status }) => {
    return status(200, {
      status: 'ok',
      timezone: env.TZ,
    });
  });
