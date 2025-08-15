import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { decrypt, encrypt } from "@/lib/config/encrypt";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.AUTH_GITHUB_ID as string,
      clientSecret: process.env.AUTH_GITHUB_SECRET as string,
      authorization: {
        params: {
          scope: "public_repo user:email",
        },
      },
    }),
  ],
  events: {
    async linkAccount({ user, account, profile }: { user: any; account: any; profile?: any }) {
      const updatedAccount = {
        ...account,
        access_token: account.access_token ? encrypt(account.access_token) : undefined,
        refresh_token: account.refresh_token ? encrypt(account.refresh_token) : undefined,
      };
      await prisma.account.update({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        data: {
          access_token: updatedAccount.access_token,
          refresh_token: updatedAccount.refresh_token,
        },
      });
    },
  },
};

export default NextAuth(authOptions);
