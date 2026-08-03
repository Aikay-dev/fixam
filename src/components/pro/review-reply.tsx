"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * The professional's public reply to one review.
 *
 * Editable rather than append-only: a reply written while annoyed is the
 * thing most likely to be regretted, and locking it permanently would make
 * replying at all feel risky. The public page shows only the current text.
 */
export function ReviewReply({
  reviewId,
  existing,
}: {
  reviewId: string;
  existing: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(existing ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (body.trim().length < 2) {
      toast.error("Write something first.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(payload?.error ?? "Couldn't save your reply.");
        return;
      }

      toast.success("Your reply is live.");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Network problem. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant={existing ? "ghost" : "outline"}
        onClick={() => setOpen(true)}
      >
        {existing ? "Edit reply" : "Reply publicly"}
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Answer calmly and specifically. The next customer reads this too."
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Saving…" : "Post reply"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
