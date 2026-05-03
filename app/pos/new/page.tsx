import Link from 'next/link';

import { db } from '@/lib/db';
import { peekNextPoNumber } from '@/lib/po';
import { requireRole } from '@/lib/session';

import { createPOAction } from '../actions';

type NewPOPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewPOPage({ searchParams }: NewPOPageProps) {
  await requireRole(['ADMIN']);
  const params = await searchParams;
  const [clients, departments, config, sequence] = await Promise.all([
    db.client.findMany({ orderBy: { name: 'asc' } }),
    db.department.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    db.systemConfig.findUnique({ where: { id: 'singleton' } }),
    db.poSequence.findUnique({ where: { id: 'singleton' } }),
  ]);
  const suggestedPoNumber = await peekNextPoNumber({ sequence, template: config?.poPrefix ?? 'PO-[YYYY]-[SEQ]' });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <section className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Buat PO</p>
            <h1 className="mt-3 text-3xl font-bold">Production Order Baru</h1>
          </div>
          <Link className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-bold" href="/pos">
            Batal
          </Link>
        </div>

        {params.error ? (
          <p className="mt-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#B91C1C]">
            Lengkapi customer, minimal satu item, qty valid, dan minimal satu jenis produksi per item.
          </p>
        ) : null}

        <form action={createPOAction} className="mt-8 grid gap-8">
          <input name="suggestedPoNumber" type="hidden" value={suggestedPoNumber} />
          <section className="grid gap-4 rounded-3xl border border-[#E5E7EB] p-5 md:grid-cols-2">
            <label className="text-sm font-semibold">
              Nomor PO
              <input className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3" name="poInternalNumber" required defaultValue={suggestedPoNumber} />
            </label>
            <label className="text-sm font-semibold">
              Client PO
              <input className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3" name="poClientNumber" />
            </label>
            <label className="text-sm font-semibold">
              Customer
              <select className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3" name="clientId">
                <option value="">Pilih customer</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Customer Baru
              <input className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3" name="newClientName" placeholder="Isi jika customer belum ada" />
            </label>
            <label className="text-sm font-semibold">
              Tanggal PO
              <input className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3" name="poDate" required type="date" defaultValue={today} />
            </label>
            <label className="text-sm font-semibold">
              Deadline Delivery
              <input className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3" name="dueDate" type="date" />
            </label>
            <label className="text-sm font-semibold md:col-span-2">
              Catatan
              <textarea className="mt-2 min-h-28 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3" name="notes" />
            </label>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <label className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-bold">
                <input name="isUrgent" type="checkbox" />
                URGENT
              </label>
              <label className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-bold">
                <input name="isVendorJob" type="checkbox" />
                VENDOR JOB
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-[#E5E7EB] p-5">
            <h2 className="text-xl font-bold">Item</h2>
            <p className="mt-2 text-sm text-[#6B7280]">Isi beberapa baris jika PO memiliki lebih dari satu item.</p>
            <div className="mt-5 grid gap-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-[#E5E7EB] p-4">
                  <div className="grid gap-3 md:grid-cols-[1fr_120px_120px]">
                    <label className="text-sm font-semibold">
                      Nama Item {index + 1}
                      <input className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3" name={`itemName_${index}`} />
                    </label>
                    <label className="text-sm font-semibold">
                      Unit
                      <input className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3" name={`unit_${index}`} defaultValue="pcs" />
                    </label>
                    <label className="text-sm font-semibold">
                      Jumlah
                      <input className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3" min={1} name={`qty_${index}`} type="number" defaultValue={1} />
                    </label>
                  </div>
                  <label className="mt-3 block text-sm font-semibold">
                    Spesifikasi
                    <input className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3" name={`spec_${index}`} placeholder="Opsional" />
                  </label>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {departments.map((department) => (
                      <label key={department.id} className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] px-3 py-2 text-sm font-semibold">
                        <input name={`departmentIds_${index}`} type="checkbox" value={department.id} />
                        {department.name}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button className="rounded-full bg-brand px-6 py-4 text-sm font-black text-white" type="submit">
            Simpan PO
          </button>
        </form>
      </section>
    </main>
  );
}
