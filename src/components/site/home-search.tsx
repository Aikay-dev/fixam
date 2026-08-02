"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/constants";

/**
 * Hero search. Deliberately one free-text box rather than a wizard —
 * the whole competitive point is "no form, no sign-up wall, just look".
 */
export function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(
          query.trim()
            ? `${ROUTES.directory}?q=${encodeURIComponent(query.trim())}`
            : ROUTES.directory,
        );
      }}
      className="flex gap-2"
    >
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Plumber, AC repair, POP, generator…"
        aria-label="What do you need done?"
        // Solid white on the photograph rather than a translucent field:
        // glass over a busy image makes placeholder text unreadable, and
        // placeholders still need 4.5:1.
        className="h-13 border-transparent bg-white text-base text-neutral-900 shadow-lg placeholder:text-neutral-500"
      />
      <Button
        type="submit"
        size="lg"
        className="bg-gold hover:bg-gold/90 text-navy-deep h-13 shrink-0 px-6 font-semibold shadow-lg"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search</span>
      </Button>
    </form>
  );
}
