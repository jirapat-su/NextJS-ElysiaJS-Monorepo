import Elysia from 'elysia';
import { auth } from '../../libs/auth';

export const authenticationPlugin = new Elysia({
  name: 'authentication-plugin',
})
  .derive(async ({ request: { headers } }) => {
    const session = await auth.api.getSession({
      headers,
    });
    return { session };
  })
  .onBeforeHandle(async ({ status, session }) => {
    if (!session) {
      return status(401);
    }
  })
  .as('scoped');
