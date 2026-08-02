"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/**
 * Client-side session context.
 *
 * Server components read the session directly via `auth()` and don't need
 * this. It exists for the few client components that must *change* the
 * session — notably adding the `artisan` role, which has to refresh the JWT
 * before navigating, or the user gets bounced out of the dashboard they were
 * just granted access to.
 *
 * `refetchOnWindowFocus` is off deliberately: it fires a request every time
 * someone tabs back, which is wasted data on a Nigerian mobile connection
 * for a session that already refreshes itself server-side.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>
  );
}
