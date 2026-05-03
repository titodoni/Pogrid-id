"use client";

import { Bell, LogOut, KeyRound, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/store";
import { roleLabel } from "@/lib/types";
import { BottomSheet } from "./bottom-sheet";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function ProfileAvatar({ size = 32 }: { size?: 32 | 48 }) {
  const user = useSession((s) => s.user);
  const [open, setOpen] = useState(false);
  if (!user) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Profil"
        className={cn(
          "rounded-full bg-brand text-white font-semibold flex items-center justify-center",
          size === 32 ? "w-8 h-8 text-xs" : "w-12 h-12 text-base",
        )}
      >
        {initials(user.name)}
      </button>
      <ProfileDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ProfileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
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
    <BottomSheet open={open} onClose={onClose}>
      <div className={cn("flex items-center gap-3 mb-4", shake && "animate-shake")}>
        <div className="w-12 h-12 rounded-full bg-brand text-white font-semibold flex items-center justify-center">
          {initials(user.name)}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{user.name}</div>
          <div className="text-sm text-muted-foreground">{roleLabel(user.role)}</div>
        </div>
        <button onClick={onClose} aria-label="Tutup" className="pg-touch-48 flex items-center justify-center">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {!pinMode ? (
        <div className="space-y-2">
          <button
            onClick={() => setPinMode(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary hover:bg-accent transition-colors text-left pg-touch-48"
          >
            <KeyRound className="w-5 h-5 text-brand" />
            <span className="text-sm font-medium">Ganti PIN</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary hover:bg-accent transition-colors text-left pg-touch-48"
          >
            <LogOut className="w-5 h-5 text-danger" />
            <span className="text-sm font-medium text-danger">Keluar</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
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
              className="flex-1 px-4 py-3 rounded-xl bg-brand text-white text-sm font-medium pg-touch-48"
            >Simpan</button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[60] px-4 py-2 rounded-full bg-foreground text-background text-sm shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </BottomSheet>
  );
}

export function StickyHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 h-14 bg-surface border-b border-border flex items-center justify-between px-4">
      <h1 className="text-lg font-semibold truncate flex-1">{title}</h1>
      <div className="flex items-center gap-1">
        {right}
        <button aria-label="Notifikasi" className="pg-touch-48 flex items-center justify-center relative">
          <Bell className="w-5 h-5 text-foreground" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger" />
        </button>
      </div>
    </header>
  );
}
