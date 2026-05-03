import Link from 'next/link';
import { notFound } from 'next/navigation';

import { FLAG_COLORS } from '@/lib/constants';
import { db } from '@/lib/db';
import { calculateItemProgress, calculatePOProgress, formatDate, getHoursLate, isUrgencyFlag } from '@/lib/po';
import { requireSession } from '@/lib/session';
import type { ItemStatus } from '@/lib/types';

import { deletePOAction, updatePOAction } from '../actions';

type PODetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string; error?: string }>;
};

export default async function PODetailPage({ params, searchParams }: PODetailPageProps) {
  const session = await requireSession();
  const { id } = await params;
  const query = await searchParams;
  const [po, clients, departments] = await Promise.all([
    db.pO.findUnique({
      where: { id },
      include: {
        client: true,
        items: {
          include: {
            progresses: { include: { department: true }, orderBy: { department: { order: 'asc' } } },
            problems: { where: { resolved: false }, orderBy: { createdAt: 'desc' } },
            auditLogs: { orderBy: { createdAt: 'desc' }, take: 8 },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    db.client.findMany({ orderBy: { name: 'asc' } }),
    db.department.findMany({ orderBy: { order: 'asc' } }),
  ]);

  if (!po) notFound();
  const isAdmin = session.role === 'ADMIN';
  const progress = calculatePOProgress(po.items);
  const lateHours = getHoursLate(po.due_date);
  const problemCount = po.items.reduce((sum, item) => sum + item.problems.length, 0);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8" style={{ borderLeft: `6px solid ${FLAG_COLORS[po.urgency_flag as keyof typeof FLAG_COLORS]}` }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">PO Detail</p>
              <h1 className="mt-3 text-3xl font-bold">{po.po_internal_number}</h1>
              <p className="mt-2 text-[#6B7280]">
                {po.client.name} · Tanggal PO {formatDate(po.po_date)} · Due {formatDate(po.due_date)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {po.is_urgent ? <Badge text="URGENT" tone="danger" /> : null}
                {po.is_vendor_job ? <Badge text="VENDOR JOB" tone="neutral" /> : null}
              </div>
            </div>
            <Link className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-bold" href={isAdmin ? '/pos' : '/board'}>
              Kembali
            </Link>
          </div>

          {query.created ? <Notice tone="success" text="PO berhasil dibuat ✓" /> : null}
          {query.updated ? <Notice tone="success" text="PO berhasil diperbarui ✓" /> : null}
          {query.error === 'flag' ? <Notice tone="danger" text="Admin hanya boleh eskalasi flag, bukan menurunkan." /> : null}
          {query.error === 'pin' ? <Notice tone="danger" text="PIN salah. PO tidak dihapus." /> : null}
          {query.error === 'delete-blocked' ? <Notice tone="danger" text="PO tidak bisa dihapus karena ada item yang sudah selesai atau diinvoice." /> : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label="PROGRESS" value={`${progress}%`} />
            <Stat label="TERLAMBAT" value={`${lateHours} jam`} />
            <Stat label="MASALAH" value={problemCount} />
          </div>
        </div>

        {isAdmin ? (
          <form action={updatePOAction} className="mt-6 grid gap-4 rounded-3xl bg-white p-6 shadow-sm md:grid-cols-2">
            <input name="poId" type="hidden" value={po.id} />
            <h2 className="text-xl font-bold md:col-span-2">Edit PO</h2>
            <label className="text-sm font-semibold">
              Klien
              <select className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3" name="clientId" defaultValue={po.clientId}>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              No. PO Klien
              <input className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3" name="poClientNumber" defaultValue={po.po_client_number} />
            </label>
            <label className="text-sm font-semibold">
              Tanggal PO
              <input className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3" name="poDate" type="date" defaultValue={po.po_date.toISOString().slice(0, 10)} />
            </label>
            <label className="text-sm font-semibold">
              Due Date
              <input className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3" name="dueDate" type="date" defaultValue={po.due_date.toISOString().slice(0, 10)} />
            </label>
            <label className="text-sm font-semibold">
              Urgency
              <select className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3" name="urgencyFlag" defaultValue={po.urgency_flag}>
                {['NORMAL', 'ORANGE', 'RED', 'BLOOD_RED'].filter(isUrgencyFlag).map((flag) => (
                  <option key={flag} value={flag}>
                    {flag}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold md:col-span-2">
              Notes
              <textarea className="mt-2 min-h-24 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3" name="notes" defaultValue={po.notes ?? ''} />
            </label>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <label className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-bold">
                <input name="isUrgent" type="checkbox" defaultChecked={po.is_urgent} />
                URGENT
              </label>
              <label className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-bold">
                <input name="isVendorJob" type="checkbox" defaultChecked={po.is_vendor_job} />
                VENDOR JOB
              </label>
            </div>
            <button className="rounded-full bg-brand px-5 py-3 text-sm font-bold text-white" type="submit">
              Simpan Perubahan
            </button>
          </form>
        ) : null}

        <div className="mt-6 grid gap-4">
          {po.items.map((item) => (
            <article key={item.id} className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">{item.name}</h2>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    Qty {item.qty} {item.unit} · {item.status} · {calculateItemProgress(item)}%
                  </p>
                  {item.spec ? <p className="mt-2 text-sm text-[#6B7280]">Spec: {item.spec}</p> : null}
                </div>
                {item.problems.length ? <span className="w-fit rounded-full bg-[#FEF2F2] px-3 py-1 text-xs font-bold text-[#B91C1C]">TERLAMBAT / MASALAH</span> : null}
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold">
                <TimelineDot label="DRFT" state={item.status === 'DRAFTING' ? 'current' : 'done'} />
                <TimelineDot label="PURCH" state={getTimelineState(item.status as ItemStatus, 'PURCHASING')} />
                {departments.map((department) => {
                  const progressEntry = item.progresses.find((progress) => progress.departmentId === department.id);
                  if (!progressEntry) return null;
                  return <TimelineDot key={department.id} label={department.name.slice(0, 5).toUpperCase()} state={progressEntry.progress >= 100 ? 'done' : item.status === 'PRODUCTION' ? 'current' : 'todo'} />;
                })}
                <TimelineDot label="QC" state={getTimelineState(item.status as ItemStatus, 'QC')} />
                <TimelineDot label="DELIV" state={getTimelineState(item.status as ItemStatus, 'DELIVERY')} />
              </div>
              {item.problems[0] ? <p className="mt-4 text-sm font-semibold text-[#B91C1C]">⚠ {item.problems[0].note}</p> : null}
              <details className="mt-5 rounded-2xl border border-[#E5E7EB] p-4">
                <summary className="cursor-pointer text-sm font-bold">&gt; log aktivitas</summary>
                <div className="mt-4 grid gap-2">
                  {item.auditLogs.map((log) => (
                    <p key={log.id} className="text-sm text-[#6B7280]">
                      {log.createdAt.toLocaleString('id-ID')} · {log.action} · {log.fromValue ?? '-'} → {log.toValue ?? '-'}
                    </p>
                  ))}
                  {item.auditLogs.length === 0 ? <p className="text-sm text-[#6B7280]">Belum ada aktivitas.</p> : null}
                </div>
              </details>
            </article>
          ))}
        </div>

        {isAdmin ? (
          <form action={deletePOAction} className="mt-6 rounded-3xl border border-[#FECACA] bg-[#FEF2F2] p-6">
            <input name="poId" type="hidden" value={po.id} />
            <h2 className="text-xl font-bold text-[#991B1B]">Danger Zone</h2>
            <p className="mt-2 text-sm text-[#7F1D1D]">Hapus PO akan menghapus {po.items.length} item terkait jika belum selesai atau dibayar.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input className="rounded-full border border-[#FECACA] px-4 py-2" inputMode="numeric" name="pin" placeholder="PIN Admin" required type="password" />
              <button className="rounded-full bg-[#B91C1C] px-5 py-2 text-sm font-bold text-white" type="submit">
                Hapus PO
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-[#F8F9FA] p-4">
      <p className="text-xs font-semibold tracking-[0.2em] text-[#6B7280]">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function Notice({ tone, text }: { tone: 'success' | 'danger'; text: string }) {
  const classes = tone === 'success' ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]' : 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]';
  return <p className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${classes}`}>{text}</p>;
}

function Badge({ text, tone }: { text: string; tone: 'danger' | 'neutral' }) {
  const classes = tone === 'danger' ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'bg-[#F1F5F9] text-[#334155]';
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${classes}`}>{text}</span>;
}

function TimelineDot({ label, state }: { label: string; state: 'done' | 'current' | 'todo' }) {
  const dot = state === 'done' ? '●' : state === 'current' ? '◐' : '○';
  return <span className="rounded-full bg-[#F8F9FA] px-3 py-1">{dot} {label}</span>;
}

function getTimelineState(current: ItemStatus, target: ItemStatus): 'done' | 'current' | 'todo' {
  const order: ItemStatus[] = ['DRAFTING', 'PURCHASING', 'PRODUCTION', 'QC', 'DELIVERY', 'DONE'];
  const currentIndex = order.indexOf(current);
  const targetIndex = order.indexOf(target);
  if (currentIndex > targetIndex) return 'done';
  if (currentIndex === targetIndex) return 'current';
  return 'todo';
}
