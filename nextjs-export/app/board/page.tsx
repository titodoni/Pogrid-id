"use client";

import { useMemo, useState } from "react";
import { LayoutWrapper } from "@/components/pg/layout-wrapper";
import { ItemCard } from "@/components/pg/item-card";
import { useItems } from "@/lib/store";
import { clients, poById, computeFlag } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { ItemStatus } from "@/lib/types";

const STAGES: Array<{ k: "ALL" | ItemStatus; label: string }> = [
  { k: "ALL", label: "Semua" },
  { k: "DRAFTING", label: "Drafting" },
  { k: "PURCHASING", label: "Purchasing" },
  { k: "PRODUCTION", label: "Produksi" },
  { k: "QC", label: "QC" },
  { k: "DELIVERY", label: "Delivery" },
  { k: "DONE", label: "Selesai" },
];

const FLAG_RANK: Record<string, number> = { BLOOD_RED: 0, RED: 1, ORANGE: 2, NORMAL: 3 };

function BoardPage() {
  const items = useItems((s) => s.items);
  const [stage, setStage] = useState<"ALL" | ItemStatus>("ALL");
  const [clientId, setClientId] = useState<string>("");

  const list = useMemo(() => {
    return items
      .filter((it) => stage === "ALL" || it.status === stage)
      .filter((it) => {
        if (!clientId) return true;
        const po = poById(it.poId);
        return po?.clientId === clientId;
      })
      .sort((a, b) => {
        const pa = poById(a.poId)!; const pb = poById(b.poId)!;
        const fa = pa.urgency_flag === "NORMAL" ? computeFlag(pa.due_date) : pa.urgency_flag;
        const fb = pb.urgency_flag === "NORMAL" ? computeFlag(pb.due_date) : pb.urgency_flag;
        return (FLAG_RANK[fa] ?? 9) - (FLAG_RANK[fb] ?? 9);
      });
  }, [items, stage, clientId]);

  return (
    <LayoutWrapper title="Board">
      <div className="flex gap-2 mb-3 overflow-x-auto -mx-4 px-4 pb-1">
        {STAGES.map((s) => (
          <button key={s.k} onClick={() => setStage(s.k)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              stage === s.k ? "bg-foreground text-background" : "bg-surface border border-border text-muted-foreground",
            )}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <select value={clientId} onChange={(e) => setClientId(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border bg-surface text-sm pg-touch-48">
          <option value="">Semua Klien</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {list.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-16">
          Tidak ada item yang cocok dengan filter.
        </div>
      ) : (
        list.map((it) => <ItemCard key={it.id} item={it} readOnly />)
      )}
    </LayoutWrapper>
  );
}

export default BoardPage;
