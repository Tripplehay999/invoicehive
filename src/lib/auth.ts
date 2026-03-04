import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        // Update lastLoginAt
        await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          businessName: user.businessName,
          role: user.role,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    newUser: "/register",
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user) {
        // First Google sign-in — look up or create our DB user record
        const [existing] = await db
          .select({ id: users.id, businessName: users.businessName, role: users.role })
          .from(users)
          .where(eq(users.email, user.email!))
          .limit(1);

        if (existing) {
          token.id = existing.id;
          token.businessName = existing.businessName;
          token.role = existing.role;
          // Update lastLoginAt for Google users
          await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, existing.id));
        } else {
          const [created] = await db
            .insert(users)
            .values({ name: user.name ?? "", email: user.email!, businessName: "" })
            .returning({ id: users.id, role: users.role });
          token.id = created.id;
          token.businessName = "";
          token.role = created.role;
        }
      } else if (user) {
        // Credentials login — id comes directly from authorize()
        token.id = user.id;
        token.businessName = (user as { businessName?: string }).businessName;
        token.role = (user as { role?: string }).role ?? "user";
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { businessName?: string }).businessName = token.businessName as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
