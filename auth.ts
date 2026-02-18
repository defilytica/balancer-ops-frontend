import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/prisma/prisma";
import { encrypt } from "@/lib/config/encrypt";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
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
});
