"use client";

import { useMemo, useState } from "react";
import { TrendingUp, AlertTriangle, Clock, Package, CheckCircle2, Receipt, Wrench } from "lucide-react";
import { LayoutWrapper } from "@/components/pg/layout-wrapper";
import { useItems } from "@/lib/store";
import { pos as seedPos, clientById, computeFlag } from "@/lib/mock-data";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

type Period = "7d" | "30d" | "90d";

function DashboardPage() {
  const items = useItems((s) => s.items);
  const problems = useItems((s) => s.problems);
  const [period, setPeriod] = useState<Period>("30d");

  const stats = useMemo(() => {
    const active = seedPos.filter((p) => p.status === "ACTIVE");
    const overdue = active.filter((p) => differenceInDays(new Date(p.due_date), new Date()) < 0).length;
    const closeRisk = active.filter((p) => {
      const d = differenceInDays(new Date(p.due_date), new Date());
      return d >= 0 && d <= 3;
    }).length;
    const inProd = items.filter((i) => i.status === "PRODUCTION").length;
    const inQc = items.filter((i) => i.status === "QC").length;
    const done = items.filter((i) => i.status === "DONE").length;
    const reworks = items.filter((i) => i.is_rework).length;
    const invoiced = items.filter((i) => i.invoice_status === "INVOICED" || i.invoice_status === "PAID").length;
    const openProblems = problems.filter((p) => !p.resolved).length;

    const stages = [
      { k: "DRAFTING",   label: "Drafting",   count: items.filter((i) => i.status === "DRAFTING").length,   color: "bg-muted-foreground" },
      { k: "PURCHASING", label: "Purchasing", count: items.filter((i) => i.status === "PURCHASING").length, color: "bg-warning" },
      { k: "PRODUCTION", label: "Produksi",   count: inProd,                                                 color: "bg-navy" },
      { k: "QC",         label: "QC",         count: inQc,                                                   color: "bg-brand" },
      { k: "DELIVERY",   label: "Delivery",   count: items.filter((i) => i.status === "DELIVERY").length,   color: "bg-brand-dark" },
      { k: "DONE",       label: "Selesai",    count: done,                                                   color: "bg-success" },
    ];
    const total = stages.reduce((s, x) => s + x.count, 0) || 1;

    // Problem categories
    const catMap: Record<string, number> = {};
    for (const p of problems) catMap[p.category] = (catMap[p.category] ?? 0) + 1;
    const probCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { active: active.length, overdue, closeRisk, inProd, inQc, done, reworks, invoiced, openProblems, stages, total, probCats };
  }, [items, problems]);

  const topRisk = useMemo(() => {
    return [...seedPos]
      .filter((p) => p.status === "ACTIVE")
      .map((p) => ({ ...p, flag: p.urgency_flag === "NORMAL" ? computeFlag(p.due_date) : p.urgency_flag }))
      .filter((p) => p.flag === "BLOOD_RED" || p.flag === "RED")
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5);
  }, []);

  return (
    <LayoutWrapper title="Dashboard">
      {/* Period filter */}
      <div className="flex gap-2 mb-3">
        {(["7d", "30d", "90d"] as Period[]).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-semibold transition-colors",
              period === p ? "bg-brand text-white" : "bg-surface border border-border text-muted-foreground",
            )}>
            {p === "7d" ? "7 hari" : p === "30d" ? "30 hari" : "90 hari"}
          </button>
        ))}
      </div>

      {/* Horizontal KPI scroll */}
      <div className="-mx-4 px-4 mb-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-3 w-max pr-4">
          <KPI icon={Package}       label="PO Aktif"    value={stats.active}      tone="brand" />
          <KPI icon={AlertTriangle} label="Terlambat"   value={stats.overdue}     tone="danger" />
          <KPI icon={Clock}         label="Hampir Due"  value={stats.closeRisk}   tone="warning" />
          <KPI icon={CheckCircle2}  label="Selesai"     value={stats.done}        tone="success" />
          <KPI icon={Wrench}        label="Rework"      value={stats.reworks}     tone="warning" />
          <KPI icon={Receipt}       label="Diinvoice"   value={stats.invoiced}    tone="brand" />
        </div>
      </div>

      {/* Chart 1: Stage distribution */}
      <div className="pg-card mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">Distribusi Tahap</h2>
          <span className="text-xs text-muted-foreground">{stats.total} item</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden bg-secondary mb-3">
          {stats.stages.map((s) => (
            <div key={s.k} className={s.color} style={{ width: `${(s.count / stats.total) * 100}%` }} />
          ))}
        </div>
        <ul className="space-y-1.5">
          {stats.stages.map((s) => (
            <li key={s.k} className="flex items-center gap-2 text-xs">
              <span className={cn("w-2.5 h-2.5 rounded-sm", s.color)} />
              <span className="flex-1">{s.label}</span>
              <span className="font-semibold tabular-nums">{s.count}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Chart 2: Top risk */}
      <div className="pg-card mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-brand" /> PO Risiko Tinggi
          </h2>
          <span className="text-xs text-muted-foreground">{topRisk.length}</span>
        </div>
        {topRisk.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Tidak ada PO berisiko. 🎉</p>
        ) : (
          <ul className="divide-y divide-border">
            {topRisk.map((p) => {
              const c = clientById(p.clientId);
              const days = differenceInDays(new Date(p.due_date), new Date());
              return (
                <li key={p.id}>
                  <Link href={`/po/${p.id}`} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{c?.name}</div>
                      <div className="text-[11px] text-muted-foreground">{p.po_internal_number}</div>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      days < 0 ? "bg-blood text-white" : "bg-danger text-white",
                    )}>
                      {days < 0 ? `Telat ${Math.abs(days)}h` : `${days}h lagi`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Chart 3: Problem categories */}
      <div className="pg-card mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Kategori Masalah</h2>
          <span className="text-xs text-muted-foreground">{stats.openProblems} terbuka</span>
        </div>
        {stats.probCats.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Tidak ada masalah.</p>
        ) : (
          <ul className="space-y-2">
            {stats.probCats.map(([cat, n]) => {
              const max = stats.probCats[0][1] || 1;
              return (
                <li key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="truncate flex-1">{cat}</span>
                    <span className="font-semibold tabular-nums ml-2">{n}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-danger" style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </LayoutWrapper>
  );
}

function KPI({ icon: Icon, label, value, tone }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: number; tone: "brand" | "danger" | "warning" | "success";
}) {
  const toneClass = {
    brand:   "bg-brand-light text-brand-dark",
    danger:  "bg-[oklch(0.95_0.06_25)] text-danger",
    warning: "bg-[oklch(0.96_0.07_90)] text-warning",
    success: "bg-[oklch(0.94_0.06_145)] text-success",
  }[tone];
  return (
    <div className="pg-card w-28 shrink-0">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", toneClass)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-2xl font-bold tabular-nums leading-none">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1 truncate">{label}</div>
    </div>
  );
}

export default DashboardPage;
