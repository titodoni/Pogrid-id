import Link from 'next/link';

import { requireSession } from '@/lib/session';

import { changeOwnPinAction } from './actions';

type ProfilePageProps = {
  searchParams: Promise<{ changed?: string; error?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const session = await requireSession();
  const params = await searchParams;

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Profil</p>
        <h1 className="mt-3 text-3xl font-bold">{session.name}</h1>
        <p className="mt-2 text-sm font-semibold text-[#6B7280]">Role: {session.role}</p>

        {params.changed ? (
          <p className="mt-5 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm font-semibold text-[#15803D]">
            PIN berhasil diubah ✓
          </p>
        ) : null}
        {params.error ? (
          <p className="mt-5 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#B91C1C]">
            PIN harus 4 digit dan konfirmasi harus sama.
          </p>
        ) : null}

        <form action={changeOwnPinAction} className="mt-8 rounded-3xl border border-[#E5E7EB] p-5">
          <h2 className="text-lg font-bold">Ganti PIN</h2>
          <p className="mt-2 text-sm text-[#6B7280]">Tidak perlu PIN lama.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              PIN baru
              <input
                className="mt-2 w-full rounded-full border border-[#E5E7EB] px-4 py-2 text-center text-lg font-bold tracking-[0.35em] outline-none focus:border-brand"
                inputMode="numeric"
                maxLength={4}
                name="pin"
                pattern="\d{4}"
                required
                type="password"
              />
            </label>
            <label className="text-sm font-semibold">
              Konfirmasi PIN
              <input
                className="mt-2 w-full rounded-full border border-[#E5E7EB] px-4 py-2 text-center text-lg font-bold tracking-[0.35em] outline-none focus:border-brand"
                inputMode="numeric"
                maxLength={4}
                name="confirmPin"
                pattern="\d{4}"
                required
                type="password"
              />
            </label>
          </div>
          <button className="mt-5 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white" type="submit">
            Simpan PIN
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold" href="/login">
            Home route
          </Link>
          <Link className="rounded-full bg-[#1A1A2E] px-4 py-2 text-sm font-semibold text-white" href="/logout">
            Logout
          </Link>
        </div>
      </section>
    </main>
  );
}
