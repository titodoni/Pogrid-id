"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StickyHeader } from "./header";
import { BottomNav } from "./bottom-nav";
import { useSession, loadSessionFromStorage } from "@/lib/store";

export function LayoutWrapper({
  title, right, children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { user, setUser } = useSession();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!user) {
      const stored = loadSessionFromStorage();
      if (stored) setUser(stored);
      else if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
        return;
      }
    }
    setHydrated(true);
  }, [user, setUser, router]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader title={title} right={right} />
      <main className="pb-24 px-4 pt-4 max-w-md mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
