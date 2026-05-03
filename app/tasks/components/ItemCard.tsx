import { FLAG_COLORS } from '@/lib/constants';
import { calculateItemProgress, formatDate, getDaysLate } from '@/lib/po';

import type { ItemWithRelations } from '../types';

type ItemCardProps = {
  item: ItemWithRelations;
  role: string;
  deptName: string | null;
  isOwnItem: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onReportProblem: () => void;
};

export default function ItemCard({ item, role, deptName, isOwnItem, isExpanded, onToggleExpand, onReportProblem }: ItemCardProps) {
  const progress = calculateItemProgress(item);
  const daysLate = getDaysLate(new Date(item.po.due_date));
  const flagColor = FLAG_COLORS[item.po.urgency_flag as keyof typeof FLAG_COLORS] || '#16A34A';

  const isArsip = item.status === 'DONE';
  const isAdmin = role === 'ADMIN';
  const isOperator = role.startsWith('OPERATOR_');

  // Get last activity
  const lastActivity = item.auditLogs[0];
  const lastActivityTime = lastActivity
    ? new Date(lastActivity.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : null;

  // Parse metadata for display
  const lastActivityMeta = lastActivity?.metadata
    ? (() => {
        try {
          return JSON.parse(lastActivity.metadata as string);
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <div
      className={`rounded-2xl bg-white shadow-sm ${isExpanded ? 'ring-2 ring-brand' : ''}`}
      style={{ borderLeft: `4px solid ${isArsip ? '#D1D5DB' : flagColor}` }}
    >
      <div className="p-4">
        {/* Header with badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {daysLate > 0 && !isArsip && (
              <span className="mb-1 inline-block rounded-full bg-danger/10 px-2 py-0.5 text-xs font-bold text-danger">
                TERLAMBAT {daysLate} hari
              </span>
            )}
            <h3 className="truncate font-bold text-[#1A1A2E]">{item.name}</h3>
          </div>
           <div className="flex shrink-0 items-center gap-2">
            {item.po.is_urgent && <span className="rounded-full bg-[#FEF2F2] px-2 py-0.5 text-xs font-bold text-[#B91C1C]">URGENT</span>}
            {item.is_rework && <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-bold text-warning">REWORK</span>}
            {item.problems.length > 0 && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                Ada Masalah ({item.problems.length})
              </span>
            )}
            <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs font-semibold text-[#6B7280]">{progress}%</span>
          </div>
        </div>

        {/* Client and details */}
        <p className="mt-1 text-sm text-[#6B7280]">
          {item.po.client.name} · {item.qty} {item.unit || 'pcs'}
          {daysLate > 0 && !isArsip && ` · ${daysLate} Hari terlambat`}
        </p>

        {/* Department chips */}
        <div className="mt-2 flex flex-wrap gap-1">
          {JSON.parse(item.work_type).map((deptId: string) => {
            const dept = item.progresses.find((p: { departmentId: string; department: { name: string } }) => p.departmentId === deptId)?.department;
            const isOwnDept = dept?.name === deptName;
            return (
              <span
                key={deptId}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  isOwnDept ? 'bg-brand-light text-brand' : 'bg-[#F3F4F6] text-[#6B7280]'
                }`}
              >
                {dept?.name || deptId}
              </span>
            );
          })}
        </div>

        {/* Progress stages */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#6B7280]">
          <span className={item.status === 'DRAFTING' ? 'font-bold text-brand' : ''}>
            Draft {item.status === 'DRAFTING' ? '●' : '○'}
          </span>
          <span className={item.status === 'PURCHASING' ? 'font-bold text-brand' : ''}>
            Purch {item.status === 'PURCHASING' ? '●' : '○'}
          </span>
          {item.progresses.map((p: { id: string; progress: number; department: { name: string } }) => (
            <span key={p.id} className={item.status === 'PRODUCTION' && p.department.name === deptName ? 'font-bold text-brand' : ''}>
              {p.department.name} {p.progress}%
            </span>
          ))}
          <span className={item.status === 'QC' ? 'font-bold text-brand' : ''}>
            QC {item.status === 'QC' ? '●' : '○'}
          </span>
          <span className={item.status === 'DELIVERY' ? 'font-bold text-brand' : ''}>
            Deliv {item.status === 'DELIVERY' ? '●' : '○'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
        </div>

        {/* Last activity */}
        {lastActivity && !isArsip && (
          <p className="mt-2 text-xs text-[#6B7280]">
            {lastActivity.userId} · {lastActivityTime}
            {lastActivityMeta && lastActivityMeta.progress !== undefined && (
              <> · {lastActivityMeta.departmentName || 'Dept'} → {lastActivityMeta.progress}%</>
            )}
          </p>
        )}

        {/* Arsip info */}
        {isArsip && item.done_at && (
          <p className="mt-2 text-xs text-[#6B7280]">
            Selesai: {formatDate(new Date(item.done_at))}
            {item.is_rework && <span className="ml-2 rounded bg-warning/10 px-1.5 py-0.5 text-warning">REWORK</span>}
          </p>
        )}
      </div>

      {/* Action buttons (not for Arsip) */}
      {!isArsip && (
        <div className="flex border-t border-[#E5E7EB]">
          {/* Expand/collapse for update panel - only for own items or admin */}
          {(isOwnItem || isAdmin) && (
            <button
              onClick={onToggleExpand}
              className="flex-1 py-2.5 text-center text-sm font-semibold text-brand hover:bg-brand/5"
            >
              {isExpanded ? 'Tutup' : 'UPDATE · ' + getStageLabel(item.status)}
            </button>
          )}
          {/* Report problem - all operators can report */}
          {(isOperator || isAdmin || ['DRAFTER', 'PURCHASING', 'QC', 'DELIVERY'].includes(role)) && (
            <button
              onClick={onReportProblem}
              className="flex-1 border-l border-[#E5E7EB] py-2.5 text-center text-sm font-semibold text-warning hover:bg-warning/5"
            >
              ⚠ Laporkan Masalah
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function getStageLabel(status: string): string {
  switch (status) {
    case 'DRAFTING': return 'DRAFTING';
    case 'PURCHASING': return 'PURCHASING';
    case 'PRODUCTION': return 'PRODUCTION';
    case 'QC': return 'QC';
    case 'DELIVERY': return 'DELIVERY';
    default: return status;
  }
}
