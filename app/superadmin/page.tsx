import Link from 'next/link';

import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

import { superadminLoginAction } from './actions';

type SuperadminPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SuperadminPage({ searchParams }: SuperadminPageProps) {
  const session = await getSession();
  const params = await searchParams;

  if (session.isLoggedIn && session.role === 'SUPERADMIN') {
    const [config, departments] = await Promise.all([
      db.systemConfig.findUnique({ where: { id: 'singleton' } }),
      db.department.findMany({ orderBy: { order: 'asc' } }),
    ]);

    return (
      <main className="min-h-screen px-6 py-10">
        <section className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Hidden Platform Route</p>
          <h1 className="mt-3 text-3xl font-bold">Superadmin</h1>
          <p className="mt-3 text-[#6B7280]">Platform-level management shell for locked PRD capabilities.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E5E7EB] p-5">
              <h2 className="font-bold">Workspace Branding</h2>
              <p className="mt-2 text-sm text-[#6B7280]">Client: {config?.clientName ?? 'not configured'}</p>
              <p className="mt-1 text-sm text-[#6B7280]">PO Prefix: {config?.poPrefix ?? 'not configured'}</p>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] p-5">
              <h2 className="font-bold">Flag Thresholds</h2>
              <p className="mt-2 text-sm text-[#6B7280]">Orange: {config?.flagThreshold1 ?? 7} days</p>
              <p className="mt-1 text-sm text-[#6B7280]">Red: {config?.flagThreshold2 ?? 3} days</p>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] p-5 md:col-span-2">
              <h2 className="font-bold">Production Departments</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {departments.map((department) => (
                  <span key={department.id} className="rounded-full bg-brand-light px-3 py-1 text-sm font-semibold text-brand-dark">
                    {department.order}. {department.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <Link className="mt-8 inline-flex rounded-full bg-[#1A1A2E] px-4 py-2 text-sm font-semibold text-white" href="/logout">
            Logout
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Superadmin</p>
        <h1 className="mt-3 text-3xl font-bold">Platform PIN</h1>
        <p className="mt-3 text-sm text-[#6B7280]">Hidden route for platform owner only.</p>
        {params.error ? (
          <p className="mt-5 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#B91C1C] animate-shake">
            PIN salah.
          </p>
        ) : null}
        <form action={superadminLoginAction} className="mt-6 flex gap-2">
          <input
            autoComplete="one-time-code"
            className="min-w-0 flex-1 rounded-full border border-[#E5E7EB] px-4 py-2 text-center text-lg font-bold tracking-[0.35em] outline-none focus:border-brand"
            inputMode="numeric"
            maxLength={6}
            name="pin"
            pattern="\d{6}"
            required
            type="password"
          />
          <button className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-white" type="submit">
            Masuk
          </button>
        </form>
      </section>
    </main>
  );
}
