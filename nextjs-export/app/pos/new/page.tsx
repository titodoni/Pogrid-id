"use client";

import { useMemo, useState } from "react";
import { Trash2, Plus, ArrowLeft, Zap, Building2 } from "lucide-react";
import { LayoutWrapper } from "@/components/pg/layout-wrapper";
import { clients, departments, pos as seedPos, generateNextPoNumber } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface DraftItem {
  id: string;
  name: string;
  spec: string;
  qty: number;
  unit: string;
  work_type: string[];
}

function NewPOPage() {
  const navigate = useRouter();
  const [clientId, setClientId] = useState("");
  const [poClientNumber, setPoClientNumber] = useState("");
  const [poDate, setPoDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isVendor, setIsVendor] = useState(false);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([
    { id: crypto.randomUUID(), name: "", spec: "", qty: 1, unit: "pcs", work_type: [] },
  ]);
  const [submitted, setSubmitted] = useState(false);

  const nextPoNumber = useMemo(() => generateNextPoNumber(seedPos), []);

  const updateItem = (id: string, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const removeItem = (id: string) =>
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((it) => it.id !== id)));
  const addItem = () =>
    setItems((prev) => [...prev, { id: crypto.randomUUID(), name: "", spec: "", qty: 1, unit: "pcs", work_type: [] }]);

  const canSubmit =
    !!clientId && !!poClientNumber.trim() && !!dueDate && !!poDate &&
    items.length > 0 &&
    items.every((it) => it.name.trim() && it.qty > 0 && it.work_type.length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitted(true);
    setTimeout(() => navigate.push("/pos"), 1200);
  };

  if (submitted) {
    return (
      <LayoutWrapper title="Buat PO">
        <div className="pg-card text-center py-12">
          <div className="w-16 h-16 mx-auto rounded-full bg-success text-white flex items-center justify-center text-3xl mb-3">✓</div>
          <h2 className="text-lg font-semibold">PO {nextPoNumber} berhasil dibuat</h2>
          <p className="text-sm text-muted-foreground mt-1">Mengarahkan ke daftar PO…</p>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper title="Buat PO Baru">
      <button onClick={() => navigate.push("/pos")}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-3 pg-touch-48">
        <ArrowLeft className="w-4 h-4" /> Batal
      </button>

      <div className="pg-card mb-3 bg-brand-light/40 border-brand/30">
        <div className="text-xs text-muted-foreground">No. PO Internal (otomatis)</div>
        <div className="text-base font-bold text-brand-dark">{nextPoNumber}</div>
      </div>

      <div className="space-y-3">
        <Field label="Klien *">
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-3 rounded-xl border bg-surface text-sm pg-touch-48">
            <option value="">— Pilih klien —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>

        <Field label="No. PO Klien *">
          <input value={poClientNumber} onChange={(e) => setPoClientNumber(e.target.value)}
            placeholder="cth. SB-451"
            className="w-full px-3 py-3 rounded-xl border bg-surface text-sm pg-touch-48" />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Tgl PO *">
            <input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border bg-surface text-sm pg-touch-48" />
          </Field>
          <Field label="Jatuh Tempo *">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border bg-surface text-sm pg-touch-48" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <ToggleCard active={isUrgent} onClick={() => setIsUrgent(!isUrgent)} icon={Zap} label="Urgent" tone="danger" />
          <ToggleCard active={isVendor} onClick={() => setIsVendor(!isVendor)} icon={Building2} label="Job Vendor" tone="navy" />
        </div>

        <Field label="Catatan (opsional)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            placeholder="Catatan internal…"
            className="w-full px-3 py-2 rounded-xl border bg-surface text-sm" />
        </Field>
      </div>

      <h2 className="text-sm font-semibold mt-6 mb-2">Item ({items.length})</h2>
      {items.map((it, idx) => (
        <div key={it.id} className="pg-card mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Item #{idx + 1}</span>
            {items.length > 1 && (
              <button onClick={() => removeItem(it.id)} aria-label="Hapus item"
                className="pg-touch-48 flex items-center justify-center text-danger">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <input value={it.name} onChange={(e) => updateItem(it.id, { name: e.target.value })}
            placeholder="Nama item *"
            className="w-full px-3 py-3 rounded-xl border bg-surface text-sm mb-2 pg-touch-48" />
          <input value={it.spec} onChange={(e) => updateItem(it.id, { spec: e.target.value })}
            placeholder="Spesifikasi (opsional, cth. MS plate 6mm)"
            className="w-full px-3 py-2 rounded-xl border bg-surface text-xs mb-2" />
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-muted-foreground">Qty:</label>
            <input type="number" min={1} value={it.qty}
              onChange={(e) => updateItem(it.id, { qty: Math.max(1, parseInt(e.target.value || "1")) })}
              className="w-20 px-3 py-2 rounded-xl border bg-surface text-sm text-center pg-touch-48" />
            <select value={it.unit} onChange={(e) => updateItem(it.id, { unit: e.target.value })}
              className="px-3 py-2 rounded-xl border bg-surface text-sm pg-touch-48">
              <option value="pcs">pcs</option>
              <option value="set">set</option>
              <option value="unit">unit</option>
              <option value="kg">kg</option>
              <option value="m">m</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Jenis pekerjaan: *</div>
            <div className="flex flex-wrap gap-2">
              {departments.filter((d) => d.active).map((d) => {
                const on = it.work_type.includes(d.id);
                return (
                  <button key={d.id}
                    onClick={() => updateItem(it.id, {
                      work_type: on ? it.work_type.filter((x) => x !== d.id) : [...it.work_type, d.id],
                    })}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors pg-touch-48",
                      on ? "bg-brand text-white" : "bg-surface border border-border text-muted-foreground",
                    )}>
                    {d.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      <button onClick={addItem}
        className="w-full flex items-center justify-center gap-1 px-3 py-3 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:bg-secondary pg-touch-48">
        <Plus className="w-4 h-4" /> Tambah item
      </button>

      <div className="sticky bottom-20 mt-6 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-t border-border">
        <button onClick={handleSubmit} disabled={!canSubmit}
          className={cn(
            "w-full py-3 rounded-xl text-sm font-semibold transition-colors pg-touch-48",
            canSubmit ? "bg-brand text-white" : "bg-secondary text-muted-foreground cursor-not-allowed",
          )}>
          Buat PO
        </button>
      </div>
    </LayoutWrapper>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold mb-1 inline-block">{label}</span>
      {children}
    </label>
  );
}

function ToggleCard({ active, onClick, icon: Icon, label, tone }: {
  active: boolean; onClick: () => void; icon: any; label: string; tone: "danger" | "navy";
}) {
  const onCls = tone === "danger" ? "border-danger bg-[oklch(0.96_0.06_25)] text-danger" : "border-navy bg-[oklch(0.94_0.04_240)] text-navy";
  return (
    <button onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all pg-touch-48",
        active ? onCls : "border-border bg-surface text-muted-foreground",
      )}>
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      <span className={cn("ml-auto w-4 h-4 rounded-full border-2", active ? "bg-current border-current" : "border-border")} />
    </button>
  );
}

export default NewPOPage;
