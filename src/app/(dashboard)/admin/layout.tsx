import {
  ClipboardCheck,
  FileText,
  Flag,
  LayoutDashboard,
  MapPin,
  Phone,
  Settings,
  Star,
  Tags,
  Users,
} from "lucide-react";

import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import { requireAdmin } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { ArtisanProfile } from "@/models/artisan-profile";
import { Report } from "@/models/moderation";

/** Counts for the sidebar badges — the queues that need attention. */
async function getQueueCounts() {
  try {
    await connectDB();
    const [pending, reports] = await Promise.all([
      ArtisanProfile.countDocuments({ status: "pending_review" }),
      Report.countDocuments({ status: "open" }),
    ]);
    return { pending, reports };
  } catch {
    return { pending: 0, reports: 0 };
  }
}

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // requireAdmin is the real gate. proxy.ts only checks for a cookie.
  await requireAdmin(ROUTES.admin);

  const counts = await getQueueCounts();

  const nav: NavItem[] = [
    { href: "/admin", label: "Overview", icon: <LayoutDashboard className="size-4" /> },
    {
      href: "/admin/artisans",
      label: "Artisans",
      icon: <ClipboardCheck className="size-4" />,
      badge: counts.pending,
    },
    { href: "/admin/leads", label: "Leads", icon: <Phone className="size-4" /> },
    { href: "/admin/users", label: "Users", icon: <Users className="size-4" /> },
    { href: "/admin/reviews", label: "Reviews", icon: <Star className="size-4" /> },
    {
      href: "/admin/reports",
      label: "Reports",
      icon: <Flag className="size-4" />,
      badge: counts.reports,
    },
    { href: "/admin/categories", label: "Categories", icon: <Tags className="size-4" /> },
    { href: "/admin/locations", label: "Locations", icon: <MapPin className="size-4" /> },
    { href: "/admin/audit", label: "Audit log", icon: <FileText className="size-4" /> },
    { href: "/admin/settings", label: "Settings", icon: <Settings className="size-4" /> },
  ];

  return (
    <DashboardShell nav={nav} title="Admin" homeHref="/admin">
      {children}
    </DashboardShell>
  );
}
