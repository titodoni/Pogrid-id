"use client";

import { useState } from "react";
import { LogOut, KeyRound } from "lucide-react";
import { LayoutWrapper } from "@/components/pg/layout-wrapper";
import { useSession } from "@/lib/store";
import { roleLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function ProfilPage() {
  const { user, logout } = useSession();
  const [pinMode, setPinMode] = useState(false);
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!user) return null;

  const submitPin = () => {
    if (pin1.length !== 4 || pin2.length !== 4) return;
    if (pin1 !== pin2) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setToast("PIN berhasil diubah ✓");
    setPin1(""); setPin2(""); setPinMode(false);
    setTimeout(() => setToast(null), 2500);
  };

  const handleLogout = () => {
    logout();
    if (typeof window !== "undefined") window.location.href = "/login";
  };

  return (
    <LayoutWrapper title="Profil">
      <div className={cn("pg-card flex items-center gap-3 mb-4", shake && "animate-shake")}>
        <div className="w-16 h-16 rounded-full bg-brand text-white text-lg font-semibold flex items-center justify-center">
          {initials(user.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base truncate">{user.name}</div>
          <div className="text-sm text-muted-foreground truncate">{roleLabel(user.role)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">@{user.username}</div>
        </div>
      </div>

      {!pinMode ? (
        <>
          <button
            onClick={() => setPinMode(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border hover:bg-secondary transition-colors text-left pg-touch-48 mb-2"
          >
            <KeyRound className="w-5 h-5 text-brand" />
            <span className="flex-1 text-sm font-medium">Ganti PIN</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-danger text-white text-sm font-semibold pg-touch-48 mt-3"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>

          <p className="text-center text-[11px] text-muted-foreground mt-6">
            POgrid v0.1 · prototype
          </p>
        </>
      ) : (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Ganti PIN</h2>
          <p className="text-xs text-muted-foreground">Tidak perlu PIN lama. Pastikan kamu mengingatnya.</p>
          <div>
            <label className="text-sm font-semibold">PIN Baru (4 digit)</label>
            <input
              inputMode="numeric" maxLength={4} value={pin1}
              onChange={(e) => setPin1(e.target.value.replace(/\D/g, ""))}
              className="mt-1 w-full px-4 py-3 rounded-xl border bg-surface text-center text-2xl tracking-[0.5em] font-mono pg-touch-48"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Konfirmasi PIN</label>
            <input
              inputMode="numeric" maxLength={4} value={pin2}
              onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))}
              className="mt-1 w-full px-4 py-3 rounded-xl border bg-surface text-center text-2xl tracking-[0.5em] font-mono pg-touch-48"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setPinMode(false); setPin1(""); setPin2(""); }}
              className="flex-1 px-4 py-3 rounded-xl bg-secondary text-sm font-medium pg-touch-48"
            >Batal</button>
            <button
              onClick={submitPin}
              disabled={pin1.length !== 4 || pin2.length !== 4}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl text-white text-sm font-medium pg-touch-48",
                pin1.length === 4 && pin2.length === 4 ? "bg-brand" : "bg-muted-foreground/40",
              )}
            >Simpan</button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[60] px-4 py-2 rounded-full bg-foreground text-background text-sm shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </LayoutWrapper>
  );
}

export default ProfilPage;
