import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === '/login';

  // 1. Jika belum login dan membuka halaman dashboard -> arahkan ke /login
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // 2. Jika sudah login dan mencoba membuka /login -> kembalikan ke dashboard /
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
});

// Jalankan middleware untuk halaman root (dashboard) dan /login
export const config = {
  matcher: ['/', '/login'],
};
