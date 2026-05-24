import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      companyId?: string;
      companyName?: string;
      companyLogoUrl?: string;
      role?: string;
    } & DefaultSession["user"]
  }
}
