import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string | null | undefined,
): Promise<boolean> {
  // Google-only accounts have no password hash. Still run a comparison against
  // a dummy hash so the response time does not reveal which accounts have
  // passwords — otherwise this endpoint becomes an account-type oracle.
  if (!hash) {
    await bcrypt.compare(
      plain,
      "$2a$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012",
    );
    return false;
  }

  return bcrypt.compare(plain, hash);
}
