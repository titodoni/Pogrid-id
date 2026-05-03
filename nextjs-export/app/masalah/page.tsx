"use client";

import { useState } from "react";
import { LayoutWrapper } from "@/components/pg/layout-wrapper";
import { useItems } from "@/lib/store";
import { poById, clientById, deptById } from "@/lib/mock-data";
import { BottomSheet } from "@/components/pg/bottom-sheet";
import { formatDistanceToNow } from "date-fns";

function MasalahPage() {
  const { problems, items, resolveProblem } = useItems();
  const [sel, setSel] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const open = problems.filter((p) => !p.resolved);

  return (
    <LayoutWrapper title="Masalah">
      {open.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-16">
          Tidak ada masalah terbuka. 🎉
        </div>
      ) : open.map((p) => {
        const item = items.find((i) => i.id === p.itemId);
        const po = item ? poById(item.poId) : null;
        const client = po ? clientById(po.clientId) : null;
        return (
          <div key={p.id} className="pg-card mb-3 pg-flag-orange">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="text-sm font-semibold">{item?.name ?? "—"}</h3>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {client?.name} · {po?.po_internal_number}
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning text-white">
                {p.source}
              </span>
            </div>
            <div className="mt-2 text-sm">
              <span className="font-semibold">{p.category}</span>
              {p.note && <p className="text-muted-foreground mt-0.5">{p.note}</p>}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</span>
              <button onClick={() => setSel(p.id)}
                className="px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold pg-touch-48">
                Resolve →
              </button>
            </div>
          </div>
        );
      })}

      <BottomSheet open={!!sel} onClose={() => { setSel(null); setNote(""); }} title="Resolve Masalah">
        <textarea value={note} onChange={(e) => setNote(e.target.value)}
          rows={3} placeholder="Catatan resolusi (opsional)..."
          className="w-full px-3 py-2 rounded-xl border bg-surface text-sm" />
        <div className="flex gap-2 mt-4">
          <button onClick={() => { setSel(null); setNote(""); }}
            className="flex-1 py-3 rounded-xl bg-secondary text-sm font-medium pg-touch-48">Batal</button>
          <button onClick={() => { if (sel) resolveProblem(sel); setSel(null); setNote(""); }}
            className="flex-1 py-3 rounded-xl bg-success text-white text-sm font-semibold pg-touch-48">
            Tandai Selesai
          </button>
        </div>
      </BottomSheet>
    </LayoutWrapper>
  );
}

export default MasalahPage;
