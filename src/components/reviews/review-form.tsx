"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Leave a review for one contact.
 *
 * Collapsed to a single "Leave a review" button until clicked. The contacts
 * page is a list, and five expanded forms stacked down it would bury the
 * contact details people actually came for.
 *
 * Rating is required, everything else is one field. Each additional required
 * field costs completions, and a directory with no reviews is worth less than
 * one with short reviews.
 */
export function ReviewForm({
  leadId,
  professionalName,
}: {
  leadId: string;
  professionalName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (rating === 0) {
      toast.error("Pick a star rating first.");
      return;
    }
    if (body.trim().length < 10) {
      toast.error("Tell us a bit more — at least a sentence.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, rating, title: title.trim(), body: body.trim() }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(payload?.error ?? "Couldn't save your review.");
        return;
      }

      toast.success("Thanks — your review is live.");
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
      <div className="border-t pt-3">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Star className="size-3.5" />
          Leave a review
        </Button>
      </div>
    );
  }

  const shown = hovered || rating;

  return (
    <form onSubmit={submit} className="grid gap-3 border-t pt-3">
      <div>
        <span className="text-sm font-medium">
          How did {professionalName.split(" ")[0]} do?
        </span>
        <div className="mt-1.5 flex gap-0.5" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              className="p-0.5"
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              aria-pressed={rating === star}
            >
              <Star
                className={cn(
                  "size-6 transition-colors",
                  star <= shown
                    ? "fill-gold text-gold"
                    : "text-muted-foreground/40",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Sum it up (optional)"
        maxLength={120}
      />

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What was the job, and how did it go? Anything that would help the next person decide."
        rows={4}
        maxLength={2000}
        required
      />

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Posting…" : "Post review"}
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

      <p className="text-muted-foreground text-xs">
        Your review shows publicly as your first name and last initial.
      </p>
    </form>
  );
}
