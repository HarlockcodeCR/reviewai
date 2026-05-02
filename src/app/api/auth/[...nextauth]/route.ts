export const dynamic = 'force-dynamic';

import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

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
      session.user.id = user.id;
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'github' && profile) {
        const githubProfile = profile as { login?: string };
        if (githubProfile.login) {
          await prisma.user.update({
            where: { id: user.id! },
            data: { githubLogin: githubProfile.login },
          }).catch(() => { /* ignore if user not yet created */ });
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'database' },
});

export { handler as GET, handler as POST };
