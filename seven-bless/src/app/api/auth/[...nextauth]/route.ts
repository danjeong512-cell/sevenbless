import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

const handler = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "database" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as any).id = (user as any).id;
        (session.user as any).locale = (user as any).locale;
        (session.user as any).tone = (user as any).tone;
        (session.user as any).channel = (user as any).channel;
        (session.user as any).timezone = (user as any).timezone;
        (session.user as any).sendAt = (user as any).sendAt;
        (session.user as any).phone = (user as any).phone;
      }
      return session;
    },
  },
  pages: {},
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };