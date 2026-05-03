"use client";

import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { LayoutWrapper } from "@/components/pg/layout-wrapper";
import { useItems } from "@/lib/store";
import { pos as seedPos, clientById, poById, computeFlag } from "@/lib/mock-data";
import { flagClass } from "@/components/pg/badges";
import { cn } from "@/lib/utils";

function SearchPage() {
  const items = useItems((s) => s.items);
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return { pos: [], items: [] };
    const matchedPos = seedPos.filter((p) => {
      const c = clientById(p.clientId);
      return (
        p.po_internal_number.toLowerCase().includes(needle) ||
        p.po_client_number.toLowerCase().includes(needle) ||
        (c?.name ?? "").toLowerCase().includes(needle)
      );
    });
    const matchedItems = items.filter((i) => {
      const po = poById(i.poId);
      const c = po ? clientById(po.clientId) : null;
      return (
        i.name.toLowerCase().includes(needle) ||
        (i.spec ?? "").toLowerCase().includes(needle) ||
        (c?.name ?? "").toLowerCase().includes(needle) ||
        (po?.po_internal_number ?? "").toLowerCase().includes(needle)
      );
    });
    return { pos: matchedPos, items: matchedItems };
  }, [q, items]);

  return (
    <LayoutWrapper title="Cari">
      <div className="relative mb-4">
        <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari item, klien, nomor PO…"
          className="w-full pl-9 pr-3 py-3 rounded-xl border border-border bg-surface text-sm pg-touch-48"
        />
      </div>

      {!q.trim() ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          Mulai mengetik untuk mencari.
        </p>
      ) : results.pos.length === 0 && results.items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          Tidak ada hasil untuk "{q}".
        </p>
      ) : (
        <>
          {results.pos.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-muted-foreground tracking-wider mb-2">
                PO ({results.pos.length})
              </h2>
              {results.pos.map((p) => {
                const c = clientById(p.clientId);
                const flag = p.urgency_flag === "NORMAL" ? computeFlag(p.due_date) : p.urgency_flag;
                return (
                  <Link key={p.id} to="/po/$poId" params={{ poId: p.id }}
                    className={cn("block pg-card mb-2", flagClass(flag))}>
                    <div className="text-sm font-semibold">{c?.name}</div>
                    <div className="text-xs text-muted-foreground">{p.po_internal_number}</div>
                  </Link>
                );
              })}
            </>
          )}
          {results.items.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-muted-foreground tracking-wider mt-4 mb-2">
                Item ({results.items.length})
              </h2>
              {results.items.map((i) => {
                const po = poById(i.poId);
                const c = po ? clientById(po.clientId) : null;
                return (
                  <Link key={i.id} to="/po/$poId" params={{ poId: i.poId }}
                    className="block pg-card mb-2 hover:bg-secondary">
                    <div className="text-sm font-semibold">{i.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c?.name} · {po?.po_internal_number} · {i.qty} {i.unit}
                    </div>
                  </Link>
                );
              })}
            </>
          )}
        </>
      )}
    </LayoutWrapper>
  );
}

export default SearchPage;
