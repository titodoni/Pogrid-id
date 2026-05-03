"use client";

import { useMemo, useState } from "react";
import { Plus, KeyRound, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Info } from "lucide-react";
import { LayoutWrapper } from "@/components/pg/layout-wrapper";
import { BottomSheet } from "@/components/pg/bottom-sheet";
import { users as seedUsers, clients as seedClients } from "@/lib/mock-data";
import { roleLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "users" | "clients" | "flags";

function SettingsPage() {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <LayoutWrapper title="Kelola">
      <div className="flex gap-2 mb-4">
        {(["users", "clients", "flags"] as Tab[]).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors pg-touch-48",
              tab === k ? "bg-brand text-white" : "bg-surface border border-border text-muted-foreground",
            )}>
            {k === "users" ? "Users" : k === "clients" ? "Klien" : "Flags"}
          </button>
        ))}
      </div>

      {tab === "users" && <UsersTab />}
      {tab === "clients" && <ClientsTab />}
      {tab === "flags" && <FlagsTab />}
    </LayoutWrapper>
  );
}

/* ========================================================
   Users Tab — list + inline expand + add user form
   ======================================================== */

function easyPin() {
  const easy = ["2468","1357","3691","2580","1470","9630","1234","4321","8642","2024"];
  return easy[Math.floor(Math.random() * easy.length)];
}

function UsersTab() {
  const [users, setUsers] = useState(seedUsers);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resetPins, setResetPins] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", username: "", role: "ADMIN" });
  const [createdPin, setCreatedPin] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const toggle = (id: string) => {
    setUsers((p) => p.map((u) => u.id === id ? { ...u, isActive: !u.isActive } : u));
    showToast("Status user diperbarui ✓");
  };

  const resetPin = (id: string) => {
    const pin = easyPin();
    setResetPins((p) => ({ ...p, [id]: pin }));
    showToast(`PIN baru: ${pin}`);
  };

  const submitNewUser = () => {
    if (!newUser.name.trim() || !newUser.username.trim()) return;
    const pin = easyPin();
    const created = {
      id: `u-${Date.now()}`,
      username: newUser.username.trim(),
      name: newUser.name.trim(),
      role: newUser.role as typeof users[number]["role"],
      isActive: true,
    };
    setUsers((p) => [created, ...p]);
    setCreatedPin(pin);
  };

  const closeAddForm = () => {
    setAdding(false);
    setNewUser({ name: "", username: "", role: "ADMIN" });
    setCreatedPin(null);
  };

  return (
    <div className="space-y-2">
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-1 py-3 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:bg-secondary pg-touch-48"
        >
          <Plus className="w-4 h-4" /> Tambah User
        </button>
      ) : (
        <div className="pg-card border-brand/30">
          {!createdPin ? (
            <>
              <h3 className="text-sm font-semibold mb-3">Tambah User Baru</h3>
              <input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Nama lengkap"
                className="w-full px-3 py-3 rounded-xl border bg-surface text-sm mb-2 pg-touch-48" />
              <input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="Username"
                className="w-full px-3 py-3 rounded-xl border bg-surface text-sm mb-2 pg-touch-48" />
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-3 py-3 rounded-xl border bg-surface text-sm mb-3 pg-touch-48">
                {["ADMIN","OWNER","MANAGER","SALES","FINANCE","DRAFTER","PURCHASING","QC","DELIVERY",
                  "OPERATOR_MACHINING","OPERATOR_FABRIKASI","OPERATOR_FINISHING"].map((r) => (
                  <option key={r} value={r}>{roleLabel(r as never)}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button onClick={closeAddForm}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-sm font-medium pg-touch-48">Batal</button>
                <button onClick={submitNewUser}
                  className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold pg-touch-48">
                  Buat User
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-success text-white flex items-center justify-center text-xl mb-2">✓</div>
              <h3 className="text-sm font-semibold">User berhasil dibuat</h3>
              <p className="text-xs text-muted-foreground mt-1">Catat PIN ini & kirim ke user:</p>
              <div className="my-3 px-4 py-3 rounded-xl bg-brand-light text-brand-dark font-mono text-2xl font-bold tracking-[0.4em]">
                {createdPin}
              </div>
              <button onClick={closeAddForm}
                className="w-full py-2.5 rounded-xl bg-brand text-white text-sm font-semibold pg-touch-48">
                Selesai
              </button>
            </div>
          )}
        </div>
      )}

      {users.map((u) => {
        const expanded = expandedId === u.id;
        const newPin = resetPins[u.id];
        return (
          <div key={u.id} className="pg-card !p-0 overflow-hidden">
            <button
              onClick={() => setExpandedId(expanded ? null : u.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left pg-touch-48"
            >
              <div className={cn(
                "w-10 h-10 rounded-full text-white text-sm font-semibold flex items-center justify-center",
                u.isActive ? "bg-brand" : "bg-muted-foreground",
              )}>
                {u.name.split(" ").slice(0,2).map((n) => n[0]).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{u.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {roleLabel(u.role)} · @{u.username}
                </div>
              </div>
              {!u.isActive && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">NONAKTIF</span>}
              {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {expanded && (
              <div className="px-4 pb-4 pt-1 border-t border-border space-y-2 animate-fade-in">
                <button onClick={() => resetPin(u.id)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary text-sm font-medium pg-touch-48">
                  <KeyRound className="w-4 h-4 text-brand" /> Reset PIN
                </button>
                {newPin && (
                  <div className="px-3 py-2 rounded-lg bg-brand-light text-brand-dark text-center">
                    <div className="text-[10px] font-semibold tracking-wider">PIN BARU</div>
                    <div className="font-mono text-xl font-bold tracking-[0.3em]">{newPin}</div>
                  </div>
                )}
                <button onClick={() => toggle(u.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium pg-touch-48",
                    u.isActive ? "bg-secondary text-foreground" : "bg-success/10 text-success",
                  )}>
                  {u.isActive ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4" />}
                  {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[60] px-4 py-2 rounded-full bg-foreground text-background text-sm shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ========================================================
   Clients Tab
   ======================================================== */

function ClientsTab() {
  const [clients, setClients] = useState(seedClients);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) return;
    setClients((p) => [{ id: `c-${Date.now()}`, name: name.trim() }, ...p]);
    setName(""); setOpen(false);
    setToast("Klien ditambahkan ✓");
    setTimeout(() => setToast(null), 1800);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1 py-3 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:bg-secondary pg-touch-48"
      >
        <Plus className="w-4 h-4" /> Tambah Klien
      </button>
      {clients.map((c) => (
        <div key={c.id} className="pg-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-light text-brand-dark text-xs font-bold flex items-center justify-center">
            {c.name.replace(/[^A-Z]/g, "").slice(0,2) || c.name.slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1 text-sm font-semibold">{c.name}</div>
        </div>
      ))}

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Tambah Klien">
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Nama perusahaan"
          className="w-full px-3 py-3 rounded-xl border bg-surface text-sm pg-touch-48 mb-3" autoFocus />
        <div className="flex gap-2">
          <button onClick={() => setOpen(false)}
            className="flex-1 py-3 rounded-xl bg-secondary text-sm font-medium pg-touch-48">Batal</button>
          <button onClick={submit} disabled={!name.trim()}
            className={cn("flex-1 py-3 rounded-xl text-white text-sm font-semibold pg-touch-48",
              name.trim() ? "bg-brand" : "bg-muted-foreground/40")}>
            Simpan
          </button>
        </div>
      </BottomSheet>

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[60] px-4 py-2 rounded-full bg-foreground text-background text-sm shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ========================================================
   Flags Tab — read-only
   ======================================================== */

function FlagsTab() {
  return (
    <div className="space-y-3">
      <div className="pg-card flex items-start gap-2 bg-brand-light/40">
        <Info className="w-4 h-4 text-brand-dark mt-0.5 flex-shrink-0" />
        <p className="text-xs text-brand-dark">
          Threshold diatur oleh Superadmin. Hubungi platform owner untuk mengubah.
        </p>
      </div>

      <FlagRow level="NORMAL" color="bg-success" label="Normal" desc="Default — > 7 hari ke deadline" hex="#16A34A" />
      <FlagRow level="ORANGE" color="bg-warning" label="Mendekati" desc="≤ 7 hari (Threshold 1)" hex="#F97316" />
      <FlagRow level="RED" color="bg-danger" label="Mendesak" desc="≤ 3 hari (Threshold 2)" hex="#EF4444" />
      <FlagRow level="BLOOD" color="bg-blood" label="Terlambat" desc="Sudah lewat tanggal" hex="#7F1D1D" />
    </div>
  );
}

function FlagRow({ color, label, desc, hex }: {
  level: string; color: string; label: string; desc: string; hex: string;
}) {
  return (
    <div className="pg-card flex items-center gap-3">
      <div className={cn("w-1.5 h-12 rounded-full", color)} />
      <div className="flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <span className="text-xs font-mono text-muted-foreground">{hex}</span>
    </div>
  );
}

export default SettingsPage;
