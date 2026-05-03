"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft, Calendar, Package, AlertTriangle, FileText,
  Building2, Hash, Clock, CheckCircle2, Truck,
} from "lucide-react";
import { LayoutWrapper } from "@/components/pg/layout-wrapper";
import { ItemCard } from "@/components/pg/item-card";
import { CancelToast } from "@/components/pg/cancel-toast";
import { useItems } from "@/lib/store";
import { poById, clientById, computeFlag } from "@/lib/mock-data";
import { flagClass } from "@/components/pg/badges";
import { format, formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";

function PODetail() {
  const { poId } = useParams();
  const items = useItems((s) => s.items);
  const problems = useItems((s) => s.problems);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const po = poById(poId);

  if (!po) {
    return (
      <LayoutWrapper title="PO tidak ditemukan">
        <div className="pg-card text-center py-12">
          <p className="text-sm text-muted-foreground mb-3">PO tidak ditemukan.</p>
          <Link href="/pos" className="text-brand text-sm font-semibold">Kembali ke daftar</Link>
        </div>
      </LayoutWrapper>
    );
  }

  const c = clientById(po.clientId);
  const flag = po.urgency_flag === "NORMAL" ? computeFlag(po.due_date) : po.urgency_flag;
  const list = items.filter((i) => i.poId === po.id);
  const done = list.filter((i) => i.status === "DONE").length;
  const total = list.length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const openProblems = useMemo(
    () => problems.filter((p) => !p.resolved && list.some((i) => i.id === p.itemId)).length,
    [problems, list],
  );

  const StageDot = ({ active, label, Icon }: { active: boolean; label: string; Icon: any }) => (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
        active ? "bg-brand text-white" : "bg-secondary text-muted-foreground",
      )}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className={cn("text-[10px] truncate max-w-full", active ? "font-semibold" : "text-muted-foreground")}>{label}</span>
    </div>
  );

  const stageActive = {
    draft: list.some((i) => i.status === "DRAFTING"),
    purch: list.some((i) => i.status === "PURCHASING"),
    prod:  list.some((i) => i.status === "PRODUCTION"),
    qc:    list.some((i) => i.status === "QC"),
    deliv: list.some((i) => i.status === "DELIVERY"),
    done:  done > 0,
  };

  return (
    <LayoutWrapper title={po.po_internal_number}>
      <Link href="/pos" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-2 pg-touch-48">
        <ArrowLeft className="w-4 h-4" /> Daftar PO
      </Link>

      <div className={cn("pg-card mb-3", flagClass(flag))}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="text-base font-bold truncate">{c?.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Hash className="w-3 h-3" /> Klien: {po.po_client_number}
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end shrink-0">
            {po.is_urgent && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger text-white">URGENT</span>
            )}
            {po.is_vendor_job && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-navy text-white">VENDOR</span>
            )}
            {flag === "BLOOD_RED" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blood text-white">TERLAMBAT</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mt-3 pt-3 border-t border-border">
          <div>
            <div className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Tgl PO</div>
            <div className="font-semibold mt-0.5">{format(new Date(po.po_date), "d MMM yyyy", { locale: idLocale })}</div>
          </div>
          <div>
            <div className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Jatuh tempo</div>
            <div className="font-semibold mt-0.5">{format(new Date(po.due_date), "d MMM yyyy", { locale: idLocale })}</div>
            <div className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(po.due_date), { addSuffix: true, locale: idLocale })}
            </div>
          </div>
        </div>

        {po.notes && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-muted-foreground text-xs flex items-center gap-1 mb-1"><FileText className="w-3 h-3" /> Catatan</div>
            <p className="text-xs italic">"{po.notes}"</p>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground flex items-center gap-1"><Package className="w-3 h-3" /> Progres</span>
            <span className="font-semibold tabular-nums">{done}/{total} item · {percent}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-brand transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      {/* Stage indicator */}
      <div className="pg-card mb-3 px-2 py-3">
        <div className="flex items-center gap-1">
          <StageDot active={stageActive.draft} label="Draft"  Icon={FileText} />
          <StageDot active={stageActive.purch} label="Beli"   Icon={Building2} />
          <StageDot active={stageActive.prod}  label="Produksi" Icon={Package} />
          <StageDot active={stageActive.qc}    label="QC"     Icon={CheckCircle2} />
          <StageDot active={stageActive.deliv} label="Kirim"  Icon={Truck} />
          <StageDot active={stageActive.done}  label="Selesai" Icon={CheckCircle2} />
        </div>
      </div>

      {openProblems > 0 && (
        <Link href="/masalah" className="block pg-card mb-3 bg-[oklch(0.96_0.06_25)] border-danger/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-danger" />
            <span className="text-sm font-semibold text-danger flex-1">{openProblems} masalah terbuka</span>
            <span className="text-xs text-danger">Lihat →</span>
          </div>
        </Link>
      )}

      <h2 className="text-sm font-semibold mb-2 mt-4">Item ({list.length})</h2>
      {list.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-8">Belum ada item.</div>
      ) : (
        list.map((it) => (
          <ItemCard
            key={it.id}
            item={it}
            expanded={expandedId === it.id}
            onToggle={() => setExpandedId(expandedId === it.id ? null : it.id)}
          />
        ))
      )}

      <CancelToast />
    </LayoutWrapper>
  );
}

export default PODetail;
