import Link from 'next/link';

import { FLAG_PRIORITY } from '@/lib/constants';
import { db } from '@/lib/db';
import { formatDate, getHoursLate } from '@/lib/po';
import { requireRole } from '@/lib/session';

import { resolveProblemAction } from './actions';

type ProblemsPageProps = {
  searchParams: Promise<{ resolved?: string }>;
};

export default async function ProblemsPage({ searchParams }: ProblemsPageProps) {
  await requireRole(['ADMIN']);
  const params = await searchParams;
  const problems = await db.problem.findMany({
    where: { resolved: false },
    include: { item: { include: { po: { include: { client: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  const sortedProblems = problems.toSorted((a, b) => {
    const severityDiff = FLAG_PRIORITY[b.item.po.urgency_flag as keyof typeof FLAG_PRIORITY] - FLAG_PRIORITY[a.item.po.urgency_flag as keyof typeof FLAG_PRIORITY];
    return severityDiff || getHoursLate(b.item.po.due_date) - getHoursLate(a.item.po.due_date);
  });

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Masalah</p>
          <h1 className="mt-3 text-3xl font-bold">Masalah Terbuka</h1>
          <p className="mt-3 text-[#6B7280]">Sorted by severity and late hours.</p>
          {params.resolved ? (
            <p className="mt-5 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm font-semibold text-[#15803D]">
              Masalah berhasil diselesaikan.
            </p>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4">
          {sortedProblems.map((problem) => (
            <article key={problem.id} className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">{problem.note}</h2>
                  <p className="mt-2 text-sm text-[#6B7280]">
                    {problem.item.po.po_internal_number} · {problem.item.po.client.name} · {problem.item.name}
                  </p>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    Flag {problem.item.po.urgency_flag} · Due {formatDate(problem.item.po.due_date)} · {getHoursLate(problem.item.po.due_date)} jam terlambat
                  </p>
                </div>
                <Link className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-bold" href={`/pos/${problem.item.poId}`}>
                  Buka PO
                </Link>
              </div>
              <form action={resolveProblemAction} className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input name="problemId" type="hidden" value={problem.id} />
                <input className="min-w-0 flex-1 rounded-full border border-[#E5E7EB] px-4 py-2" name="resolutionNote" placeholder="Catatan resolusi opsional" />
                <button className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-white" type="submit">
                  Resolve →
                </button>
              </form>
            </article>
          ))}
          {sortedProblems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center">
              <h2 className="text-xl font-bold">Tidak ada masalah terbuka</h2>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
