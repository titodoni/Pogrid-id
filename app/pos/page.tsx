import Link from 'next/link';

import { FLAG_COLORS, FLAG_PRIORITY } from '@/lib/constants';
import { db } from '@/lib/db';
import { calculatePOProgress, formatDate, getDaysLate, getHoursLate, isUrgentFlag } from '@/lib/po';
import { requireRole } from '@/lib/session';

type PosPageProps = {
  searchParams: Promise<{ deleted?: string }>;
};

export default async function PosPage({ searchParams }: PosPageProps) {
  await requireRole(['ADMIN']);
  const params = await searchParams;
  const pos = await db.pO.findMany({
    where: { status: { in: ['ACTIVE', 'FINISHED'] } },
    include: {
      client: true,
      items: {
        include: {
          progresses: true,
          problems: { where: { resolved: false }, take: 1, orderBy: { createdAt: 'desc' } },
        },
      },
    },
  });

  const openProblems = pos.reduce(
    (sum, po) => sum + po.items.reduce((itemSum, item) => itemSum + item.problems.length, 0),
    0,
  );
  const latePOs = pos.filter((po) => getHoursLate(po.due_date) > 0);
  const completed = pos.filter((po) => po.status === 'FINISHED' || po.status === 'CLOSED').length;
  const nearDeadline = pos.filter((po) => isUrgentFlag(po.urgency_flag) && getHoursLate(po.due_date) === 0).length;
  const avgLateDays = latePOs.length
    ? Math.round((latePOs.reduce((sum, po) => sum + getDaysLate(po.due_date), 0) / latePOs.length) * 10) / 10
    : 0;
  const worstPO = latePOs.toSorted((a, b) => getHoursLate(b.due_date) - getHoursLate(a.due_date))[0];
  const sortedPOs = pos.toSorted((a, b) => {
    const flagDiff = FLAG_PRIORITY[b.urgency_flag as keyof typeof FLAG_PRIORITY] - FLAG_PRIORITY[a.urgency_flag as keyof typeof FLAG_PRIORITY];
    return flagDiff || a.due_date.getTime() - b.due_date.getTime();
  });

  return (
    <main className="min-h-screen bg-[#F8F9FA] px-4 py-8 text-[#1A1A2E] sm:px-6">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Beranda Admin</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Production Order</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-bold" href="/po">
              Semua PO
            </Link>
            <Link className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white" href="/pos/new">
              + Buat PO
            </Link>
          </div>
        </div>

        {params.deleted ? (
          <p className="mt-5 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm font-semibold text-[#15803D]">
            PO berhasil dihapus.
          </p>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Terlambat" value={latePOs.length} />
          <KpiCard label="Deadline Dekat" value={nearDeadline} />
          <KpiCard label="Masalah Terbuka" value={openProblems} />
          <KpiCard label="Selesai" value={completed} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <KpiCard label="Rata-rata Keterlambatan" value={`${avgLateDays} hari`} />
          <KpiCard label="PO Terburuk" value={worstPO ? `${worstPO.po_internal_number} · ${getHoursLate(worstPO.due_date)} jam` : '-'} />
        </div>

        <div className="mt-6 grid gap-4">
          {sortedPOs.map((po) => {
            const progress = calculatePOProgress(po.items);
            const firstProblem = po.items.flatMap((item) => item.problems)[0];
            const lateHours = getHoursLate(po.due_date);

            return (
              <Link
                key={po.id}
                className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                href={`/pos/${po.id}`}
                style={{ borderLeft: `6px solid ${FLAG_COLORS[po.urgency_flag as keyof typeof FLAG_COLORS]}` }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{po.client.name}</h2>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {po.po_internal_number} · {po.po_client_number || 'No client PO'}
                    </p>
                  </div>
                  {isUrgentFlag(po.urgency_flag) ? (
                    <span className="w-fit rounded-full bg-[#FEF2F2] px-3 py-1 text-xs font-bold text-[#B91C1C]">{po.urgency_flag}</span>
                  ) : null}
                  {po.is_urgent ? <span className="w-fit rounded-full bg-[#FEF2F2] px-3 py-1 text-xs font-bold text-[#B91C1C]">URGENT</span> : null}
                  {po.is_vendor_job ? <span className="w-fit rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-bold text-[#334155]">VENDOR JOB</span> : null}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#E5E7EB]">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-sm font-bold">{progress}%</span>
                </div>
                <p className="mt-3 text-sm text-[#6B7280]">
                  Due {formatDate(po.due_date)} · {lateHours > 0 ? `${lateHours}h terlambat` : 'on track'}
                </p>
                {firstProblem ? <p className="mt-3 text-sm font-semibold text-[#B91C1C]">⚠ {firstProblem.note}</p> : null}
              </Link>
            );
          })}

          {sortedPOs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center">
              <h2 className="text-xl font-bold">Belum ada PO aktif</h2>
              <Link className="mt-4 inline-flex rounded-full bg-brand px-5 py-3 text-sm font-bold text-white" href="/pos/new">
                Buat PO pertama
              </Link>
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold" href="/masalah">
            Masalah
          </Link>
          <Link className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold" href="/settings">
            Kelola
          </Link>
          <Link className="rounded-full bg-[#1A1A2E] px-4 py-2 text-sm font-semibold text-white" href="/logout">
            Logout
          </Link>
        </div>
      </section>
    </main>
  );
}

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6B7280]">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </div>
  );
}
