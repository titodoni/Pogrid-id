"use client";

import { useState } from "react";
import { Minus, Plus, Check } from "lucide-react";
import { BottomSheet } from "./bottom-sheet";
import { useItems, useSession } from "@/lib/store";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";

const QC_REASONS = [
  "Dimensi tidak sesuai",
  "Surface/finishing NG",
  "Retak/crack",
  "Salah material",
  "Lainnya",
];

const PROBLEM_CATEGORIES = [
  "Material belum datang",
  "Material tidak sesuai",
  "Mesin bermasalah",
  "Operator tidak tersedia",
  "Gambar tidak jelas",
  "Lainnya",
];

/* ---------- QC Gate ---------- */
export function QCGateSheet({
  item, open, onClose,
}: { item: Item; open: boolean; onClose: () => void }) {
  const { qcPass, qcMinor, qcMajor } = useItems();
  const [pass, setPass] = useState(item.qty);
  const [minor, setMinor] = useState(0);
  const [major, setMajor] = useState(0);
  const [reason, setReason] = useState(QC_REASONS[0]);
  const [otherText, setOtherText] = useState("");

  const total = pass + minor + major;
  const valid = total === item.qty;

  const submit = () => {
    if (!valid) return;
    const finalReason = reason === "Lainnya" ? otherText || "Lainnya" : reason;
    if (major > 0) qcMajor(item.id, major, finalReason);
    else if (minor > 0) qcMinor(item.id, finalReason);
    else qcPass(item.id);
    onClose();
  };

  const Stepper = ({
    label, value, setValue, color,
  }: { label: string; value: number; setValue: (n: number) => void; color: string }) => (
    <div className="flex items-center gap-3">
      <span className={cn("flex-1 text-sm font-medium", color)}>{label}</span>
      <button onClick={() => setValue(Math.max(0, value - 1))}
        className="rounded-lg bg-secondary flex items-center justify-center"
        style={{ width: 48, height: 40 }}><Minus className="w-4 h-4" /></button>
      <span className="w-10 text-center text-lg font-bold">{value}</span>
      <button onClick={() => setValue(Math.min(item.qty, value + 1))}
        className="rounded-lg bg-secondary flex items-center justify-center"
        style={{ width: 48, height: 40 }}><Plus className="w-4 h-4" /></button>
    </div>
  );

  return (
    <BottomSheet open={open} onClose={onClose} title="QC Gate">
      <p className="text-sm text-muted-foreground mb-3">
        {item.name} · Total: {item.qty} pcs
      </p>
      <div className="space-y-3 mb-4">
        <Stepper label="✅ Lolos" value={pass} setValue={setPass} color="text-success" />
        <Stepper label="⚠ Minor" value={minor} setValue={setMinor} color="text-warning" />
        <Stepper label="❌ Mayor" value={major} setValue={setMajor} color="text-danger" />
      </div>
      {(minor > 0 || major > 0) && (
        <div className="mb-4">
          <label className="text-sm font-semibold">Alasan</label>
          <div className="mt-2 space-y-1">
            {QC_REASONS.map((r) => (
              <label key={r} className="flex items-center gap-2 py-2 pg-touch-48">
                <input type="radio" name="qc-reason" checked={reason === r}
                  onChange={() => setReason(r)} className="accent-brand" />
                <span className="text-sm">{r}</span>
              </label>
            ))}
            {reason === "Lainnya" && (
              <input value={otherText} onChange={(e) => setOtherText(e.target.value)}
                placeholder="Catatan..."
                className="mt-2 w-full px-3 py-2 rounded-lg border bg-surface text-sm" />
            )}
          </div>
        </div>
      )}
      <div className={cn("text-xs mb-3", valid ? "text-success" : "text-danger")}>
        Total: {total}/{item.qty} {valid ? "✓" : "(harus = " + item.qty + ")"}
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-secondary text-sm font-medium pg-touch-48">
          Batalkan
        </button>
        <button onClick={submit} disabled={!valid}
          className={cn("flex-1 py-3 rounded-xl text-white text-sm font-semibold pg-touch-48",
            valid ? "bg-brand" : "bg-muted-foreground/40")}>
          Konfirmasi
        </button>
      </div>
    </BottomSheet>
  );
}

/* ---------- Delivery Gate ---------- */
export function DeliveryGateSheet({
  item, open, onClose,
}: { item: Item; open: boolean; onClose: () => void }) {
  const deliverConfirm = useItems((s) => s.deliverConfirm);
  const [qty, setQty] = useState(item.qty);

  return (
    <BottomSheet open={open} onClose={onClose} title="🚚 Konfirmasi Pengiriman">
      <p className="text-sm text-muted-foreground mb-2">{item.name}</p>
      <div className="flex items-center justify-center gap-3 my-4">
        <button onClick={() => setQty(Math.max(1, qty - 1))}
          className="rounded-xl bg-secondary flex items-center justify-center"
          style={{ width: 56, height: 48 }}><Minus className="w-5 h-5" /></button>
        <div className="w-24 h-12 rounded-xl bg-surface border-2 border-brand text-center text-2xl font-bold flex items-center justify-center">
          {qty}
        </div>
        <button onClick={() => setQty(Math.min(item.qty, qty + 1))}
          className="rounded-xl bg-brand text-white flex items-center justify-center"
          style={{ width: 56, height: 48 }}><Plus className="w-5 h-5" /></button>
      </div>
      <button onClick={() => setQty(item.qty)}
        className="w-full py-2 rounded-lg bg-brand-light text-brand-dark text-sm font-semibold mb-4 pg-touch-48">
        Semua ({item.qty})
      </button>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-secondary text-sm font-medium pg-touch-48">
          Batalkan
        </button>
        <button onClick={() => { deliverConfirm(item.id); onClose(); }}
          className="flex-1 py-3 rounded-xl bg-success text-white text-sm font-semibold pg-touch-48">
          ✅ Sudah Dikirim
        </button>
      </div>
    </BottomSheet>
  );
}

/* ---------- Problem Sheet ---------- */
export function ProblemSheet({
  item, open, onClose,
}: { item: Item; open: boolean; onClose: () => void }) {
  const reportProblem = useItems((s) => s.reportProblem);
  const user = useSession((s) => s.user);
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  const requireNote = category === "Lainnya";
  const valid = !!category && (!requireNote || note.trim().length > 0);

  return (
    <BottomSheet open={open} onClose={onClose} title="⚠ Laporkan Masalah">
      <p className="text-sm text-muted-foreground mb-3">{item.name}</p>
      <label className="text-sm font-semibold">Kategori</label>
      <select value={category} onChange={(e) => setCategory(e.target.value)}
        className="mt-1 w-full px-3 py-3 rounded-xl border bg-surface text-sm pg-touch-48">
        <option value="">Pilih kategori...</option>
        {PROBLEM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <label className="text-sm font-semibold mt-3 block">
        Catatan {requireNote && <span className="text-danger">*</span>}
      </label>
      <textarea value={note} onChange={(e) => setNote(e.target.value)}
        rows={3}
        className="mt-1 w-full px-3 py-2 rounded-xl border bg-surface text-sm" />
      <div className="flex gap-2 mt-4">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-secondary text-sm font-medium pg-touch-48">
          Batal
        </button>
        <button
          onClick={() => {
            if (!valid || !user) return;
            reportProblem(item.id, category, note, user.id);
            setCategory(""); setNote("");
            onClose();
          }}
          disabled={!valid}
          className={cn("flex-1 py-3 rounded-xl text-white text-sm font-semibold pg-touch-48",
            valid ? "bg-warning" : "bg-muted-foreground/40")}>
          Kirim Laporan
        </button>
      </div>
    </BottomSheet>
  );
}
