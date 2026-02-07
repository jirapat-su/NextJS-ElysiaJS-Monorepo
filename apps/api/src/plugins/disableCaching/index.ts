import type Elysia from 'elysia';

const disableCaching = (app: Elysia) =>
  app.onRequest(({ set }) => {
    set.headers['Surrogate-Control'] = 'no-store';
    set.headers['Cache-Control'] =
      'no-store, no-cache, must-revalidate, proxy-revalidate';
    set.headers.Pragma = 'no-cache';
    set.headers.Expires = '0';
  });

export { disableCaching };
