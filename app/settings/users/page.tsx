import Link from 'next/link';

import { db } from '@/lib/db';
import { requireRole } from '@/lib/session';

import { resetUserPinAction } from './actions';

type UsersPageProps = {
  searchParams: Promise<{ resetUserId?: string; pin?: string }>;
};

export default async function SettingsUsersPage({ searchParams }: UsersPageProps) {
  await requireRole(['ADMIN']);
  const params = await searchParams;
  const users = await db.user.findMany({
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, username: true, role: true, isActive: true },
  });

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Settings Users</p>
        <h1 className="mt-3 text-3xl font-bold">Reset PIN User</h1>
        <p className="mt-3 text-[#6B7280]">Admin communicates generated PIN to the user out of band.</p>

        <div className="mt-8 grid gap-3">
          {users.map((user) => (
            <article key={user.id} className="rounded-2xl border border-[#E5E7EB] p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold">{user.name}</h2>
                  <p className="text-sm text-[#6B7280]">
                    @{user.username} · {user.role} · {user.isActive ? 'Aktif' : 'Nonaktif'}
                  </p>
                  {params.resetUserId === user.id && params.pin ? (
                    <p className="mt-3 rounded-2xl bg-brand-light px-4 py-3 text-sm font-bold text-brand-dark">
                      PIN baru: <span className="tracking-[0.25em]">{params.pin}</span>
                    </p>
                  ) : null}
                </div>
                <form action={resetUserPinAction}>
                  <input name="userId" type="hidden" value={user.id} />
                  <button className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-bold" type="submit">
                    Reset PIN
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <Link className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold" href="/pos">
            Back to Admin
          </Link>
          <Link className="rounded-full bg-[#1A1A2E] px-4 py-2 text-sm font-semibold text-white" href="/logout">
            Logout
          </Link>
        </div>
      </section>
    </main>
  );
}
