import { getSessionCookie } from 'better-auth/cookies';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ROUTE = {
  ROOT: { PATH: '/' },
  SIGN_IN: { PATH: '/sign-in' },
  TERMS_OF_SERVICE: { PATH: '/terms-of-service' },
} as const;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [ROUTE.SIGN_IN.PATH, ROUTE.TERMS_OF_SERVICE.PATH];

  const isPublicPath = publicRoutes.some(publicRoute =>
    pathname.startsWith(publicRoute)
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

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
