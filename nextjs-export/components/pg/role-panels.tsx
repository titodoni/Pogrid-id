"use client";

import { useState } from "react";
import { Minus, Plus, AlertTriangle } from "lucide-react";
import type { Item, UserRole } from "@/lib/types";
import { useItems, useSession } from "@/lib/store";
import { deptById } from "@/lib/mock-data";
import { showCancelToast } from "./cancel-toast";
import { cn } from "@/lib/utils";

/** OPERATOR_* expanded panel — qty stepper or slider for qty=1 */
export function OperatorPanel({
  item, onCancel, onProblem,
}: {
  item: Item;
  onCancel: () => void;
  onProblem: () => void;
}) {
  const user = useSession((s) => s.user)!;
  const scheduleProgress = useItems((s) => s.scheduleProgress);
  const pending = useItems((s) => s.pending);

  // determine which dept this operator owns
  const userDept = user.role.startsWith("OPERATOR_")
    ? user.role.replace("OPERATOR_", "")
    : null;
  const dept = userDept
    ? item.work_type.map((id) => deptById(id)).find(
        (d) => d && d.name.toUpperCase() === userDept,
      )
    : item.work_type.map((id) => deptById(id)).find(Boolean);
  if (!dept) return null;

  const progress = item.progresses.find((p) => p.departmentId === dept.id)?.progress ?? 0;
  const pendingKey = `${item.id}:${dept.id}`;
  const pendingVal = pending[pendingKey]?.optimistic;
  const displayed = pendingVal ?? progress;
  const completedQty = Math.round((displayed / 100) * item.qty);
  const [draft, setDraft] = useState(completedQty);

  const setDraftClamped = (n: number) => {
    const minVal = completedQty; // can't go below already-saved
    setDraft(Math.max(minVal, Math.min(item.qty, n)));
  };

  const save = () => {
    const pct = Math.round((draft / item.qty) * 100);
    const key = scheduleProgress(item.id, dept.id, pct);
    showCancelToast(key);
    onCancel();
  };

  if (item.qty === 1) {
    const [pct, setPct] = useState(displayed);
    return (
      <div className="space-y-3">
        <div className="text-xs font-semibold text-muted-foreground">UPDATE · {dept.name.toUpperCase()}</div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Progress</span>
          <span className="text-2xl font-bold text-brand">{pct}%</span>
        </div>
        <input
          type="range" min={displayed} max={100} value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-border accent-brand"
        />
        <button
          onClick={onProblem}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-warning text-warning text-sm font-medium pg-touch-48"
        >
          <AlertTriangle className="w-4 h-4" /> Laporkan Masalah
        </button>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-secondary text-sm font-medium pg-touch-48">Batal</button>
          <button onClick={() => {
            const key = scheduleProgress(item.id, dept.id, pct);
            showCancelToast(key); onCancel();
          }} className="flex-1 py-3 rounded-xl bg-brand text-white text-sm font-medium pg-touch-48">
            Simpan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-muted-foreground">UPDATE · {dept.name.toUpperCase()}</div>
      <div className="flex items-center justify-between text-sm">
        <span>Sudah selesai:</span>
        <span className="font-semibold">{draft}/{item.qty} pcs</span>
      </div>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setDraftClamped(draft - 1)}
          className="rounded-xl bg-secondary text-2xl font-bold flex items-center justify-center"
          style={{ width: 56, height: 48 }}
        ><Minus className="w-5 h-5" /></button>
        <div className="w-20 h-12 rounded-xl bg-surface border-2 border-brand text-center text-2xl font-bold flex items-center justify-center">
          {draft}
        </div>
        <button
          onClick={() => setDraftClamped(draft + 1)}
          className="rounded-xl bg-brand text-white flex items-center justify-center"
          style={{ width: 56, height: 48 }}
        ><Plus className="w-5 h-5" /></button>
      </div>
      <p className="text-xs text-muted-foreground text-center">Tersisa {item.qty - draft} pcs</p>
      <div className="flex flex-wrap gap-2">
        {[5, 10, 20].map((n) => (
          <button key={n} onClick={() => setDraftClamped(draft + n)}
            className="px-3 py-2 rounded-lg bg-secondary text-sm font-medium pg-touch-48">
            +{n}
          </button>
        ))}
        <button onClick={() => setDraftClamped(item.qty)}
          className="px-3 py-2 rounded-lg bg-brand-light text-brand-dark text-sm font-semibold pg-touch-48">
          Semua ({item.qty})
        </button>
      </div>
      <button
        onClick={onProblem}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-warning text-warning text-sm font-medium pg-touch-48"
      >
        <AlertTriangle className="w-4 h-4" /> Laporkan Masalah
      </button>
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-secondary text-sm font-medium pg-touch-48">Batal</button>
        <button onClick={save} disabled={draft === completedQty}
          className={cn(
            "flex-1 py-3 rounded-xl text-white text-sm font-medium pg-touch-48",
            draft === completedQty ? "bg-muted-foreground/40" : "bg-brand",
          )}>
          Simpan
        </button>
      </div>
    </div>
  );
}

export function DrafterPanel({ item, onCancel }: { item: Item; onCancel: () => void }) {
  const { approveDrawing, redrawDrawing } = useItems();
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-muted-foreground">UPDATE · DRAFTING</div>
      <div className="text-sm">{item.name} · Rev.{item.drawing_revision}</div>
      <button
        onClick={() => { approveDrawing(item.id); onCancel(); }}
        className="w-full py-3 rounded-xl bg-success text-white font-semibold pg-touch-48"
      >✅ Setujui Gambar</button>
      <button
        onClick={() => { redrawDrawing(item.id); onCancel(); }}
        className="w-full py-3 rounded-xl border border-warning text-warning font-medium pg-touch-48"
      >↩ Perlu Redraw</button>
    </div>
  );
}

export function PurchasingPanel({ item, onCancel }: { item: Item; onCancel: () => void }) {
  const schedulePurchasing = useItems((s) => s.schedulePurchasing);
  const pending = useItems((s) => s.pending);
  const pKey = `${item.id}:purchasing`;
  const current = pending[pKey]?.optimistic ?? item.purchasing_progress;

  const milestones = [
    { val: 33, label: "Order dibuat" },
    { val: 66, label: "Konfirmasi vendor" },
    { val: 100, label: "Material tiba" },
  ];
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-muted-foreground">UPDATE · PURCHASING</div>
      <div className="space-y-2">
        {milestones.map((m) => {
          const reached = current >= m.val;
          const canTap = !reached;
          return (
            <button
              key={m.val}
              disabled={!canTap}
              onClick={() => {
                const key = schedulePurchasing(item.id, m.val);
                showCancelToast(key);
                onCancel();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl border pg-touch-48 text-left",
                reached
                  ? "bg-brand-light border-brand text-brand-dark"
                  : "bg-surface border-border hover:bg-secondary",
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                reached ? "bg-brand border-brand" : "border-muted-foreground",
              )}>
                {reached && <span className="text-white text-xs">✓</span>}
              </div>
              <span className="text-sm font-medium flex-1">{m.label}</span>
              <span className="text-xs text-muted-foreground">{m.val}%</span>
            </button>
          );
        })}
      </div>
      <button onClick={onCancel}
        className="w-full py-3 rounded-xl bg-secondary text-sm font-medium pg-touch-48">Batal</button>
    </div>
  );
}
