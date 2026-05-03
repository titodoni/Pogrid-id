import { requireRole } from '@/lib/session';
import { getDashboardKPIs } from '@/lib/dashboard';
import { LayoutWrapper } from '@/components/pg/layout-wrapper';

export default async function DashboardPage() {
  const session = await requireRole(['ADMIN', 'OWNER', 'MANAGER', 'SALES']);
  const kpis = await getDashboardKPIs();

  return (
    <LayoutWrapper title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E7EB]">
          <p className="text-sm font-medium text-[#6B7280]">Active POs</p>
          <p className="text-3xl font-bold mt-2">{kpis.totalPOs}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E7EB]">
          <p className="text-sm font-medium text-[#6B7280]">Total Items</p>
          <p className="text-3xl font-bold mt-2">{kpis.totalItems}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E7EB]">
          <p className="text-sm font-medium text-[#6B7280]">Late Items</p>
          <p className="text-3xl font-bold mt-2 text-[#EF4444]">{kpis.lateItems}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E7EB]">
          <p className="text-sm font-medium text-[#6B7280]">Active Items</p>
          <p className="text-3xl font-bold mt-2">{kpis.activeItems}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E7EB]">
        <h2 className="text-lg font-bold mb-4">Export Reports</h2>
        <a 
          href="/api/export/pdf" 
          className="inline-block bg-[#1A1A2E] text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-black transition-colors"
        >
          Download PDF Report
        </a>
      </div>
    </LayoutWrapper>
  );
}
