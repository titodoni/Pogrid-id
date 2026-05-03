"use client";

import { useMemo, useState } from "react";
import { LayoutWrapper } from "@/components/pg/layout-wrapper";
import { pos as seedPos, clientById, computeFlag } from "@/lib/mock-data";
import { useItems } from "@/lib/store";
import { flagClass } from "@/components/pg/badges";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

type Tab = "SEMUA" | "TERLAMBAT" | "URGENT";

const FLAG_RANK: Record<string, number> = { BLOOD_RED: 0, RED: 1, ORANGE: 2, NORMAL: 3 };

function POFullList() {
  const items = useItems((s) => s.items);
  const [tab, setTab] = useState<Tab>("SEMUA");

  const list = useMemo(() => {
    return seedPos
      .map((p) => ({
        ...p,
        flag: p.urgency_flag === "NORMAL" ? computeFlag(p.due_date) : p.urgency_flag,
        days: differenceInDays(new Date(p.due_date), new Date()),
      }))
      .filter((p) => {
        if (tab === "TERLAMBAT") return p.days < 0;
        if (tab === "URGENT") return p.is_urgent || p.flag === "BLOOD_RED" || p.flag === "RED";
        return true;
      })
      .sort((a, b) => {
        if (a.days < 0 && b.days >= 0) return -1;
        if (b.days < 0 && a.days >= 0) return 1;
        const r = (FLAG_RANK[a.flag] ?? 9) - (FLAG_RANK[b.flag] ?? 9);
        if (r !== 0) return r;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
  }, [tab]);

  const counts = useMemo(() => {
    const all = seedPos.map((p) => ({
      flag: p.urgency_flag === "NORMAL" ? computeFlag(p.due_date) : p.urgency_flag,
      days: differenceInDays(new Date(p.due_date), new Date()),
      urgent: p.is_urgent,
    }));
    return {
      SEMUA: all.length,
      TERLAMBAT: all.filter((p) => p.days < 0).length,
      URGENT: all.filter((p) => p.urgent || p.flag === "BLOOD_RED" || p.flag === "RED").length,
    };
  }, []);

  return (
    <LayoutWrapper title="Daftar PO">
      <div className="flex gap-2 mb-4">
        {(["SEMUA", "TERLAMBAT", "URGENT"] as Tab[]).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors pg-touch-48",
              tab === k ? "bg-brand text-white" : "bg-surface border border-border text-muted-foreground",
            )}>
            {k === "SEMUA" ? "Semua" : k === "TERLAMBAT" ? "Terlambat" : "Urgent"} ({counts[k]})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-16">Tidak ada PO.</p>
      ) : (
        list.map((p) => {
          const c = clientById(p.clientId);
          const itemsOfPo = items.filter((i) => i.poId === p.id);
          const total = itemsOfPo.length;
          const done = itemsOfPo.filter((i) => i.status === "DONE").length;
          const progressPct = total === 0 ? 0 : Math.round((done / total) * 100);
          return (
            <Link
              key={p.id}
              to="/po/$poId"
              params={{ poId: p.id }}
              className={cn("block pg-card mb-3 hover:bg-secondary transition-colors", flagClass(p.flag))}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{c?.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {p.po_internal_number} · klien: {p.po_client_number}
                  </div>
                </div>
                {(p.is_urgent || p.flag === "BLOOD_RED") && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger text-white whitespace-nowrap">
                    URGENT
                  </span>
                )}
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-brand transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Due {format(new Date(p.due_date), "d MMM yyyy", { locale: idLocale })}</span>
                <span>
                  {p.days < 0 ? `⏰ Telat ${Math.abs(p.days)}h` : `${done}/${total} item`}
                </span>
              </div>
            </Link>
          );
        })
      )}
    </LayoutWrapper>
  );
}

export default POFullList;
