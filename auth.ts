import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { decrypt, encrypt } from "@/lib/config/encrypt";

const prisma = new PrismaClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          scope: "public_repo, user:email",
        },
      },
    }),
  ],
  events: {
    async linkAccount({ user, account, profile }) {
      console.log(user);
      console.log(account);
      // Encrypt tokens before saving to database
      if (account.access_token) {
        account.access_token = encrypt(account.access_token);
      }
      if (account.refresh_token) {
        account.refresh_token = encrypt(account.refresh_token);
      }
      // Update the account in the database
      await prisma.account.update({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        data: {
          access_token: account.access_token,
          refresh_token: account.refresh_token,
        },
      });
    },
  },
});
