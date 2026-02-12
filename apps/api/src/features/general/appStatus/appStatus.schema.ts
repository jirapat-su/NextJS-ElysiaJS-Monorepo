import z from 'zod';

export const APP_STATUS_RESPONSE_SCHEMA = z.object({
  status: z.string(),
  timezone: z.string(),
});
