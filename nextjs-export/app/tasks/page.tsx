"use client";

import { useMemo, useState } from "react";
import { LayoutWrapper } from "@/components/pg/layout-wrapper";
import { ItemCard } from "@/components/pg/item-card";
import { CancelToast } from "@/components/pg/cancel-toast";
import { useItems, useSession } from "@/lib/store";
import { poById, computeFlag } from "@/lib/mock-data";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { Item } from "@/lib/types";

const FLAG_RANK: Record<string, number> = { BLOOD_RED: 0, RED: 1, ORANGE: 2, NORMAL: 3 };

function relevantForUser(items: Item[], role: string): Item[] {
  if (role.startsWith("OPERATOR_")) {
    const dept = role.replace("OPERATOR_", "");
    return items.filter((it) => {
      if (it.status !== "PRODUCTION") return false;
      // depth check via dept name match — done in card via deptById
      return it.work_type.length > 0;
    });
  }
  if (role === "DRAFTER") return items.filter((i) => i.status === "DRAFTING");
  if (role === "PURCHASING") return items.filter((i) => i.status === "PURCHASING");
  if (role === "QC") return items.filter((i) => i.status === "QC");
  if (role === "DELIVERY") return items.filter((i) => i.status === "DELIVERY");
  return items.filter((i) => i.status !== "DONE");
}

function TasksPage() {
  const items = useItems((s) => s.items);
  const user = useSession((s) => s.user);
  const [tab, setTab] = useState<"aktif" | "arsip">("aktif");
  const [filter, setFilter] = useState<"semua" | "terlambat" | "dekat" | "berjalan">("semua");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const role = user?.role ?? "";
  const list = useMemo(() => {
    const mine = relevantForUser(items, role);
    const filtered = mine.filter((it) => {
      const po = poById(it.poId)!;
      const d = differenceInDays(new Date(po.due_date), new Date());
      const isArchive = it.status === "DONE";
      if (tab === "aktif" && isArchive) return false;
      if (tab === "arsip" && !isArchive) return false;
      if (filter === "terlambat") return d < 0;
      if (filter === "dekat") return d >= 0 && d <= 3;
      if (filter === "berjalan") return d > 3;
      return true;
    });
    return filtered.sort((a, b) => {
      const pa = poById(a.poId)!; const pb = poById(b.poId)!;
      const fa = pa.urgency_flag === "NORMAL" ? computeFlag(pa.due_date) : pa.urgency_flag;
      const fb = pb.urgency_flag === "NORMAL" ? computeFlag(pb.due_date) : pb.urgency_flag;
      const dr = (FLAG_RANK[fa] ?? 9) - (FLAG_RANK[fb] ?? 9);
      if (dr !== 0) return dr;
      return new Date(pa.due_date).getTime() - new Date(pb.due_date).getTime();
    });
  }, [items, role, tab, filter]);

  const activeCount = relevantForUser(items, role).filter((i) => i.status !== "DONE").length;
  const archiveCount = relevantForUser(items, role).filter((i) => i.status === "DONE").length;

  return (
    <LayoutWrapper title="Tugas Saya">
      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        {([
          ["aktif", `Aktif (${activeCount})`],
          ["arsip", `Arsip (${archiveCount})`],
        ] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors pg-touch-48",
              tab === k ? "bg-brand text-white" : "bg-surface border border-border text-muted-foreground",
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* Filter chips */}
      {tab === "aktif" && (
        <div className="flex gap-2 mb-4 overflow-x-auto -mx-4 px-4 pb-1">
          {([
            ["semua", "Semua"],
            ["terlambat", "Terlambat"],
            ["dekat", "Dekat"],
            ["berjalan", "Berjalan"],
          ] as const).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                filter === k ? "bg-foreground text-background" : "bg-surface border border-border text-muted-foreground",
              )}>
              {label}
            </button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-16">
          Tidak ada tugas untuk peran Anda saat ini.
        </div>
      ) : (
        list.map((it) => (
          <ItemCard
            key={it.id}
            item={it}
            expanded={expandedId === it.id}
            onToggle={() => setExpandedId(expandedId === it.id ? null : it.id)}
          />
        ))
      )}

      <CancelToast />
    </LayoutWrapper>
  );
}

export default TasksPage;
