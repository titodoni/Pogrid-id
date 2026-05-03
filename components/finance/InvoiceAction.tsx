'use client';

import { useTransition } from 'react';
import { updateInvoiceStatus } from '@/app/finance/actions';
import { InvoiceStatus } from '@/lib/types';

export function InvoiceAction({ itemId, currentStatus }: { itemId: string; currentStatus: InvoiceStatus }) {
  const [isPending, startTransition] = useTransition();

  const nextStatus = currentStatus === 'PENDING' ? 'INVOICED' : 'PAID';
  const label = currentStatus === 'PENDING' ? 'Tandai Diinvoice' : 'Tandai Lunas';

  if (currentStatus === 'PAID') return null;

  return (
    <button
      onClick={() => startTransition(() => updateInvoiceStatus(itemId, nextStatus))}
      disabled={isPending}
      className={`w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-all ${
        currentStatus === 'PENDING' ? 'bg-[#0D9488]' : 'bg-[#10B981]'
      } disabled:opacity-50`}
    >
      {isPending ? 'Memproses...' : label}
    </button>
  );
}
