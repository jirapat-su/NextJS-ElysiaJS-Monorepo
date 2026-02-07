import { randomUUID } from 'node:crypto';
import type Elysia from 'elysia';
import { SYSTEM_CONFIG } from '../../constants/system';

const requestID = (app: Elysia) =>
  app.onRequest(({ set, request: { headers } }) => {
    set.headers[SYSTEM_CONFIG.REQUEST_ID_HEADER] =
      headers.get(SYSTEM_CONFIG.REQUEST_ID_HEADER) || randomUUID();
  });

export { requestID };
