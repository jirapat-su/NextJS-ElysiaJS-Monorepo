import Elysia from 'elysia';
import { extractClientIpAddress, normalizeIpAddress } from './utils';

export const clientIpPlugin = new Elysia({
  name: 'client-ip-plugin',
})
  .derive(({ request, server }) => {
    const extractIpAddress = extractClientIpAddress(request.headers) ?? '';
    const rawIp = server?.requestIP(request)?.address || extractIpAddress;
    const clientIpAddress = normalizeIpAddress(rawIp);
    return { clientIpAddress };
  })
  .as('scoped');
