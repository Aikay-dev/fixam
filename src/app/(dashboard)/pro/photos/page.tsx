import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Photos",
  robots: { index: false, follow: false },
};

/**
 * Photos live inside the profile editor rather than a separate screen —
 * splitting them would mean two places to keep in sync for no benefit.
 */
export default function ProPhotosPage() {
  redirect("/pro/profile#photos");
}
