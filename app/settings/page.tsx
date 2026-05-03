import Link from 'next/link';

import { db } from '@/lib/db';
import { departmentNameToOperatorRole, listStaticRoles } from '@/lib/domain';
import { requireRole } from '@/lib/session';

import { createClientAction, createUserAction, resetSettingsUserPinAction, toggleUserAction } from './actions';

type SettingsPageProps = {
  searchParams: Promise<{
    createdUserId?: string;
    resetUserId?: string;
    pin?: string;
    toggled?: string;
    clientCreated?: string;
    error?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  await requireRole(['ADMIN']);
  const params = await searchParams;
  const [users, clients, departments, config] = await Promise.all([
    db.user.findMany({ orderBy: [{ role: 'asc' }, { name: 'asc' }] }),
    db.client.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { pos: true } } } }),
    db.department.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    db.systemConfig.findUnique({ where: { id: 'singleton' } }),
  ]);
  const roles = [...listStaticRoles(), ...departments.map((department) => departmentNameToOperatorRole(department.name))];

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Kelola</p>
          <h1 className="mt-3 text-3xl font-bold">Settings</h1>
          <p className="mt-3 text-[#6B7280]">Users / Klien / Flags dalam satu halaman.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white" href="#users">Users</a>
            <a className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-bold" href="#clients">Klien</a>
            <a className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-bold" href="#flags">Flags</a>
            <Link className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-bold" href="/pos">Beranda</Link>
          </div>
        </div>

        {params.pin ? (
          <p className="mt-5 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm font-semibold text-[#15803D]">
            PIN baru: <span className="tracking-[0.25em]">{params.pin}</span>
          </p>
        ) : null}
        {params.toggled ? <Notice text="Status user berhasil diubah." /> : null}
        {params.clientCreated ? <Notice text="Klien berhasil ditambahkan." /> : null}
        {params.error ? <p className="mt-5 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#B91C1C]">Form belum lengkap.</p> : null}

        <section id="users" className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Users</h2>
          <form action={createUserAction} className="mt-5 grid gap-3 rounded-2xl border border-[#E5E7EB] p-4 md:grid-cols-4">
            <input className="rounded-full border border-[#E5E7EB] px-4 py-2" name="name" placeholder="Nama" required />
            <input className="rounded-full border border-[#E5E7EB] px-4 py-2" name="username" placeholder="Username" required />
            <select className="rounded-full border border-[#E5E7EB] px-4 py-2" name="role" required>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <button className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white" type="submit">+ Tambah User</button>
          </form>

          <div className="mt-5 grid gap-3">
            {users.map((user) => (
              <article key={user.id} className="rounded-2xl border border-[#E5E7EB] p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-bold">{user.name}</h3>
                    <p className="text-sm text-[#6B7280]">@{user.username} · {user.role} · {user.isActive ? 'Aktif' : 'Nonaktif'}</p>
                    {(params.createdUserId === user.id || params.resetUserId === user.id) && params.pin ? (
                      <p className="mt-3 rounded-2xl bg-brand-light px-4 py-3 text-sm font-bold text-brand-dark">
                        PIN baru: <span className="tracking-[0.25em]">{params.pin}</span>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={resetSettingsUserPinAction}>
                      <input name="userId" type="hidden" value={user.id} />
                      <button className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-bold" type="submit">Reset PIN</button>
                    </form>
                    <form action={toggleUserAction}>
                      <input name="userId" type="hidden" value={user.id} />
                      <button className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-bold" type="submit">
                        {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="clients" className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Klien</h2>
          <form action={createClientAction} className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#E5E7EB] p-4 sm:flex-row">
            <input className="min-w-0 flex-1 rounded-full border border-[#E5E7EB] px-4 py-2" name="name" placeholder="Nama perusahaan" required />
            <button className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white" type="submit">Tambah Klien</button>
          </form>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {clients.map((client) => (
              <div key={client.id} className="rounded-2xl border border-[#E5E7EB] p-4">
                <h3 className="font-bold">{client.name}</h3>
                <p className="text-sm text-[#6B7280]">{client._count.pos} PO</p>
              </div>
            ))}
          </div>
        </section>

        <section id="flags" className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Flags</h2>
          <p className="mt-3 text-[#6B7280]">Threshold diatur oleh Superadmin. Hubungi platform owner untuk mengubah.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#E5E7EB] p-4">
              <p className="text-sm font-semibold text-[#6B7280]">ORANGE</p>
              <p className="mt-2 text-3xl font-black">≤ {config?.flagThreshold1 ?? 7} hari</p>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] p-4">
              <p className="text-sm font-semibold text-[#6B7280]">RED</p>
              <p className="mt-2 text-3xl font-black">≤ {config?.flagThreshold2 ?? 3} hari</p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function Notice({ text }: { text: string }) {
  return <p className="mt-5 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm font-semibold text-[#15803D]">{text}</p>;
}
