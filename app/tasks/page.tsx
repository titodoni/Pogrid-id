import { notFound } from 'next/navigation';

import { ITEM_STAGES } from '@/lib/constants';
import { db } from '@/lib/db';
import { getRoleHomeRoute, operatorRoleToDepartmentName } from '@/lib/domain';
import { isOperatorRole } from '@/lib/utils';
import { requireSession } from '@/lib/session';

import TasksClient from './TasksClient';

type TasksPageProps = {
  searchParams: Promise<{ q?: string; tab?: string; filter?: string; month?: string }>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const session = await requireSession();
  const role = session.role!;

  // Only allow operators and static roles with tasks access
  const TASK_ROLES = ['ADMIN', 'DRAFTER', 'PURCHASING', 'QC', 'DELIVERY'];
  const allowed = TASK_ROLES.includes(role) || isOperatorRole(role);
  if (!allowed) notFound();

  const query = await searchParams;
  const activeTab = query.tab === 'arsip' ? 'arsip' : 'aktif';
  const searchQuery = query.q || '';
  const filterChip = query.filter || '';
  const monthFilter = query.month || '';

  // Get department for operator roles
  let deptName: string | null = null;
  let departmentId: string | null = null;
  if (isOperatorRole(role)) {
    deptName = operatorRoleToDepartmentName(role);
    if (deptName) {
      const dept = await db.department.findFirst({ where: { name: deptName } });
      departmentId = dept?.id ?? null;
    }
  }

  // Build where clause based on role and tab
  const itemWhere: Record<string, unknown> = {};

  if (activeTab === 'aktif') {
    itemWhere.status = { in: ['DRAFTING', 'PURCHASING', 'PRODUCTION', 'QC', 'DELIVERY'] };
  } else {
    itemWhere.status = { in: ['DONE'] };
  }

  // For operators, filter by their department (for aktif tab)
  if (isOperatorRole(role) && departmentId) {
    if (activeTab === 'aktif') {
      // Items in PRODUCTION stage that belong to this department
      itemWhere.OR = [
        { status: 'DRAFTING' },
        { status: 'PURCHASING' },
        { status: 'QC' },
        { status: 'DELIVERY' },
        { status: 'PRODUCTION', progresses: { some: { departmentId } } },
      ];
    } else {
      // Arsip: items that were done by this department
      // For simplicity, show all DONE items (operator can see their history)
      itemWhere.status = { in: ['DONE'] };
    }
  }

  // Search filter
  if (searchQuery) {
    const pos = await db.pO.findMany({
      where: {
        OR: [
          { po_internal_number: { contains: searchQuery, mode: 'insensitive' } },
          { po_client_number: { contains: searchQuery, mode: 'insensitive' } },
          { client: { name: { contains: searchQuery, mode: 'insensitive' } } },
        ],
      },
      select: { id: true },
    });
    itemWhere.poId = { in: pos.map((po) => po.id) };
  }

  // Fetch items with related data
  const items = await db.item.findMany({
    where: itemWhere,
    include: {
      po: { include: { client: true } },
      progresses: { include: { department: true } },
      problems: { where: { resolved: false } },
      auditLogs: {
        where: { action: 'PROGRESS_UPDATE' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ po: { due_date: 'asc' } }],
  });

  // Month filter for Arsip tab
  let filteredItems = items;
  if (activeTab === 'arsip' && monthFilter) {
    const [year, month] = monthFilter.split('-').map(Number);
    filteredItems = items.filter((item) => {
      if (!item.done_at) return false;
      const d = new Date(item.done_at);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  }

  // Calculate stats for filter chips (Aktif tab only)
  const now = new Date();
  const terlambatCount = activeTab === 'aktif' ? items.filter((item) => new Date(item.po.due_date) < now).length : 0;
  const dekatCount = activeTab === 'aktif'
    ? items.filter((item) => {
        const due = new Date(item.po.due_date);
        const diff = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
        return diff <= 7 && diff >= 0;
      }).length
    : 0;
  const berjalanCount = activeTab === 'aktif'
    ? items.filter((item) => {
        const lastUpdate = item.progresses.length > 0
          ? Math.max(...item.progresses.map((p) => new Date(p.updatedAt).getTime()))
          : 0;
        return lastUpdate > 0 && Date.now() - lastUpdate <= 86_400_000;
      }).length
    : 0;

  // Get available months for Arsip tab
  const months = activeTab === 'arsip'
    ? [...new Set(items.filter((i) => i.done_at).map((i) => {
        const d = new Date(i.done_at!);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }))].sort().reverse()
    : [];

  return (
    <TasksClient
      role={role}
      deptName={deptName}
      departmentId={departmentId}
      items={filteredItems}
      activeTab={activeTab}
      searchQuery={searchQuery}
      filterChip={filterChip}
      terlambatCount={terlambatCount}
      dekatCount={dekatCount}
      berjalanCount={berjalanCount}
      months={months}
      selectedMonth={monthFilter}
    />
  );
}
