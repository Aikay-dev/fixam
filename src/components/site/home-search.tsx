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
      className="mx-auto flex max-w-xl gap-2"
    >
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Plumber, AC repair, POP, generator…"
        aria-label="What do you need done?"
        className="h-12 border-white/20 bg-white text-base text-neutral-900 placeholder:text-neutral-500"
      />
      <Button
        type="submit"
        size="lg"
        className="bg-gold hover:bg-gold/90 text-navy-deep h-12 shrink-0"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search</span>
      </Button>
    </form>
  );
}
