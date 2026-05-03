"use client";

import { useEffect, useState } from "react";
import { useItems } from "@/lib/store";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

/**
 * 5-second cancel toast — appears after a Save action.
 * Visible at most one toast at a time (singleton store).
 */
interface ToastState {
  key: string;
  message: string;
  startedAt: number;
}

let listeners: Array<(t: ToastState | null) => void> = [];
let current: ToastState | null = null;

export function showCancelToast(key: string, message = "Progress disimpan ✓") {
  current = { key, message, startedAt: Date.now() };
  listeners.forEach((l) => l(current));
}

function clearToast() {
  current = null;
  listeners.forEach((l) => l(null));
}

export function CancelToast() {
  const [t, setT] = useState<ToastState | null>(current);
  const cancelPending = useItems((s) => s.cancelPending);
  const pending = useItems((s) => s.pending);

  useEffect(() => {
    listeners.push(setT);
    return () => { listeners = listeners.filter((l) => l !== setT); };
  }, []);

  // Auto-dismiss after 5s
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!t) { setProgress(0); return; }
    setProgress(0);
    const interval = setInterval(() => {
      const elapsed = Date.now() - t.startedAt;
      const pct = Math.min(100, (elapsed / 5000) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        clearToast();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [t]);

  if (!t) return null;
  const stillPending = !!pending[t.key];
  if (!stillPending && progress < 100) {
    // user cancelled elsewhere
    clearToast();
    return null;
  }

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[60] w-[calc(100%-2rem)] max-w-sm animate-fade-in">
      <div className="bg-foreground text-background rounded-xl shadow-xl px-4 py-3 flex items-center gap-3">
        <span className="text-sm font-medium flex-1">{t.message} — Batalkan?</span>
        <button
          onClick={() => { cancelPending(t.key); clearToast(); }}
          className="px-3 py-1.5 rounded-lg bg-warning text-white text-xs font-bold pg-touch-48"
        >Batalkan</button>
        <button onClick={clearToast} aria-label="Tutup" className="text-background/60">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="h-1 bg-foreground/30 rounded-b-xl overflow-hidden">
        <div className="h-full bg-warning transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
