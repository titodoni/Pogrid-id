"use client";

import { useEffect } from "react";
import { loadSessionFromStorage } from "@/lib/store";
import { roleHome } from "@/lib/types";

function IndexRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const u = loadSessionFromStorage();
    window.location.replace(u ? roleHome(u.role) : "/login");
  }, []);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-sm text-muted-foreground">Memuat POgrid…</div>
    </div>
  );
}

export default IndexRedirect;
