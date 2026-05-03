"use client";

import { useMemo, useState } from "react";
import {
  Wrench, Hammer, Sparkles, ClipboardList, ShoppingCart,
  ShieldCheck, Truck, Crown, Briefcase, Tag, Calculator, Delete, ChevronLeft,
} from "lucide-react";
import { departments, users } from "@/lib/mock-data";
import type { UserRole, User } from "@/lib/types";
import { roleLabel } from "@/lib/types";
import { useSession } from "@/lib/store";
import { cn } from "@/lib/utils";
import { roleHome } from "@/lib/types";
import { BottomSheet } from "@/components/pg/bottom-sheet";

type Tile = {
  key: string;
  role: UserRole;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "production" | "role";
};

const ROLE_TILES_STATIC: Tile[] = [
  { key: "ADMIN",      role: "ADMIN",      label: "Admin",       icon: Crown,         tone: "role" },
  { key: "OWNER",      role: "OWNER",      label: "Owner",       icon: Briefcase,     tone: "role" },
  { key: "MANAGER",    role: "MANAGER",    label: "Manager",     icon: Briefcase,     tone: "role" },
  { key: "SALES",      role: "SALES",      label: "Sales",       icon: Tag,           tone: "role" },
  { key: "FINANCE",    role: "FINANCE",    label: "Finance",     icon: Calculator,    tone: "role" },
  { key: "DRAFTER",    role: "DRAFTER",    label: "Drafter",     icon: ClipboardList, tone: "role" },
  { key: "PURCHASING", role: "PURCHASING", label: "Purchasing",  icon: ShoppingCart,  tone: "role" },
  { key: "QC",         role: "QC",         label: "QC",          icon: ShieldCheck,   tone: "role" },
  { key: "DELIVERY",   role: "DELIVERY",   label: "Delivery",    icon: Truck,         tone: "role" },
];

const DEPT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Machining: Wrench, Fabrikasi: Hammer, Finishing: Sparkles,
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function LoginPage() {
  const setUser = useSession((s) => s.setUser);
  const [pickedTile, setPickedTile] = useState<Tile | null>(null);
  const [pickedUser, setPickedUser] = useState<User | null>(null);
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);

  const tiles: Tile[] = useMemo(() => {
    const deptTiles: Tile[] = departments
      .filter((d) => d.active)
      .map((d) => ({
        key: `OP_${d.id}`,
        role: `OPERATOR_${d.name.toUpperCase()}` as UserRole,
        label: d.name,
        icon: DEPT_ICONS[d.name] ?? Wrench,
        tone: "production",
      }));
    return [...deptTiles, ...ROLE_TILES_STATIC];
  }, []);

  const usersInTile = useMemo(() => {
    if (!pickedTile) return [];
    return users.filter((u) => u.role === pickedTile.role && u.isActive);
  }, [pickedTile]);

  const closeAll = () => {
    setPickedTile(null);
    setPickedUser(null);
    setPin("");
    setShake(false);
  };

  const submitPin = (full: string) => {
    if (full.length === 4 && pickedUser) {
      setUser(pickedUser);
      if (typeof window !== "undefined") {
        window.location.href = roleHome(pickedUser.role);
      }
    } else {
      setShake(true);
      setTimeout(() => { setShake(false); setPin(""); }, 400);
    }
  };

  const press = (v: string) => {
    if (pin.length >= 4) return;
    const next = pin + v;
    setPin(next);
    if (next.length === 4) setTimeout(() => submitPin(next), 120);
  };
  const back = () => setPin(pin.slice(0, -1));

  return (
    <div className="min-h-screen bg-background px-4 pt-10 pb-6 max-w-md mx-auto">
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-brand text-white font-bold text-2xl flex items-center justify-center shadow-lg">
          PG
        </div>
        <h1 className="mt-4 text-2xl font-bold">Masuk ke POgrid</h1>
        <p className="text-sm text-muted-foreground mt-1">Pilih departemen atau peran</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          const count = users.filter((u) => u.role === t.role && u.isActive).length;
          return (
            <button
              key={t.key}
              onClick={() => { setPickedTile(t); setPickedUser(null); setPin(""); }}
              disabled={count === 0}
              className={cn(
                "aspect-square rounded-2xl bg-surface border border-border flex flex-col items-center justify-center gap-1 transition-all p-2 relative",
                count === 0
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-secondary active:scale-[0.97] active:bg-accent",
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                t.tone === "production"
                  ? "bg-brand-light text-brand-dark"
                  : "bg-secondary text-foreground",
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium mt-1 text-center leading-tight">{t.label}</span>
              {count > 0 && (
                <span className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand text-white min-w-[18px] text-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <a
        href={`https://wa.me/628123456789?text=${encodeURIComponent("Halo Admin POgrid, saya lupa PIN.")}`}
        className="block text-center text-sm font-medium text-brand py-4 mt-4"
      >
        Lupa PIN?
      </a>

      {/* Step 2: Drawer list nama user */}
      <BottomSheet
        open={!!pickedTile && !pickedUser}
        onClose={closeAll}
        title={pickedTile ? `Pilih nama — ${pickedTile.label}` : ""}
      >
        <div className="space-y-2">
          {usersInTile.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Belum ada user untuk peran ini.
            </p>
          ) : (
            usersInTile.map((u) => (
              <button
                key={u.id}
                onClick={() => { setPickedUser(u); setPin(""); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-surface border border-border hover:bg-secondary transition-colors text-left pg-touch-48"
              >
                <div className="w-10 h-10 rounded-full bg-brand text-white text-sm font-semibold flex items-center justify-center">
                  {initials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{u.name}</div>
                  <div className="text-xs text-muted-foreground truncate">@{u.username}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </BottomSheet>

      {/* Step 3: PIN numpad */}
      <BottomSheet open={!!pickedUser} onClose={closeAll}>
        {pickedUser && (
          <PinPad
            user={pickedUser}
            pin={pin}
            shake={shake}
            onPress={press}
            onBack={back}
            onBackToList={() => { setPickedUser(null); setPin(""); }}
          />
        )}
      </BottomSheet>
    </div>
  );
}

function PinPad({
  user, pin, shake, onPress, onBack, onBackToList,
}: {
  user: User;
  pin: string;
  shake: boolean;
  onPress: (v: string) => void;
  onBack: () => void;
  onBackToList: () => void;
}) {
  return (
    <div className="flex flex-col items-center pt-1">
      <button
        onClick={onBackToList}
        className="self-start inline-flex items-center gap-1 text-xs text-muted-foreground mb-2 pg-touch-48 px-2"
      >
        <ChevronLeft className="w-4 h-4" /> Pilih nama lain
      </button>

      <div className={cn("flex flex-col items-center mb-5", shake && "animate-shake")}>
        <div className="w-14 h-14 rounded-full bg-brand text-white text-lg font-semibold flex items-center justify-center mb-2">
          {initials(user.name)}
        </div>
        <div className="font-semibold text-base">{user.name}</div>
        <div className="text-xs text-muted-foreground">{roleLabel(user.role)}</div>
      </div>

      <div className={cn("flex gap-3 mb-5", shake && "animate-shake")}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "w-3.5 h-3.5 rounded-full border-2 border-brand transition-colors",
              i < pin.length ? "bg-brand" : "bg-transparent",
            )}
          />
        ))}
      </div>

      {shake && <div className="text-danger text-sm font-medium mb-2">PIN salah</div>}

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {["1","2","3","4","5","6","7","8","9"].map((n) => (
          <button
            key={n}
            onClick={() => onPress(n)}
            className="pg-touch-72 rounded-2xl bg-surface border border-border text-2xl font-semibold hover:bg-secondary active:bg-accent transition-colors"
          >{n}</button>
        ))}
        <div />
        <button
          onClick={() => onPress("0")}
          className="pg-touch-72 rounded-2xl bg-surface border border-border text-2xl font-semibold hover:bg-secondary active:bg-accent transition-colors"
        >0</button>
        <button
          onClick={onBack}
          aria-label="Hapus"
          className="pg-touch-72 rounded-2xl bg-secondary text-foreground flex items-center justify-center hover:bg-accent transition-colors"
        ><Delete className="w-6 h-6" /></button>
      </div>

      <p className="mt-5 text-[11px] text-muted-foreground">Mock login — masukkan 4 digit apa saja</p>
    </div>
  );
}

function initials_unused() {} // keep tree-shake clean (no-op)

export default LoginPage;
