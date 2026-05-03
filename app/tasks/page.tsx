import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ROLE_HOME_ROUTES } from '@/lib/constants';
import { getRoleHomeRoute } from '@/lib/domain';
import { requireSession } from '@/lib/session';

const TASK_ROLES = ['ADMIN', 'DRAFTER', 'PURCHASING', 'QC', 'DELIVERY'];

export default async function TasksPage() {
  const session = await requireSession();
  const allowed = TASK_ROLES.includes(session.role!) || session.role!.startsWith('OPERATOR_');
  if (!allowed) redirect(getRoleHomeRoute(session.role!, ROLE_HOME_ROUTES));

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Tasks</p>
        <h1 className="mt-3 text-3xl font-bold">Role-filtered Operator Queue</h1>
        <p className="mt-3 text-[#6B7280]">Phase operator work will add task cards for {session.role} here.</p>
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
