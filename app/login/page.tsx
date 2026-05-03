import { db } from '@/lib/db';
import { redirectIfLoggedIn } from '@/lib/session';

import { loginAction } from './actions';

type LoginPageProps = {
  searchParams: Promise<{ error?: string; userId?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfLoggedIn();

  const params = await searchParams;
  const [users, config] = await Promise.all([
    db.user.findMany({
      where: { isActive: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, role: true },
    }),
    db.systemConfig.findUnique({
      where: { id: 'singleton' },
      select: { adminWaNumber: true, clientName: true },
    }),
  ]);

  const usersByRole = Map.groupBy(users, (user) => user.role);

  return (
    <main className="min-h-screen bg-[#F8F9FA] px-4 py-8 text-[#1A1A2E] sm:px-6">
      <section className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">POgrid.id Login</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Pilih role, nama, lalu masukkan PIN</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6B7280]">
            Sesi tidak kedaluwarsa. Logout hanya melalui tombol manual sesuai PRD.
          </p>
          {params.error === 'pin' ? (
            <p className="mt-5 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#B91C1C] animate-shake">
              PIN salah. Tunggu sebentar lalu coba lagi.
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...usersByRole.entries()].map(([role, roleUsers]) => (
            <section key={role} className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold">{role}</h2>
                <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand-dark">
                  {roleUsers.length} user
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {roleUsers.map((user) => (
                  <form key={user.id} action={loginAction} className="rounded-2xl border border-[#E5E7EB] p-4">
                    <input name="userId" type="hidden" value={user.id} />
                    <label className="block text-sm font-semibold" htmlFor={`pin-${user.id}`}>
                      {user.name}
                    </label>
                    <div className="mt-3 flex gap-2">
                      <input
                        autoComplete="one-time-code"
                        className="min-w-0 flex-1 rounded-full border border-[#E5E7EB] px-4 py-2 text-center text-lg font-bold tracking-[0.35em] outline-none focus:border-brand"
                        id={`pin-${user.id}`}
                        inputMode="numeric"
                        maxLength={4}
                        name="pin"
                        pattern="\d{4}"
                        placeholder="••••"
                        required
                        type="password"
                      />
                      <button className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white" type="submit">
                        Masuk
                      </button>
                    </div>
                    {config?.adminWaNumber ? (
                      <a
                        className="mt-3 inline-flex text-xs font-semibold text-brand-dark"
                        href={buildForgotPinLink(config.adminWaNumber, config.clientName, user.name)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Lupa PIN?
                      </a>
                    ) : null}
                  </form>
                ))}
              </div>
            </section>
          ))}
        </div>

        {users.length === 0 ? (
          <section className="rounded-3xl border border-[#E5E7EB] bg-white p-6 text-sm text-[#6B7280]">
            Belum ada user aktif. Jalankan seed atau buat user dari admin settings.
          </section>
        ) : null}
      </section>
    </main>
  );
}

function buildForgotPinLink(adminWaNumber: string, clientName: string, userName: string) {
  const message = `Halo Admin ${clientName}, saya ${userName} butuh reset PIN untuk akses POgrid. Terima kasih.`;
  return `https://wa.me/${adminWaNumber}?text=${encodeURIComponent(message)}`;
}
