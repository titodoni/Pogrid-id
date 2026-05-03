"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Calendar, Package } from "lucide-react";
import { LayoutWrapper } from "@/components/pg/layout-wrapper";
import { pos as seedPos, items as seedItems, clientById, computeFlag } from "@/lib/mock-data";
import { flagClass } from "@/components/pg/badges";
import { useItems } from "@/lib/store";
import { format, formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { POStatus } from "@/lib/types";

// Re-export for stub pages still using it
export function StubBody({ name }: { name: string }) {
  return (
    <div className="pg-card text-center py-12">
      <h2 className="text-lg font-semibold mb-1">{name}</h2>
      <p className="text-sm text-muted-foreground">Belum dibangun.</p>
    </div>
  );
}

const FLAG_RANK: Record<string, number> = { BLOOD_RED: 0, RED: 1, ORANGE: 2, NORMAL: 3 };

function POListPage() {
  const items = useItems((s) => s.items);
  const [tab, setTab] = useState<POStatus>("ACTIVE");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    return seedPos
      .filter((p) => p.status === tab)
      .filter((p) => {
        if (!q.trim()) return true;
        const c = clientById(p.clientId);
        const needle = q.toLowerCase();
        return (
          p.po_internal_number.toLowerCase().includes(needle) ||
          p.po_client_number.toLowerCase().includes(needle) ||
          (c?.name ?? "").toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => {
        const fa = a.urgency_flag === "NORMAL" ? computeFlag(a.due_date) : a.urgency_flag;
        const fb = b.urgency_flag === "NORMAL" ? computeFlag(b.due_date) : b.urgency_flag;
        return (FLAG_RANK[fa] ?? 9) - (FLAG_RANK[fb] ?? 9);
      });
  }, [tab, q]);

  const counts = {
    ACTIVE: seedPos.filter((p) => p.status === "ACTIVE").length,
    FINISHED: seedPos.filter((p) => p.status === "FINISHED").length,
    CLOSED: seedPos.filter((p) => p.status === "CLOSED").length,
  };

  return (
    <LayoutWrapper
      title="Daftar PO"
      right={
        <Link href="/pos/new" aria-label="Buat PO" className="pg-touch-48 flex items-center justify-center text-brand">
          <Plus className="w-5 h-5" />
        </Link>
      }
    >
      <div className="flex gap-2 mb-3">
        {(["ACTIVE", "FINISHED", "CLOSED"] as POStatus[]).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors pg-touch-48",
              tab === k ? "bg-brand text-white" : "bg-surface border border-border text-muted-foreground",
            )}>
            {k === "ACTIVE" ? "Aktif" : k === "FINISHED" ? "Selesai" : "Ditutup"} ({counts[k]})
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nomor PO atau klien…"
          className="w-full pl-9 pr-3 py-3 rounded-xl border border-border bg-surface text-sm pg-touch-48"
        />
      </div>

      {list.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-16">Tidak ada PO.</div>
      ) : (
        list.map((p) => {
          const c = clientById(p.clientId);
          const flag = p.urgency_flag === "NORMAL" ? computeFlag(p.due_date) : p.urgency_flag;
          const itemsOfPo = items.filter((i) => i.poId === p.id);
          const done = itemsOfPo.filter((i) => i.status === "DONE").length;
          const total = itemsOfPo.length || seedItems.filter((i) => i.poId === p.id).length;
          return (
            <Link
              key={p.id}
              to="/po/$poId"
              params={{ poId: p.id }}
              className={cn("block pg-card mb-3 hover:bg-secondary transition-colors", flagClass(flag))}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{c?.name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {p.po_internal_number} · klien: {p.po_client_number}
                  </div>
                </div>
                {flag === "BLOOD_RED" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blood text-white">
                    TERLAMBAT
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(p.due_date), "d MMM yyyy", { locale: idLocale })}
                  <span className="ml-1">({formatDistanceToNow(new Date(p.due_date), { addSuffix: true, locale: idLocale })})</span>
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  {done}/{total} item
                </span>
              </div>
            </Link>
          );
        })
      )}
    </LayoutWrapper>
  );
}

export default StubBody;
