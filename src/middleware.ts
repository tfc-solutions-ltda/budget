import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAuthenticated = 
    request.cookies.has('next-auth.session-token') || 
    request.cookies.has('__Secure-next-auth.session-token');
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');

  if (!isAuthenticated && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)'],
}; 