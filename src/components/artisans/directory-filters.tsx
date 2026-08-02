"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };

/**
 * Filters drive the URL, not local state.
 *
 * That keeps every filtered view shareable and crawlable, and means the
 * results are rendered on the server — which matters far more than client
 * interactivity when the page has to be fast on 3G.
 */
export function DirectoryFilters({
  categories,
  states,
  lgas,
}: {
  categories: { group: string; items: Option[] }[];
  states: Option[];
  lgas: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(params.get("q") ?? "");

  function apply(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "" || value === "all") next.delete(key);
      else next.set(key, value);
    }

    // Any filter change invalidates the current page number.
    next.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }

  const active = {
    categoryId: params.get("categoryId"),
    stateId: params.get("stateId"),
    lgaId: params.get("lgaId"),
    minRating: params.get("minRating"),
    verified: params.get("verified") === "1",
    accepting: params.get("accepting") === "1",
    sort: params.get("sort") ?? "recommended",
  };

  const activeCount = [
    active.categoryId,
    active.stateId,
    active.lgaId,
    active.minRating,
    active.verified ? "1" : null,
    active.accepting ? "1" : null,
  ].filter(Boolean).length;

  const clearAll = () =>
    startTransition(() => router.push(pathname, { scroll: false }));

  return (
    <div className="grid gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q: query || null });
        }}
        className="flex gap-2"
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Plumber, AC repair, POP, lawyer, web design…"
          className="flex-1"
          aria-label="Search professionals"
        />
        <Button type="submit" disabled={pending}>
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden"
          aria-expanded={open}
        >
          <SlidersHorizontal className="size-4" />
          {activeCount > 0 ? (
            <Badge variant="secondary" className="ml-1">
              {activeCount}
            </Badge>
          ) : null}
        </Button>
      </form>

      <div
        className={cn(
          "grid gap-4 rounded-lg border p-4 lg:grid-cols-4",
          open ? "grid" : "hidden lg:grid",
        )}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="filter-category" className="text-xs">
            Service
          </Label>
          <Select
            value={active.categoryId ?? "all"}
            onValueChange={(v) => apply({ categoryId: v })}
          >
            <SelectTrigger id="filter-category">
              <SelectValue placeholder="All services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All services</SelectItem>
              {categories.map((group) =>
                group.items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                )),
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="filter-state" className="text-xs">
            State
          </Label>
          <Select
            value={active.stateId ?? "all"}
            onValueChange={(v) => apply({ stateId: v, lgaId: null })}
          >
            <SelectTrigger id="filter-state">
              <SelectValue placeholder="Anywhere" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Anywhere</SelectItem>
              {states.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="filter-lga" className="text-xs">
            Area
          </Label>
          <Select
            value={active.lgaId ?? "all"}
            onValueChange={(v) => apply({ lgaId: v })}
            disabled={!active.stateId}
          >
            <SelectTrigger id="filter-lga">
              <SelectValue
                placeholder={active.stateId ? "All areas" : "Pick a state"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All areas</SelectItem>
              {lgas.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="filter-sort" className="text-xs">
            Sort by
          </Label>
          <Select value={active.sort} onValueChange={(v) => apply({ sort: v })}>
            <SelectTrigger id="filter-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="rating">Highest rated</SelectItem>
              <SelectItem value="reviews">Most reviewed</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 lg:col-span-2">
          <Switch
            id="filter-verified"
            checked={active.verified}
            onCheckedChange={(v) => apply({ verified: v ? "1" : null })}
          />
          <Label htmlFor="filter-verified" className="text-sm font-normal">
            Verified professionals only
          </Label>
        </div>

        <div className="flex items-center gap-2 lg:col-span-2">
          <Switch
            id="filter-accepting"
            checked={active.accepting}
            onCheckedChange={(v) => apply({ accepting: v ? "1" : null })}
          />
          <Label htmlFor="filter-accepting" className="text-sm font-normal">
            Available for work now
          </Label>
        </div>

        {activeCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="justify-self-start lg:col-span-4"
          >
            <X className="size-3.5" />
            Clear all filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
