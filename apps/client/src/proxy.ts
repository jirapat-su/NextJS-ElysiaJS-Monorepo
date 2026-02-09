import { getSessionCookie } from 'better-auth/cookies';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = {
  SIGN_IN: '/sign-in',
  TERMS_OF_SERVICE: '/terms-of-service',
} as const;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRouteMatchers = [
    (path: string) => path.startsWith(PUBLIC_ROUTES.SIGN_IN),
    (path: string) => path.startsWith(PUBLIC_ROUTES.TERMS_OF_SERVICE),
  ];

  const isPublicPath = publicRouteMatchers.some(match => match(pathname));

  if (isPublicPath) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: 'app',
  });

  if (!sessionCookie) {
    const signInUrl = new URL('/sign-in', request.url);
    const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    signInUrl.searchParams.set('returnTo', returnTo);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Protect all routes except (public) group
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
