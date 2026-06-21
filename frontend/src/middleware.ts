import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('tresbros_token')?.value;
  const url = request.nextUrl.clone();

  // Protect /admin routes and /pos route
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/pos')) {
    if (!token) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from /login
  if (url.pathname === '/login' || url.pathname === '/') {
    if (token) {
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Default redirect root to login if no token
  if (url.pathname === '/') {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/pos/:path*', '/login']
};
