import { fail, ok, serverError } from "@/lib/api";
import { authenticateRequest } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { sendWelcomeArtisanEmail } from "@/lib/email/mailers";
import { User } from "@/models/user";

/**
 * Add the artisan role to an existing account.
 *
 * Roles are an array precisely so this is possible: somebody who signed up to
 * hire a plumber may well be an electrician themselves, and making them
 * create a second account with a second email would be absurd.
 *
 * Adding the role grants nothing publicly — the profile still starts as a
 * draft and still needs admin approval before any customer can see it.
 */
export async function POST() {
  const auth = await authenticateRequest({ requireVerified: true });

  if (!auth.ok) {
    const messages: Record<string, string> = {
      unauthenticated: "Sign in first.",
      unverified: "Verify your email address before listing your services.",
      suspended: "This account has been suspended.",
    };
    return fail(
      auth.status,
      messages[auth.reason] ?? "You can't do that.",
      auth.reason,
    );
  }

  try {
    await connectDB();

    // Read the role from the database, not the session token: the token
    // caches roles for a few minutes, so a second click would otherwise
    // report "not an artisan" and send a duplicate welcome email.
    const record = await User.findById(auth.user.id).select("roles").lean().exec();
    if (!record) return fail(404, "Account not found.", "not_found");

    const alreadyArtisan = record.roles.includes("artisan");

    if (!alreadyArtisan) {
      await User.updateOne(
        { _id: auth.user.id },
        { $addToSet: { roles: "artisan" } },
      );

      sendWelcomeArtisanEmail({
        userId: auth.user.id,
        email: auth.user.email ?? "",
        name: auth.user.name ?? undefined,
      });
    }

    return ok({ ok: true, alreadyArtisan });
  } catch (error) {
    console.error("[become-artisan] failed", error);
    return serverError("Couldn't add artisan access to your account.");
  }
}
