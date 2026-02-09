import { randomUUID } from 'node:crypto';
import Elysia from 'elysia';
import { SYSTEM_CONFIG } from '../../constants/system';

export const requestIDPlugin = new Elysia({
  name: 'request-id-plugin',
})
  .onRequest(({ set, request: { headers } }) => {
    set.headers[SYSTEM_CONFIG.REQUEST_ID_HEADER] =
      headers.get(SYSTEM_CONFIG.REQUEST_ID_HEADER) || randomUUID();
  })
  .as('global');
