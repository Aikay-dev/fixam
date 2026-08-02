import type { Metadata } from "next";
import { HelpCircle, Mail, ShieldAlert, Wrench } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { ROUTES, SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Get in touch with the ${SITE.name} team.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Contact us</h1>
      <p className="text-muted-foreground mt-2">
        We read everything. Give us as much detail as you can and we&apos;ll
        get back to you.
      </p>

      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Mail className="text-primary mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">Email</p>
              <a
                href={`mailto:${SITE.supportEmail}`}
                className="text-primary text-lg underline"
              >
                {SITE.supportEmail}
              </a>
              <p className="text-muted-foreground mt-1 text-sm">
                Usually answered within one working day.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="mt-10 text-lg font-semibold">
        Before you write, this might be quicker
      </h2>

      <div className="mt-4 grid gap-3">
        {[
          {
            icon: <HelpCircle className="size-4" />,
            title: "General questions",
            body: "How Fixam works, what it costs, why an account is needed.",
            href: "/faq",
            label: "Read the FAQ",
          },
          {
            icon: <Wrench className="size-4" />,
            title: "You're a professional wanting to join",
            body: "It's free and you can set your profile up yourself right now.",
            href: ROUTES.listYourServices,
            label: "List your services",
          },
          {
            icon: <ShieldAlert className="size-4" />,
            title: "Reporting a problem with a professional",
            body: "Tell us the professional's name or profile link and what happened. We take fake profiles and wrong numbers seriously.",
            href: `mailto:${SITE.supportEmail}?subject=Reporting%20an%20artisan`,
            label: "Email us the details",
          },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="flex items-start gap-3 pt-6">
              <span className="text-primary mt-0.5">{item.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {item.body}
                </p>
                <Link
                  href={item.href}
                  className="text-primary mt-1.5 inline-block text-sm underline"
                >
                  {item.label}
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-muted-foreground mt-8 text-sm">
        A note on payments: Fixam never handles money for a job, so we
        can&apos;t issue refunds. If you paid a professional directly and
        something went wrong, tell us — we&apos;ll investigate the profile and
        act on it — but the payment itself is between you and them.
      </p>
    </main>
  );
}
