import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { isUserAdmin } from '@/lib/admin';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === '/login';
  const isAdminPage = req.nextUrl.pathname.startsWith('/admin');
  const isAdminApi = req.nextUrl.pathname.startsWith('/api/admin');
  const isAuthApi = req.nextUrl.pathname.startsWith('/api/auth');
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/');

  // 1. Cek akun yang ditangguhkan (Suspended User)
  if (isLoggedIn && req.auth?.user?.isSuspended && !isAuthApi) {
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, error: 'Akun Anda telah ditangguhkan. Silakan hubungi administrator.' },
        { status: 403 }
      );
    }
    if (!isLoginPage) {
      return NextResponse.redirect(new URL('/login?error=AccountSuspended', req.nextUrl));
    }
  }

  // 2. Proteksi Admin API: harus login dan merupakan admin
  if (isAdminApi) {
    if (!isLoggedIn || !isUserAdmin(req.auth?.user?.email, req.auth?.user?.role)) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Hanya admin yang diizinkan.' },
        { status: 403 }
      );
    }
  }

  // 3. Jika belum login dan membuka halaman admin -> arahkan ke /login
  if (!isLoggedIn && isAdminPage) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // 4. Jika sudah login dan mencoba membuka /login -> kembalikan ke dashboard /
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  // 5. Jika membuka halaman admin tetapi bukan admin -> kembalikan ke /
  if (isAdminPage && !isUserAdmin(req.auth?.user?.email, req.auth?.user?.role)) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
});

// Jalankan middleware untuk halaman root, login, admin, dan API
export const config = {
  matcher: ['/', '/login', '/admin/:path*', '/api/:path*'],
};
