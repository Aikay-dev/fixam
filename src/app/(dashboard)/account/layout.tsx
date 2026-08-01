import { LayoutDashboard, Phone, Settings, Star } from "lucide-react";

import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import { requireUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";

const nav: NavItem[] = [
  { href: "/account", label: "Overview", icon: <LayoutDashboard className="size-4" /> },
  { href: "/account/contacts", label: "My contacts", icon: <Phone className="size-4" /> },
  { href: "/account/reviews", label: "My reviews", icon: <Star className="size-4" /> },
  { href: "/account/settings", label: "Settings", icon: <Settings className="size-4" /> },
];

export default async function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireUser(ROUTES.account);

  return (
    <DashboardShell nav={nav} title="My account" homeHref="/account">
      {children}
    </DashboardShell>
  );
}
