"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Item, User } from "./types";
import { items as seedItems, problems as seedProblems } from "./mock-data";
import type { Problem } from "./types";

interface SessionState {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
}

export const useSession = create<SessionState>()((set) => ({
  user: null,
  setUser: (user) => {
    if (typeof window !== "undefined") {
      if (user) localStorage.setItem("pg-user", JSON.stringify(user));
      else localStorage.removeItem("pg-user");
    }
    set({ user });
  },
  logout: () => {
    if (typeof window !== "undefined") localStorage.removeItem("pg-user");
    set({ user: null });
  },
}));

export function loadSessionFromStorage(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("pg-user");
    return raw ? (JSON.parse(raw) as User) : null;
  } catch { return null; }
}

/* ============================================================
   Items store — handles 5-second cancel window per spec
   ============================================================ */

interface PendingUpdate {
  itemId: string;
  departmentId?: string;
  optimistic: number;        // value shown immediately
  previous: number;          // rollback value
  field: "progress" | "purchasing";
  startedAt: number;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface ItemsState {
  items: Item[];
  problems: Problem[];
  pending: Record<string, PendingUpdate>; // key = itemId+dept
  /** Schedule a progress update with a 5s cancel window */
  scheduleProgress: (
    itemId: string,
    departmentId: string,
    nextValue: number,
    onCommit?: () => void,
  ) => string;
  /** Schedule purchasing milestone — same window */
  schedulePurchasing: (
    itemId: string,
    nextValue: number,
    onCommit?: () => void,
  ) => string;
  cancelPending: (key: string) => void;
  approveDrawing: (itemId: string) => void;
  redrawDrawing: (itemId: string) => void;
  /** QC paths */
  qcPass: (itemId: string) => void;
  qcMinor: (itemId: string, reason: string) => void;
  qcMajor: (itemId: string, ngQty: number, reason: string) => void;
  /** Delivery */
  deliverConfirm: (itemId: string) => void;
  /** Problem report */
  reportProblem: (itemId: string, category: string, note: string, reportedBy: string) => void;
  resolveProblem: (problemId: string) => void;
}

const CANCEL_WINDOW_MS = 5000;

export const useItems = create<ItemsState>()(
  immer((set, get) => ({
    items: seedItems,
    problems: seedProblems,
    pending: {},

    scheduleProgress: (itemId, departmentId, nextValue, onCommit) => {
      const key = `${itemId}:${departmentId}`;
      const item = get().items.find((i) => i.id === itemId);
      const current =
        item?.progresses.find((p) => p.departmentId === departmentId)?.progress ?? 0;
      // progress only increases
      const optimistic = Math.max(current, nextValue);

      // cancel any existing pending for this key
      const existing = get().pending[key];
      if (existing) clearTimeout(existing.timeoutId);

      const timeoutId = setTimeout(() => {
        set((s) => {
          const it = s.items.find((i) => i.id === itemId);
          if (it) {
            const p = it.progresses.find((pp) => pp.departmentId === departmentId);
            if (p) p.progress = optimistic;
            // auto-advance: if all progresses 100% and status PRODUCTION → QC
            if (
              it.status === "PRODUCTION" &&
              it.progresses.every((pp) => pp.progress >= 100)
            ) {
              it.status = "QC";
              it.progresses.forEach((pp) => (pp.progress = 0));
            }
          }
          delete s.pending[key];
        });
        onCommit?.();
      }, CANCEL_WINDOW_MS);

      set((s) => {
        s.pending[key] = {
          itemId, departmentId, optimistic, previous: current,
          field: "progress", startedAt: Date.now(), timeoutId,
        };
      });
      return key;
    },

    schedulePurchasing: (itemId, nextValue, onCommit) => {
      const key = `${itemId}:purchasing`;
      const item = get().items.find((i) => i.id === itemId);
      const current = item?.purchasing_progress ?? 0;
      const optimistic = Math.max(current, nextValue);

      const existing = get().pending[key];
      if (existing) clearTimeout(existing.timeoutId);

      const timeoutId = setTimeout(() => {
        set((s) => {
          const it = s.items.find((i) => i.id === itemId);
          if (it) {
            it.purchasing_progress = optimistic;
            if (it.status === "PURCHASING" && optimistic >= 100) {
              it.status = "PRODUCTION";
            }
          }
          delete s.pending[key];
        });
        onCommit?.();
      }, CANCEL_WINDOW_MS);

      set((s) => {
        s.pending[key] = {
          itemId, optimistic, previous: current,
          field: "purchasing", startedAt: Date.now(), timeoutId,
        };
      });
      return key;
    },

    cancelPending: (key) => {
      const p = get().pending[key];
      if (!p) return;
      clearTimeout(p.timeoutId);
      set((s) => { delete s.pending[key]; });
    },

    approveDrawing: (itemId) => set((s) => {
      const it = s.items.find((i) => i.id === itemId);
      if (it) { it.drawing_approved = true; it.status = "PURCHASING"; }
    }),
    redrawDrawing: (itemId) => set((s) => {
      const it = s.items.find((i) => i.id === itemId);
      if (it) {
        it.drawing_revision += 1;
        s.problems.unshift({
          id: `p-${Date.now()}`, itemId, reportedBy: "system",
          source: "SYSTEM", category: "Gambar perlu redraw",
          note: `Revisi ke-${it.drawing_revision}`, resolved: false,
          createdAt: new Date().toISOString(),
        });
      }
    }),

    qcPass: (itemId) => set((s) => {
      const it = s.items.find((i) => i.id === itemId);
      if (it) { it.status = "DELIVERY"; it.progresses.forEach((p) => (p.progress = 0)); }
    }),
    qcMinor: (itemId, reason) => set((s) => {
      const it = s.items.find((i) => i.id === itemId);
      if (it) {
        it.is_rework = true; it.rework_type = "MINOR"; it.rework_reason = reason;
        it.progresses.forEach((p) => (p.progress = 0));
      }
    }),
    qcMajor: (itemId, ngQty, reason) => set((s) => {
      const it = s.items.find((i) => i.id === itemId);
      if (!it) return;
      const passing = it.qty - ngQty;
      if (passing > 0) {
        it.qty = passing; it.status = "DELIVERY";
        it.progresses.forEach((p) => (p.progress = 0));
      }
      // child rework card
      const child: Item = {
        ...it,
        id: `i-rw-${Date.now()}`,
        qty: ngQty, status: "PRODUCTION",
        is_rework: true, rework_type: "MAJOR", rework_reason: reason,
        source: "REWORK", parentItemId: it.id, parentItemName: it.name,
        progresses: it.progresses.map((p) => ({ ...p, progress: 0 })),
        problemsOpen: 0,
      };
      s.items.push(child);
    }),
    deliverConfirm: (itemId) => set((s) => {
      const it = s.items.find((i) => i.id === itemId);
      if (it) { it.status = "DONE"; it.done_at = new Date().toISOString(); }
    }),

    reportProblem: (itemId, category, note, reportedBy) => set((s) => {
      const it = s.items.find((i) => i.id === itemId);
      if (it) it.problemsOpen += 1;
      s.problems.unshift({
        id: `p-${Date.now()}`, itemId, reportedBy, source: "OPERATOR",
        category, note, resolved: false, createdAt: new Date().toISOString(),
      });
    }),
    resolveProblem: (problemId) => set((s) => {
      const p = s.problems.find((pp) => pp.id === problemId);
      if (p) {
        p.resolved = true;
        const it = s.items.find((i) => i.id === p.itemId);
        if (it && it.problemsOpen > 0) it.problemsOpen -= 1;
      }
    }),
  })),
);
