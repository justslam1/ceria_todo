import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { isUserAdmin } from '@/lib/admin';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === '/login';
  const isAdminPage = req.nextUrl.pathname.startsWith('/admin');

  // 1. Jika belum login dan membuka halaman admin -> arahkan ke /login
  if (!isLoggedIn && isAdminPage) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // 2. Jika sudah login dan mencoba membuka /login -> kembalikan ke dashboard /
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  // 3. Jika membuka halaman admin tetapi bukan email admin -> kembalikan ke /
  if (isAdminPage && !isUserAdmin(req.auth?.user?.email)) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
});

// Jalankan middleware untuk halaman root (dashboard), /login, dan /admin
export const config = {
  matcher: ['/', '/login', '/admin/:path*'],
};
