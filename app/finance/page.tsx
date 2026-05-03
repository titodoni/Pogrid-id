import Link from 'next/link';

import { requireRole } from '@/lib/session';

export default async function FinancePage() {
  const session = await requireRole(['FINANCE']);

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Finance</p>
        <h1 className="mt-3 text-3xl font-bold">Invoice Management</h1>
        <p className="mt-3 text-[#6B7280]">Phase finance work will add invoice state transitions here.</p>
        <p className="mt-5 text-sm font-semibold">Logged in as {session.name}</p>
        <div className="mt-6 flex gap-3">
          <Link className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold" href="/profile">
            Profile
          </Link>
          <Link className="rounded-full bg-[#1A1A2E] px-4 py-2 text-sm font-semibold text-white" href="/logout">
            Logout
          </Link>
        </div>
      </section>
    </main>
  );
}
