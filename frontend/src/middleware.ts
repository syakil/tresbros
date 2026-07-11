import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('tresbros_token')?.value;
  const url = request.nextUrl.clone();

  // Protect /admin routes, /pos route, and the root / (our home dashboard)
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/pos') || url.pathname === '/') {
    if (!token) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from /login
  if (url.pathname === '/login') {
    if (token) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/pos/:path*', '/login']
};
