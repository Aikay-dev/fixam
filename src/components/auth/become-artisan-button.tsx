"use client";

import { Loader2, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

/**
 * Adds the professional role, then sends the user straight into the profile
 * editor.
 *
 * The `update()` call matters: roles live in the JWT, so without refreshing
 * it the user would be redirected to /pro and bounced straight back out for
 * not being a professional — having just been told they are one.
 */
export function BecomeArtisanButton() {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(false);

  async function activate() {
    setLoading(true);

    try {
      const response = await fetch("/api/me/become-artisan", { method: "POST" });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(body.error ?? "Couldn't set that up. Try again.");
        return;
      }

      // Pull the new role into the session token before navigating.
      await update();

      toast.success("You're set up. Let's build your profile.");
      router.push(ROUTES.proProfile);
      router.refresh();
    } catch {
      toast.error("Network problem. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="lg" onClick={activate} disabled={loading} className="w-full sm:w-auto">
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Setting up…
        </>
      ) : (
        <>
          <Wrench className="size-4" />
          Set up my professional profile
        </>
      )}
    </Button>
  );
}
