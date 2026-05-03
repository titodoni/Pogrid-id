import Link from 'next/link';

import { FLAG_COLORS } from '@/lib/constants';
import { db } from '@/lib/db';
import { calculatePOProgress, formatDate, getHoursLate, isUrgentFlag } from '@/lib/po';
import { requireRole } from '@/lib/session';

type POListPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function POListPage({ searchParams }: POListPageProps) {
  await requireRole(['ADMIN']);
  const { tab = 'semua' } = await searchParams;
  const pos = await db.pO.findMany({
    include: { client: true, items: { include: { progresses: true } } },
  });
  const filtered = pos
    .filter((po) => {
      if (tab === 'terlambat') return getHoursLate(po.due_date) > 0;
      if (tab === 'urgent') return isUrgentFlag(po.urgency_flag);
      return true;
    })
    .toSorted((a, b) => {
      const lateDiff = Number(getHoursLate(b.due_date) > 0) - Number(getHoursLate(a.due_date) > 0);
      return lateDiff || a.due_date.getTime() - b.due_date.getTime();
    });

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">PO List</p>
          <h1 className="mt-3 text-3xl font-bold">Semua Production Order</h1>
          <div className="mt-6 flex flex-wrap gap-2">
            {['semua', 'terlambat', 'urgent'].map((tabName) => (
              <Link
                key={tabName}
                className={`rounded-full px-4 py-2 text-sm font-bold ${tab === tabName ? 'bg-brand text-white' : 'border border-[#E5E7EB]'}`}
                href={`/po?tab=${tabName}`}
              >
                {tabName === 'semua' ? 'Semua' : tabName === 'terlambat' ? 'Terlambat' : 'Urgent'}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {filtered.map((po) => (
            <Link
              key={po.id}
              className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
              href={`/pos/${po.id}`}
              style={{ borderLeft: `6px solid ${FLAG_COLORS[po.urgency_flag as keyof typeof FLAG_COLORS]}` }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">{po.po_internal_number}</h2>
                  <p className="text-sm text-[#6B7280]">
                    {po.client.name} · Tanggal PO {formatDate(po.po_date)} · Due {formatDate(po.due_date)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {po.is_urgent ? <span className="rounded-full bg-[#FEF2F2] px-3 py-1 text-xs font-bold text-[#B91C1C]">URGENT</span> : null}
                    {po.is_vendor_job ? <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-bold text-[#334155]">VENDOR JOB</span> : null}
                  </div>
                </div>
                <div className="text-sm font-bold">{calculatePOProgress(po.items)}%</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
