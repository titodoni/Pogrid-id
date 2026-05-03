import { cn } from '@/lib/utils';
import { Clock, Receipt, CheckCircle2 } from 'lucide-react';

export function SummaryCard({ label, value, tone }: { label: string; value: number; tone: 'muted' | 'warning' | 'success' }) {
  const cls = {
    muted: 'bg-[#F3F4F6] text-[#6B7280]',
    warning: 'bg-[#FEF3C7] text-[#D97706]',
    success: 'bg-[#D1FAE5] text-[#059669]',
  }[tone];

  const Icon = {
    muted: Clock,
    warning: Receipt,
    success: CheckCircle2,
  }[tone];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E7EB] text-center">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2', cls)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-[10px] text-[#6B7280] uppercase tracking-wide">{label}</div>
    </div>
  );
}
