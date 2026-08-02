"use client";

import { BadgeCheck, Check, Loader2, X } from "lucide-react";
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

type Action =
  | "approve"
  | "reject"
  | "verify"
  | "unverify"
  | "suspend"
  | "unsuspend";

/**
 * Moderation controls.
 *
 * Reject and suspend force a written reason, because it is emailed verbatim
 * to the professional. "Rejected" with no explanation just loses them.
 */
export function ArtisanActions({
  id,
  status,
  isVerified,
}: {
  id: string;
  status: string;
  isVerified: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [dialog, setDialog] = useState<"reject" | "suspend" | null>(null);
  const [reason, setReason] = useState("");

  async function run(action: Action, withReason?: string) {
    setBusy(action);
    try {
      const response = await fetch(`/api/admin/artisans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: withReason }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(body.error ?? "That didn't work.");
        return;
      }

      const messages: Record<Action, string> = {
        approve: "Approved — they're live and have been emailed.",
        reject: "Sent back with your notes.",
        verify: "Verified badge granted.",
        unverify: "Verified badge removed.",
        suspend: "Profile suspended.",
        unsuspend: "Returned to the review queue.",
      };

      toast.success(messages[action]);
      setDialog(null);
      setReason("");
      router.refresh();
    } catch {
      toast.error("Network problem. Try again.");
    } finally {
      setBusy(null);
    }
  }

  const pending = status === "pending_review";
  const approved = status === "approved";
  const suspended = status === "suspended";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {(pending || status === "rejected") && !suspended ? (
          <Button size="sm" onClick={() => run("approve")} disabled={busy !== null}>
            {busy === "approve" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            Approve
          </Button>
        ) : null}

        {pending ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialog("reject")}
            disabled={busy !== null}
          >
            <X className="size-3.5" />
            Send back
          </Button>
        ) : null}

        {approved ? (
          <Button
            size="sm"
            variant={isVerified ? "outline" : "secondary"}
            onClick={() => run(isVerified ? "unverify" : "verify")}
            disabled={busy !== null}
          >
            <BadgeCheck className="size-3.5" />
            {isVerified ? "Remove badge" : "Give verified badge"}
          </Button>
        ) : null}

        {suspended ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => run("unsuspend")}
            disabled={busy !== null}
          >
            Lift suspension
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setDialog("suspend")}
            disabled={busy !== null}
          >
            Suspend
          </Button>
        )}
      </div>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "reject" ? "Send back for changes" : "Suspend profile"}
            </DialogTitle>
            <DialogDescription>
              {dialog === "reject"
                ? "This is emailed to the professional word for word. Be specific about what to change so they can fix it in one go."
                : "The professional will be removed from the directory and told why."}
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={600}
            placeholder={
              dialog === "reject"
                ? "Your photos show finished work but we couldn't see a clear photo of you. Customers contact people, not logos — please add one."
                : "Reason for suspension…"
            }
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => run(dialog === "reject" ? "reject" : "suspend", reason)}
              disabled={reason.trim().length < 10 || busy !== null}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {dialog === "reject" ? "Send back" : "Suspend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
