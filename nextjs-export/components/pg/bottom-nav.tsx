"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, AlertTriangle, User as UserIcon, FileText, Plus,
  BarChart3, Receipt, ClipboardList, ShoppingCart, ShieldCheck, Truck, Hammer,
  Search, Settings,
} from "lucide-react";
import { useSession } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

type Tab = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  primary?: boolean;
};

function tabsForRole(role: UserRole): Tab[] {
  // ADMIN — PRD §18: 7 tabs (Beranda · PO · Cari · Buat · Masalah · Kelola · Profil)
  if (role === "ADMIN") return [
    { to: "/pos",      label: "Beranda", icon: Home },
    { to: "/po",       label: "PO",      icon: FileText },
    { to: "/search",   label: "Cari",    icon: Search },
    { to: "/pos/new",  label: "Buat",    icon: Plus, primary: true },
    { to: "/masalah",  label: "Masalah", icon: AlertTriangle },
    { to: "/settings", label: "Kelola",  icon: Settings },
    { to: "/profil",   label: "Profil",  icon: UserIcon },
  ];

  // OWNER / MANAGER / SALES — PRD §18: 6 tabs (Beranda · PO · Cari · Masalah · Dashboard · Profil)
  if (role === "OWNER" || role === "MANAGER" || role === "SALES") return [
    { to: "/pos",       label: "Beranda",   icon: Home },
    { to: "/po",        label: "PO",        icon: FileText },
    { to: "/search",    label: "Cari",      icon: Search },
    { to: "/dashboard", label: "Dashboard", icon: BarChart3, primary: true },
    { to: "/masalah",   label: "Masalah",   icon: AlertTriangle },
    { to: "/profil",    label: "Profil",    icon: UserIcon },
  ];

  // FINANCE — Finance · Search · Profile
  if (role === "FINANCE") return [
    { to: "/finance", label: "Finance", icon: Receipt, primary: true },
    { to: "/search",  label: "Cari",    icon: Search },
    { to: "/profil",  label: "Profil",  icon: UserIcon },
  ];

  // ===== Workers: 3 tabs =====
  const workerCenter: Record<string, { label: string; icon: Tab["icon"] }> = {
    DRAFTER:    { label: "Drafting",   icon: ClipboardList },
    PURCHASING: { label: "Purchasing", icon: ShoppingCart },
    QC:         { label: "QC",         icon: ShieldCheck },
    DELIVERY:   { label: "Kirim",      icon: Truck },
  };

  let centerLabel = "Tugas";
  let CenterIcon: Tab["icon"] = Hammer;
  if (role.startsWith("OPERATOR_")) {
    const dept = role.replace("OPERATOR_", "");
    centerLabel = dept.charAt(0) + dept.slice(1).toLowerCase();
  } else if (workerCenter[role]) {
    centerLabel = workerCenter[role].label;
    CenterIcon = workerCenter[role].icon;
  }

  return [
    { to: "/masalah", label: "Masalah", icon: AlertTriangle },
    { to: "/tasks",   label: centerLabel, icon: CenterIcon, primary: true },
    { to: "/profil",  label: "Profil",  icon: UserIcon },
  ];
}

function isActiveTab(path: string, to: string): boolean {
  if (path === to) return true;
  // /pos shouldn't activate when on /pos/new or /po — exact match for those
  if (to === "/pos") return path === "/pos";
  if (to === "/po") return path === "/po" || path.startsWith("/po/");
  if (to === "/pos/new") return path === "/pos/new";
  return path.startsWith(to + "/");
}

export function BottomNav() {
  const user = useSession((s) => s.user);
  const path = usePathname();
  if (!user) return null;
  const tabs = tabsForRole(user.role);
  const isCompact = tabs.length >= 6;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 h-16 pb-safe bg-surface border-t border-border flex max-w-md mx-auto"
      role="navigation"
    >
      {tabs.map((t) => {
        const active = isActiveTab(path, t.to);
        const Icon = t.icon;

        if (t.primary) {
          return (
            <Link
              key={t.to}
              to={t.to}
              className="flex-1 flex flex-col items-center justify-end pb-1.5 -mt-5 relative"
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors",
                active ? "bg-brand-dark text-white" : "bg-brand text-white",
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[10px] font-semibold mt-0.5 leading-none",
                active ? "text-brand-dark" : "text-foreground",
              )}>
                {t.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={t.to}
            to={t.to}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors min-w-0 px-1",
              active ? "text-brand" : "text-muted-foreground",
            )}
          >
            <Icon className={cn(isCompact ? "w-4 h-4" : "w-5 h-5")} />
            <span className={cn(
              "font-medium leading-none truncate max-w-full",
              isCompact ? "text-[9px]" : "text-xs",
            )}>
              {t.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
