import { cn } from '@/lib/utils';
import { InvoiceStatus } from '@/lib/types';
import { Clock, Receipt, CheckCircle2 } from 'lucide-react';

export function StatusPill({ status }: { status: InvoiceStatus }) {
  const map = {
    PENDING: { Icon: Clock, label: 'Pending', cls: 'bg-[#F3F4F6] text-[#6B7280]' },
    INVOICED: { Icon: Receipt, label: 'Diinvoice', cls: 'bg-[#F59E0B] text-white' },
    PAID: { Icon: CheckCircle2, label: 'Lunas', cls: 'bg-[#10B981] text-white' },
  }[status];

  const Icon = map.Icon;

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', map.cls)}>
      <Icon className="w-3 h-3" /> {map.label}
    </span>
  );
}
