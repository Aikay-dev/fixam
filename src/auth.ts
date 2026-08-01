import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";

import { verifyPassword } from "@/lib/auth/password";
import { ROUTES, type Role } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { env, features } from "@/lib/env";
import { User } from "@/models/user";

/**
 * Auth.js v5.
 *
 * No database adapter on purpose. The adapter's `users` collection would
 * collide with our Mongoose User model and create Google sign-ups that bypass
 * our schema entirely (no roles, no status, no notification prefs). Managing
 * users directly keeps one source of truth and one shape.
 *
 * Sessions are JWT — required anyway by the Credentials provider.
 */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: Role[];
      isVerified: boolean;
      status: string;
    } & DefaultSession["user"];
  }
}

// `next-auth/jwt` is a bare `export *` re-export, so the augmentation has to
// target the module that actually declares the interface.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    roles: Role[];
    isVerified: boolean;
    status: string;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Typed from the config rather than inferred — inference narrows to
// CredentialsConfig from the first element and then rejects the Google provider.
const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;

      const { email, password } = parsed.data;

      await connectDB();

      // passwordHash is `select: false` on the schema, so ask for it.
      const user = await User.findOne({ email: email.toLowerCase() })
        .select("+passwordHash")
        .exec();

      // verifyPassword runs a dummy compare when there is no hash, so a
      // Google-only account takes the same time as a wrong password.
      const valid = await verifyPassword(password, user?.passwordHash);
      if (!user || !valid) return null;

      if (user.status === "suspended") {
        throw new Error("ACCOUNT_SUSPENDED");
      }

      return {
        id: String(user._id),
        email: user.email,
        name: user.name || undefined,
        image: user.image ?? undefined,
      };
    },
  }),
];

if (features.google) {
  providers.push(
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: ROUTES.login,
    error: ROUTES.login,
  },
  trustHost: true,

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      // Only link a Google identity to an existing account when Google itself
      // says the address is verified. Without this check, anyone who can make
      // an OAuth app assert an unverified address could take over an account.
      if (profile && profile.email_verified === false) return false;

      const email = user.email?.toLowerCase();
      if (!email) return false;

      await connectDB();

      const existing = await User.findOne({ email }).exec();

      if (existing) {
        if (existing.status === "suspended") return false;

        await User.updateOne(
          { _id: existing._id },
          {
            $set: {
              // Google verified it, so we accept it as verified here too.
              emailVerified: existing.emailVerified ?? new Date(),
              lastLoginAt: new Date(),
              ...(existing.image ? {} : { image: user.image ?? null }),
              ...(existing.name ? {} : { name: user.name ?? "" }),
            },
            $addToSet: { authProviders: "google" },
          },
        );
      } else {
        await User.create({
          email,
          name: user.name ?? "",
          image: user.image ?? null,
          emailVerified: new Date(),
          roles: ["customer"],
          authProviders: ["google"],
          lastLoginAt: new Date(),
        });
      }

      return true;
    },

    async jwt({ token, user, trigger }) {
      // On first sign-in, or when the client calls `update()`, reload the
      // authoritative record. Roles and status change from the admin panel,
      // and a stale token must not keep a suspended user signed in.
      const shouldRefresh = Boolean(user) || trigger === "update" || !token.id;

      if (shouldRefresh) {
        const email = (user?.email ?? token.email)?.toLowerCase();
        if (email) {
          await connectDB();
          // `.lean()` is required, not just faster: a hydrated document's
          // arrays are Mongoose array instances, and the JWT encoder runs
          // structuredClone over the token, which throws DataCloneError on
          // anything that isn't a plain value.
          const record = await User.findOne({ email }).lean().exec();

          if (record) {
            token.id = String(record._id);
            token.email = record.email;
            token.name = record.name || null;
            token.picture = record.image ?? null;
            token.roles = [...record.roles] as Role[];
            // Named isVerified, not emailVerified: Auth.js already declares
            // `emailVerified: Date` on its User type and the two collide.
            token.isVerified = Boolean(record.emailVerified);
            token.status = record.status;
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id;
        session.user.roles = token.roles ?? ["customer"];
        session.user.isVerified = token.isVerified ?? false;
        session.user.status = token.status ?? "active";
      }
      return session;
    },
  },

  events: {
    async signIn({ user }) {
      if (!user.email) return;
      await connectDB();
      await User.updateOne(
        { email: user.email.toLowerCase() },
        { $set: { lastLoginAt: new Date() } },
      ).catch(() => undefined);
    },
  },
});
