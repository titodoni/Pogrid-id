"use client";

import { useMemo, useState } from "react";
import { Receipt, CheckCircle2, Clock, FileText, X } from "lucide-react";
import { LayoutWrapper } from "@/components/pg/layout-wrapper";
import { useItems } from "@/lib/store";
import { poById, clientById } from "@/lib/mock-data";
import { BottomSheet } from "@/components/pg/bottom-sheet";
import { cn } from "@/lib/utils";
import type { InvoiceStatus, Item } from "@/lib/types";

function FinancePage() {
  const items = useItems((s) => s.items);
  const [tab, setTab] = useState<InvoiceStatus>("PENDING");
  const [overrides, setOverrides] = useState<Record<string, InvoiceStatus>>({});
  const [confirm, setConfirm] = useState<{ item: Item; next: InvoiceStatus; label: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const allDone = useMemo(
    () => items.filter((i) => i.status === "DONE").map((i) => ({ ...i, _inv: overrides[i.id] ?? i.invoice_status })),
    [items, overrides],
  );

  const counts = useMemo(() => ({
    PENDING:  allDone.filter((i) => i._inv === "PENDING").length,
    INVOICED: allDone.filter((i) => i._inv === "INVOICED").length,
    PAID:     allDone.filter((i) => i._inv === "PAID").length,
  }), [allDone]);

  // Group filtered items by PO
  const grouped = useMemo(() => {
    const filt = allDone.filter((i) => i._inv === tab);
    const g: Record<string, typeof filt> = {};
    for (const i of filt) (g[i.poId] ||= []).push(i);
    return Object.entries(g);
  }, [allDone, tab]);

  const apply = (itemId: string, next: InvoiceStatus, label: string) => {
    setOverrides((p) => ({ ...p, [itemId]: next }));
    setConfirm(null);
    setToast(`Ditandai ${label} ✓`);
    setTimeout(() => setToast(null), 1800);
  };

  return (
    <LayoutWrapper title="Finance">
      {/* 3-card summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <SummaryCard icon={Clock}        label="Pending"   value={counts.PENDING}  tone="muted" />
        <SummaryCard icon={Receipt}      label="Diinvoice" value={counts.INVOICED} tone="warning" />
        <SummaryCard icon={CheckCircle2} label="Lunas"     value={counts.PAID}     tone="success" />
      </div>

      <div className="flex gap-2 mb-4">
        {(["PENDING", "INVOICED", "PAID"] as InvoiceStatus[]).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors pg-touch-48",
              tab === k ? "bg-brand text-white" : "bg-surface border border-border text-muted-foreground",
            )}>
            {k === "PENDING" ? "Pending" : k === "INVOICED" ? "Diinvoice" : "Lunas"}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-16">Tidak ada item.</div>
      ) : (
        grouped.map(([poId, list]) => {
          const po = poById(poId);
          const c = po ? clientById(po.clientId) : null;
          return (
            <div key={poId} className="mb-4">
              <Link href={`/po/${poId}`} className="flex items-center gap-2 px-1 mb-2">
                <FileText className="w-3.5 h-3.5 text-brand" />
                <span className="text-xs font-bold text-brand">{po?.po_internal_number}</span>
                <span className="text-xs text-muted-foreground truncate">· {c?.name}</span>
              </Link>
              {list.map((it) => (
                <div key={it.id} className="pg-card mb-2">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{it.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">qty {it.qty} {it.unit ?? "pcs"}</div>
                    </div>
                    <StatusPill status={tab} />
                  </div>
                  {tab === "PENDING" && (
                    <button onClick={() => setConfirm({ item: it, next: "INVOICED", label: "diinvoice" })}
                      className="w-full py-2.5 rounded-xl bg-brand text-white text-sm font-semibold pg-touch-48">
                      Tandai Diinvoice
                    </button>
                  )}
                  {tab === "INVOICED" && (
                    <button onClick={() => setConfirm({ item: it, next: "PAID", label: "lunas" })}
                      className="w-full py-2.5 rounded-xl bg-success text-white text-sm font-semibold pg-touch-48">
                      Tandai Lunas
                    </button>
                  )}
                  {tab === "PAID" && (
                    <div className="text-xs text-success font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Pembayaran selesai
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })
      )}

      {/* Confirmation sheet */}
      <BottomSheet open={!!confirm} onClose={() => setConfirm(null)} title="Konfirmasi">
        {confirm && (
          <div>
            <p className="text-sm mb-1">Tandai item sebagai <strong>{confirm.label}</strong>?</p>
            <p className="text-sm font-semibold">{confirm.item.name}</p>
            <p className="text-xs text-muted-foreground mb-4">qty {confirm.item.qty}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-secondary text-foreground text-sm font-semibold pg-touch-48">
                <X className="w-4 h-4 inline mr-1" /> Batal
              </button>
              <button onClick={() => apply(confirm.item.id, confirm.next, confirm.label)}
                className={cn(
                  "flex-1 py-3 rounded-xl text-white text-sm font-semibold pg-touch-48",
                  confirm.next === "PAID" ? "bg-success" : "bg-brand",
                )}>
                Ya, lanjutkan
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[60] px-4 py-2 rounded-full bg-foreground text-background text-sm shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </LayoutWrapper>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: number; tone: "muted" | "warning" | "success";
}) {
  const cls = {
    muted:   "bg-secondary text-muted-foreground",
    warning: "bg-[oklch(0.96_0.07_90)] text-warning",
    success: "bg-[oklch(0.94_0.06_145)] text-success",
  }[tone];
  return (
    <div className="pg-card text-center">
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1.5", cls)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="text-xl font-bold tabular-nums leading-none">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: InvoiceStatus }) {
  const map = {
    PENDING:  { Icon: Clock,        label: "Pending",   cls: "bg-secondary text-muted-foreground" },
    INVOICED: { Icon: Receipt,      label: "Diinvoice", cls: "bg-warning text-white" },
    PAID:     { Icon: CheckCircle2, label: "Lunas",     cls: "bg-success text-white" },
  }[status];
  const Icon = map.Icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap", map.cls)}>
      <Icon className="w-3 h-3" /> {map.label}
    </span>
  );
}

export default FinancePage;
