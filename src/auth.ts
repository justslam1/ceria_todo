import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { isUserAdmin } from '@/lib/admin';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (session.user) {
        try {
          const dbUser = session.user.id
            ? await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { role: true, isSuspended: true },
              })
            : null;
          session.user.isAdmin = isUserAdmin(session.user.email, dbUser?.role);
          session.user.isSuspended = !!dbUser?.isSuspended;
          session.user.role = dbUser?.role || 'USER';
        } catch {
          session.user.isAdmin = isUserAdmin(session.user.email);
          session.user.isSuspended = false;
          session.user.role = 'USER';
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  trustHost: true,
  pages: {
    signIn: '/login',
  },
});
