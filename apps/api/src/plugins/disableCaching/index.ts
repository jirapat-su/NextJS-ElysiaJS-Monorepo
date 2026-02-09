import Elysia from 'elysia';

export const disableCachingPlugin = new Elysia({
  name: 'disable-caching-plugin',
})
  .onRequest(({ set }) => {
    set.headers['Surrogate-Control'] = 'no-store';
    set.headers['Cache-Control'] =
      'no-store, no-cache, must-revalidate, proxy-revalidate';
    set.headers.Pragma = 'no-cache';
    set.headers.Expires = '0';
  })
  .as('global');
