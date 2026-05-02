export const dynamic = 'force-dynamic';

import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'https://reviewai-five.vercel.app';

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          // repo scope to read repos, admin:repo_hook to create webhooks
          scope: 'read:user user:email repo admin:repo_hook',
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (user?.id) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'database' },
});

export { handler as GET, handler as POST };
