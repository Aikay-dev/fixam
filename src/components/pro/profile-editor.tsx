"use client";

import { Check, Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Field, fieldA11y } from "@/components/forms/field";
import {
  AvatarUploader,
  PortfolioUploader,
  type UploadedImage,
} from "@/components/pro/image-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { OwnerArtisan } from "@/lib/serializers/artisan";

type CategoryGroup = {
  id: string;
  name: string;
  children: { id: string; name: string }[];
};
type StateOption = { id: string; name: string; isLaunchCity: boolean };
type LgaOption = { id: string; name: string; popularAreas: string[] };

type SectionKey =
  | "basics"
  | "trades"
  | "contact"
  | "location"
  | "media"
  | "availability";

/** PATCHes one section at a time so a flaky connection can't lose earlier work. */
async function patchProfile(body: Record<string, unknown>) {
  const response = await fetch("/api/me/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      json.details
        ? Object.values(json.details as Record<string, string>)[0]
        : (json.error ?? "Couldn't save."),
    );
  }
  return json;
}

function SectionCard({
  title,
  description,
  saving,
  saved,
  onSave,
  children,
  saveLabel = "Save",
}: {
  title: string;
  description?: string;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
  children: React.ReactNode;
  saveLabel?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-4">
        {children}
        <div className="flex items-center gap-3">
          <Button type="button" onClick={onSave} disabled={saving} size="sm">
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              saveLabel
            )}
          </Button>
          {saved ? (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Check className="size-3.5" />
              Saved
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfileEditor({
  initialProfile,
  categoryGroups,
  states,
}: {
  initialProfile: OwnerArtisan;
  categoryGroups: CategoryGroup[];
  states: StateOption[];
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState<SectionKey | null>(null);
  const [saved, setSaved] = useState<SectionKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Basics
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [yearsExperience, setYearsExperience] = useState(
    String(profile.yearsExperience || ""),
  );

  // Trades
  const [tradeIds, setTradeIds] = useState<string[]>(profile.tradeIds);

  // Contact
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp ?? "");

  // Location
  const [stateId, setStateId] = useState(profile.location.stateId ?? "");
  const [lgaId, setLgaId] = useState(profile.location.lgaId ?? "");
  const [areaText, setAreaText] = useState(profile.location.areaText);
  const [landmark, setLandmark] = useState(profile.location.landmark);
  const [lgas, setLgas] = useState<LgaOption[]>([]);

  // Media
  const [avatar, setAvatar] = useState<UploadedImage | null>(
    profile.avatarUrl
      ? {
          publicId: "existing",
          url: profile.avatarUrl,
          caption: "",
          width: null,
          height: null,
          order: 0,
        }
      : null,
  );
  const [portfolio, setPortfolio] = useState<UploadedImage[]>(
    profile.portfolio.map((p, i) => ({
      publicId: `existing-${i}`,
      url: p.url,
      caption: p.caption,
      width: p.width,
      height: p.height,
      order: i,
    })),
  );

  // Availability
  const [acceptingJobs, setAcceptingJobs] = useState(profile.acceptingJobs);
  const [respondsWithin, setRespondsWithin] = useState(profile.respondsWithin);

  // LGAs depend on the chosen state — fetched on demand rather than shipping
  // all 774 to the browser.
  useEffect(() => {
    if (!stateId) return;

    let cancelled = false;
    fetch(`/api/locations?stateId=${stateId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setLgas(d.lgas ?? []);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [stateId]);

  async function save(section: SectionKey, body: Record<string, unknown>) {
    setSaving(section);
    setSaved(null);
    try {
      const result = await patchProfile(body);
      setProfile(result.profile);
      setSaved(section);
      setTimeout(() => setSaved((s) => (s === section ? null : s)), 2500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save.");
    } finally {
      setSaving(null);
    }
  }

  async function submitForReview() {
    setSubmitting(true);
    try {
      const response = await fetch("/api/me/profile/submit", { method: "POST" });
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(json.error ?? "Couldn't submit your profile.");
        return;
      }

      setProfile(json.profile);
      toast.success(
        "Submitted. We'll review it and email you — usually within a day or two.",
      );
    } catch {
      toast.error("Network problem. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedLga = lgas.find((l) => l.id === lgaId);
  const editable = profile.status !== "suspended";

  return (
    <div className="grid gap-6">
      <SectionCard
        title="About you"
        description="This is the name and description customers see."
        saving={saving === "basics"}
        saved={saved === "basics"}
        onSave={() =>
          save("basics", {
            basics: {
              displayName,
              bio,
              yearsExperience: Number(yearsExperience) || 0,
            },
          })
        }
      >
        <Field id="displayName" label="Name customers see" required>
          <Input
            {...fieldA11y("displayName")}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={!editable}
            placeholder="Emeka Okafor"
          />
        </Field>

        <Field
          id="bio"
          label="About your work"
          hint="Two or three lines. What you do, how long you've done it, what you're known for."
        >
          <Textarea
            {...fieldA11y("bio", undefined, true)}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={!editable}
            rows={4}
            maxLength={1200}
            placeholder="I've been fixing plumbing across Lekki and Ajah for 8 years. Leaks, showers, water heaters, full bathroom installs."
          />
        </Field>

        <Field id="yearsExperience" label="Years of experience">
          <Input
            {...fieldA11y("yearsExperience")}
            value={yearsExperience}
            onChange={(e) =>
              setYearsExperience(e.target.value.replace(/\D/g, "").slice(0, 2))
            }
            disabled={!editable}
            inputMode="numeric"
            placeholder="8"
            className="max-w-24"
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="What you do"
        description="Pick every trade you actually offer — customers search by trade."
        saving={saving === "trades"}
        saved={saved === "trades"}
        onSave={() =>
          save("trades", {
            trades: tradeIds.map((id, i) => ({
              categoryId: id,
              isPrimary: i === 0,
            })),
          })
        }
      >
        <div className="grid gap-4">
          {categoryGroups.map((group) => (
            <div key={group.id} className="grid gap-2">
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                {group.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.children.map((child) => {
                  const selected = tradeIds.includes(child.id);
                  const isPrimary = tradeIds[0] === child.id;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      disabled={!editable}
                      onClick={() =>
                        setTradeIds((prev) =>
                          prev.includes(child.id)
                            ? prev.filter((id) => id !== child.id)
                            : prev.length >= 8
                              ? prev
                              : [...prev, child.id],
                        )
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input hover:border-primary/50 hover:bg-accent",
                      )}
                    >
                      {child.name}
                      {isPrimary ? " ★" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="text-muted-foreground text-xs">
          {tradeIds.length} selected (up to 8). The first one you pick is your
          main trade — it appears in your profile link.
        </p>
      </SectionCard>

      <SectionCard
        title="How customers reach you"
        description="Your number stays hidden until someone signs up and chooses you."
        saving={saving === "contact"}
        saved={saved === "contact"}
        onSave={() =>
          save("contact", {
            contact: { phone, ...(whatsapp ? { whatsapp } : {}) },
          })
        }
      >
        <div className="border-primary/20 bg-accent/40 rounded-md border p-3">
          <p className="text-sm">
            <strong>Your number is never shown publicly.</strong> Customers
            must create a free account and pick you before they can see it —
            which is how you only hear from people who actually want to hire.
          </p>
        </div>

        <Field
          id="phone"
          label="Phone number"
          hint="Any format works — 08031234567 or +2348031234567."
          required
        >
          <Input
            {...fieldA11y("phone", undefined, true)}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={!editable}
            inputMode="tel"
            placeholder="0803 123 4567"
          />
        </Field>

        <Field
          id="whatsapp"
          label="WhatsApp number"
          hint="Leave blank if it's the same as above."
        >
          <Input
            {...fieldA11y("whatsapp", undefined, true)}
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            disabled={!editable}
            inputMode="tel"
            placeholder="Same as phone"
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="Where you work"
        saving={saving === "location"}
        saved={saved === "location"}
        onSave={() =>
          save("location", {
            location: { stateId, lgaId, areaText, landmark },
          })
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="state" label="State" required>
            <Select
              value={stateId}
              onValueChange={(v) => {
                setStateId(v);
                // Clear here rather than in the effect — the previous state's
                // LGAs must not stay selectable while the new list loads.
                setLgaId("");
                setLgas([]);
              }}
              disabled={!editable}
            >
              <SelectTrigger id="state">
                <SelectValue placeholder="Choose state" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                    {s.isLaunchCity ? " ★" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field id="lga" label="Local government area" required>
            <Select
              value={lgaId}
              onValueChange={setLgaId}
              disabled={!editable || !stateId}
            >
              <SelectTrigger id="lga">
                <SelectValue
                  placeholder={stateId ? "Choose LGA" : "Pick a state first"}
                />
              </SelectTrigger>
              <SelectContent>
                {lgas.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field
          id="areaText"
          label="Area or neighbourhood"
          hint="The name people actually use."
        >
          <Input
            {...fieldA11y("areaText", undefined, true)}
            value={areaText}
            onChange={(e) => setAreaText(e.target.value)}
            disabled={!editable}
            placeholder="Lekki Phase 1"
          />
          {selectedLga?.popularAreas.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedLga.popularAreas.slice(0, 8).map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => setAreaText(area)}
                  className="border-input hover:bg-accent rounded-full border px-2 py-0.5 text-xs"
                >
                  {area}
                </button>
              ))}
            </div>
          ) : null}
        </Field>

        <Field
          id="landmark"
          label="Nearest landmark or bus stop"
          hint="How you'd describe it to someone on the phone."
        >
          <Input
            {...fieldA11y("landmark", undefined, true)}
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            disabled={!editable}
            placeholder="Behind Shoprite, Jakande bus stop"
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="Photos"
        description="Your face, and pictures of work you've finished."
        saving={saving === "media"}
        saved={saved === "media"}
        onSave={() =>
          save("media", {
            media: {
              avatar: avatar
                ? {
                    publicId: avatar.publicId,
                    url: avatar.url,
                    caption: avatar.caption,
                    width: avatar.width,
                    height: avatar.height,
                    order: 0,
                  }
                : null,
              portfolio: portfolio.map((p, i) => ({
                publicId: p.publicId,
                url: p.url,
                caption: p.caption,
                width: p.width,
                height: p.height,
                order: i,
              })),
            },
          })
        }
      >
        <AvatarUploader value={avatar} onChange={setAvatar} disabled={!editable} />
        <div className="border-t pt-4">
          <p className="mb-3 text-sm font-medium">Work you&apos;ve done</p>
          <PortfolioUploader
            value={portfolio}
            onChange={setPortfolio}
            disabled={!editable}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Availability"
        saving={saving === "availability"}
        saved={saved === "availability"}
        onSave={() =>
          save("availability", {
            availability: { acceptingJobs, respondsWithin },
          })
        }
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Accepting jobs</p>
            <p className="text-muted-foreground text-xs">
              Turn this off when you&apos;re fully booked. You stay listed but
              show as unavailable.
            </p>
          </div>
          <Switch
            checked={acceptingJobs}
            onCheckedChange={setAcceptingJobs}
            disabled={!editable}
          />
        </div>

        <Field id="respondsWithin" label="How fast you usually reply">
          <Select
            value={respondsWithin}
            onValueChange={setRespondsWithin}
            disabled={!editable}
          >
            <SelectTrigger id="respondsWithin">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="within_hour">Within an hour</SelectItem>
              <SelectItem value="same_day">Same day</SelectItem>
              <SelectItem value="few_days">Within a few days</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </SectionCard>

      {/* Submit for review */}
      <Card className="border-primary/30">
        <CardContent className="grid gap-4 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">Ready to go live?</h2>
            <Badge variant="secondary">{profile.status.replace("_", " ")}</Badge>
          </div>

          <p className="text-muted-foreground text-sm">
            {profile.status === "approved"
              ? "Your profile is live. Any changes you save here appear straight away."
              : profile.status === "pending_review"
                ? "Your profile is with our team. We'll email you when it's approved."
                : "We check every artisan before they go live — that's what makes customers trust the people they find here."}
          </p>

          {profile.status !== "approved" && profile.status !== "pending_review" ? (
            <Button
              onClick={submitForReview}
              disabled={submitting || !editable}
              className="justify-self-start"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Submit for review
                </>
              )}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
