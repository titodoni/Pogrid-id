import { Link } from 'next-view-transitions';
import { requireRole } from '@/lib/session';
import { db } from '@/lib/db';
import { InvoiceStatus } from '@/lib/types';
import { INVOICE_STATUSES } from '@/lib/constants';
import { StatusPill } from '@/components/finance/StatusPill';
import { SummaryCard } from '@/components/finance/SummaryCard';
import { InvoiceAction } from '@/components/finance/InvoiceAction';

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireRole(['FINANCE']);
  const params = await searchParams;
  const tab = (params.tab as InvoiceStatus) || 'PENDING';

  const items = await db.item.findMany({
    where: {
      status: 'DONE',
      invoice_status: tab,
    },
    include: {
      po: {
        include: { client: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const [countPending, countInvoiced, countPaid] = await Promise.all([
    db.item.count({ where: { status: 'DONE', invoice_status: 'PENDING' } }),
    db.item.count({ where: { status: 'DONE', invoice_status: 'INVOICED' } }),
    db.item.count({ where: { status: 'DONE', invoice_status: 'PAID' } }),
  ]);

  return (
    <main className="min-h-screen px-6 py-10 bg-[#F9FAFB]">
      <section className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-[#111827]">Finance</h1>
        <p className="text-sm text-[#6B7280] mb-6">Invoice Management</p>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <SummaryCard label="Pending" value={countPending} tone="muted" />
          <SummaryCard label="Diinvoice" value={countInvoiced} tone="warning" />
          <SummaryCard label="Lunas" value={countPaid} tone="success" />
        </div>

        <div className="flex gap-2 mb-6">
          {INVOICE_STATUSES.map((k) => (
            <Link
              key={k}
              href={`/finance?tab=${k}`}
              className={`flex-1 py-3 rounded-xl text-xs font-semibold text-center transition-all ${
                tab === k
                  ? 'bg-[#1A1A2E] text-white shadow-md'
                  : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]'
              }`}
            >
              {k === 'PENDING' ? 'Pending' : k === 'INVOICED' ? 'Diinvoice' : 'Lunas'}
            </Link>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="text-center text-sm text-[#6B7280] py-16 bg-white rounded-xl border border-[#E5E7EB]">
            Tidak ada item.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E7EB]">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0D9488]">{item.po.po_internal_number} · {item.po.client.name}</p>
                    <p className="text-sm font-semibold text-[#111827] truncate mt-1">{item.name}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">qty {item.qty} {item.unit}</p>
                  </div>
                  <StatusPill status={item.invoice_status as InvoiceStatus} />
                </div>
                <div className="mt-4">
                  <InvoiceAction itemId={item.id} currentStatus={item.invoice_status as InvoiceStatus} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
