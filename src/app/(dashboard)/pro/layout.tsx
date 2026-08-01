import {
  Images,
  LayoutDashboard,
  Settings,
  Star,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { redirect } from "next/navigation";

import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import { requireUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";

const nav: NavItem[] = [
  { href: "/pro", label: "Overview", icon: <LayoutDashboard className="size-4" /> },
  { href: "/pro/profile", label: "My profile", icon: <UserRound className="size-4" /> },
  { href: "/pro/leads", label: "Customer leads", icon: <Users className="size-4" /> },
  { href: "/pro/reviews", label: "Reviews", icon: <Star className="size-4" /> },
  { href: "/pro/photos", label: "Photos", icon: <Images className="size-4" /> },
  { href: "/pro/billing", label: "Billing", icon: <Wallet className="size-4" /> },
  { href: "/pro/settings", label: "Settings", icon: <Settings className="size-4" /> },
];

export default async function ProLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser(ROUTES.pro);

  // Anyone can become an artisan — send a plain customer to the artisan
  // signup rather than a dead end.
  if (!user.roles?.includes("artisan")) {
    redirect(ROUTES.joinAsArtisan);
  }

  if (!user.isVerified) {
    redirect(
      `${ROUTES.verifyEmail}?email=${encodeURIComponent(user.email ?? "")}&next=${encodeURIComponent(ROUTES.pro)}`,
    );
  }

  return (
    <DashboardShell nav={nav} title="Artisan dashboard" homeHref="/pro">
      {children}
    </DashboardShell>
  );
}
