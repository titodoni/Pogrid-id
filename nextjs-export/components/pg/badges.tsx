import { cn } from "@/lib/utils";
import type { ItemStatus } from "@/lib/types";

const STAGE_CLASSES: Record<ItemStatus, string> = {
  DRAFTING:   "bg-[var(--badge-drafting-bg)] text-[var(--badge-drafting-fg)]",
  PURCHASING: "bg-[var(--badge-purchasing-bg)] text-[var(--badge-purchasing-fg)]",
  PRODUCTION: "bg-[var(--badge-production-bg)] text-[var(--badge-production-fg)]",
  QC:         "bg-[var(--badge-qc-bg)] text-[var(--badge-qc-fg)]",
  DELIVERY:   "bg-[var(--badge-qc-bg)] text-[var(--badge-qc-fg)]",
  DONE:       "bg-[var(--badge-done-bg)] text-[var(--badge-done-fg)]",
};

const STAGE_LABEL: Record<ItemStatus, string> = {
  DRAFTING: "Drafting",
  PURCHASING: "Purchasing",
  PRODUCTION: "Produksi",
  QC: "QC",
  DELIVERY: "Delivery",
  DONE: "Selesai",
};

export function StageBadge({ status, className }: { status: ItemStatus; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
      STAGE_CLASSES[status], className,
    )}>
      {STAGE_LABEL[status]}
    </span>
  );
}

export function ProblemBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-danger text-white">
      Masalah ({count})
    </span>
  );
}

export function ReworkBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning text-white animate-pulse-rework">
      REWORK
    </span>
  );
}

export function UrgentBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-danger text-white">
      URGENT
    </span>
  );
}

export function ReturnPill({ parentName }: { parentName: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-danger text-white">
      ↩ RETURN dari {parentName}
    </span>
  );
}

export function ReworkPill({ parentName }: { parentName: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning text-white">
      ↩ RW dari {parentName}
    </span>
  );
}

export function OverdueBadge({ days }: { days: number }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blood text-white">
      TERLAMBAT {days} hari
    </span>
  );
}

import type { UrgencyFlag } from "@/lib/types";
export function flagClass(flag: UrgencyFlag): string {
  switch (flag) {
    case "BLOOD_RED": return "pg-flag-blood";
    case "RED": return "pg-flag-red";
    case "ORANGE": return "pg-flag-orange";
    default: return "pg-flag-normal";
  }
}
