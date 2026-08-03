"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/**
 * Hide or restore a review.
 *
 * Hiding forces a written reason. A hidden review is invisible to the public
 * but still visible to the professional and the customer who wrote it, and
 * both will ask why — "a moderator hid it" is not an answer anyone can act on.
 */
export function ReviewActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function run(next: "published" | "hidden", hiddenReason?: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, hiddenReason }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(body.error ?? "That didn't work.");
        return;
      }

      toast.success(next === "hidden" ? "Review hidden." : "Review restored.");
      setDialogOpen(false);
      setReason("");
      router.refresh();
    } catch {
      toast.error("Network problem. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "hidden") {
    return (
      <Button size="sm" variant="outline" disabled={busy} onClick={() => run("published")}>
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
        Restore
      </Button>
    );
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
        <EyeOff className="size-3.5" />
        Hide
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hide this review</DialogTitle>
            <DialogDescription>
              It stops counting towards the rating immediately. The review is
              not deleted — you can restore it.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Why is this being hidden? e.g. abusive language, not about a real job, posted by a competitor."
          />

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              disabled={busy || reason.trim().length < 3}
              onClick={() => run("hidden", reason.trim())}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Hide review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
