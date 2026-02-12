import z from 'zod';

export const HEALTH_CHECK_RESPONSE_SCHEMA = z.object({
  status: z.string(),
  uptime: z.number(),
  timestamp: z.string(),
});
