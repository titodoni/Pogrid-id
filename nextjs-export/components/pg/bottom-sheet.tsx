"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function BottomSheet({
  open, onClose, title, children, dismissOnBackdrop = true,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  dismissOnBackdrop?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40 animate-backdrop-in"
        onClick={() => dismissOnBackdrop && onClose()}
        aria-hidden
      />
      <div className={cn(
        "relative w-full max-w-md bg-surface rounded-t-2xl border border-border",
        "animate-slide-up shadow-2xl max-h-[85vh] overflow-y-auto",
      )}>
        <div className="flex items-center justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        {title && (
          <h2 className="px-5 pt-2 pb-3 text-lg font-semibold">{title}</h2>
        )}
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}
