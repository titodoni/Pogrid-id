"use client";

import { useState } from "react";
import { differenceInDays, format } from "date-fns";
import type { Item, PO } from "@/lib/types";
import {
  StageBadge, ProblemBadge, UrgentBadge, ReworkBadge,
  ReturnPill, ReworkPill, OverdueBadge, flagClass,
} from "./badges";
import { cn } from "@/lib/utils";
import { clientById, deptById, poById, computeFlag } from "@/lib/mock-data";
import { useItems, useSession } from "@/lib/store";
import { OperatorPanel, DrafterPanel, PurchasingPanel } from "./role-panels";
import { QCGateSheet, DeliveryGateSheet, ProblemSheet } from "./gate-sheets";

function avgProgress(item: Item) {
  if (item.status === "DRAFTING") return item.drawing_approved ? 100 : 0;
  if (item.status === "PURCHASING") return item.purchasing_progress;
  if (item.status === "PRODUCTION") {
    const sum = item.progresses.reduce((a, p) => a + p.progress, 0);
    return Math.round(sum / Math.max(1, item.progresses.length));
  }
  if (item.status === "QC" || item.status === "DELIVERY") return 100;
  return 100;
}

export function ItemCard({
  item, expanded, onToggle, readOnly = false,
}: {
  item: Item;
  expanded?: boolean;
  onToggle?: () => void;
  readOnly?: boolean;
}) {
  const user = useSession((s) => s.user);
  const po = poById(item.poId);
  if (!po) return null;
  const client = clientById(po.clientId);
  const flag = po.urgency_flag === "NORMAL"
    ? computeFlag(po.due_date)
    : po.urgency_flag;

  const days = differenceInDays(new Date(po.due_date), new Date());
  const overdue = days < 0;
  const pct = avgProgress(item);

  const [qcOpen, setQcOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [problemOpen, setProblemOpen] = useState(false);

  const role = user?.role ?? "";
  const isOperator = role.startsWith("OPERATOR_");
  const isDrafter = role === "DRAFTER" && item.status === "DRAFTING";
  const isPurchasing = role === "PURCHASING" && item.status === "PURCHASING";
  const isQC = role === "QC" && item.status === "QC";
  const isDelivery = role === "DELIVERY" && item.status === "DELIVERY";
  const canExpand = !readOnly && (isOperator || isDrafter || isPurchasing || isQC || isDelivery);

  return (
    <article className={cn("pg-card mb-3", flagClass(flag))}>
      <button
        onClick={canExpand ? onToggle : undefined}
        className={cn("w-full text-left", canExpand && "cursor-pointer")}
        aria-expanded={expanded}
      >
        {overdue && (
          <div className="mb-2"><OverdueBadge days={Math.abs(days)} /></div>
        )}

        {item.is_rework && item.source === "ORIGINAL" && (
          <div className="mb-1.5"><ReworkBadge /></div>
        )}
        {item.source === "REWORK" && item.parentItemName && (
          <div className="mb-1.5"><ReworkPill parentName={item.parentItemName} /></div>
        )}
        {item.source === "RETURN" && item.parentItemName && (
          <div className="mb-1.5"><ReturnPill parentName={item.parentItemName} /></div>
        )}

        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold">{item.name}</h3>
              {po.urgency_flag === "BLOOD_RED" || flag === "BLOOD_RED" ? <UrgentBadge /> : null}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {client?.name} · {item.qty} pcs
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-brand">{pct}%</div>
            <StageBadge status={item.status} className="mt-1" />
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <ProblemBadge count={item.problemsOpen} />
          {item.work_type.map((id) => {
            const d = deptById(id);
            const p = item.progresses.find((pp) => pp.departmentId === id);
            return d ? (
              <span key={id}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-foreground">
                {d.name.slice(0, 4).toUpperCase()} {p?.progress ?? 0}%
              </span>
            ) : null;
          })}
        </div>

        <div className="mt-2 h-2 rounded-full bg-border overflow-hidden">
          <div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Due {format(new Date(po.due_date), "d MMM")}</span>
          <span>{po.po_internal_number}</span>
        </div>
      </button>

      {expanded && canExpand && (
        <div className="mt-4 pt-4 border-t border-border animate-fade-in">
          {isOperator && <OperatorPanel item={item} onCancel={onToggle!} onProblem={() => setProblemOpen(true)} />}
          {isDrafter && <DrafterPanel item={item} onCancel={onToggle!} />}
          {isPurchasing && <PurchasingPanel item={item} onCancel={onToggle!} />}
          {isQC && (
            <div className="space-y-3">
              <p className="text-sm">Item siap di-QC. Total {item.qty} pcs.</p>
              <button onClick={() => setQcOpen(true)}
                className="w-full py-3 rounded-xl bg-brand text-white font-semibold pg-touch-48">
                Buka QC Gate
              </button>
            </div>
          )}
          {isDelivery && (
            <div className="space-y-3">
              <p className="text-sm">Siap dikirim ke {client?.name}.</p>
              <button onClick={() => setDelOpen(true)}
                className="w-full py-3 rounded-xl bg-success text-white font-semibold pg-touch-48">
                🚚 Konfirmasi Pengiriman
              </button>
            </div>
          )}
        </div>
      )}

      <QCGateSheet item={item} open={qcOpen} onClose={() => setQcOpen(false)} />
      <DeliveryGateSheet item={item} open={delOpen} onClose={() => setDelOpen(false)} />
      <ProblemSheet item={item} open={problemOpen} onClose={() => setProblemOpen(false)} />
    </article>
  );
}
