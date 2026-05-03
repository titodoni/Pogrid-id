import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8F9FA] px-6 py-10 text-[#1A1A2E]">
      <section className="mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl border border-[#E5E7EB] bg-white p-8 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">POgrid.id</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Production order visibility layer</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#6B7280]">
            Initial scaffold aligned with the locked PRD. Authentication, PO flow, operator tasks, finance, and dashboard modules are ready to be built next.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white" href="/login">
            Login
          </Link>
          <Link className="rounded-full border border-[#E5E7EB] px-5 py-3 text-sm font-semibold" href="/demo">
            Demo
          </Link>
        </div>
      </section>
    </main>
  );
}
