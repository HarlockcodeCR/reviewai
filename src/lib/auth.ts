import type { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo admin:repo_hook',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const gh = profile as { login: string; name?: string; avatar_url?: string };
        const githubLogin = gh.login;
        const email = token.email ?? null;

        try {
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { githubLogin },
                ...(email ? [{ email }] : []),
              ],
            },
          });

          if (user) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                githubLogin,
                githubAccessToken: account.access_token ?? null,
                name: token.name ?? user.name,
                image: token.picture ?? user.image,
              },
            });
          } else {
            user = await prisma.user.create({
              data: {
                githubLogin,
                name: token.name ?? githubLogin,
                email,
                image: token.picture ?? null,
                githubAccessToken: account.access_token ?? null,
              },
            });
          }

          token.dbUserId = user.id;
          token.accessToken = account.access_token;
          token.githubLogin = githubLogin;
        } catch (err) {
          console.error('Failed to upsert user during JWT callback:', err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.dbUserId ?? token.sub!;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
};
