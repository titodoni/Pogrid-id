'use client';

import { startTransition, useActionState, useDeferredValue, useOptimistic, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { ITEM_STAGES, FLAG_COLORS } from '@/lib/constants';
import { calculateItemProgress, formatDate, getDaysLate, getHoursLate } from '@/lib/po';
import { isOperatorRole } from '@/lib/utils';
import type { ItemStatus, ReworkType } from '@/lib/types';

import { updateProgressAction, approveDrawingAction, requestRedrawAction, updatePurchasingProgressAction, submitQCResultAction, confirmDeliveryAction, reportProblemAction } from './actions';
import ItemCard from './components/ItemCard';
import UpdatePanel from './components/UpdatePanel';
import ProblemSheet from './components/ProblemSheet';
import type { ItemWithRelations } from './types';

type TasksClientProps = {
  role: string;
  deptName: string | null;
  departmentId: string | null;
  items: ItemWithRelations[];
  activeTab: string;
  searchQuery: string;
  filterChip: string;
  terlambatCount: number;
  dekatCount: number;
  berjalanCount: number;
  months: string[];
  selectedMonth: string;
};

export default function TasksClient({
  role,
  deptName,
  departmentId,
  items,
  activeTab,
  searchQuery,
  filterChip,
  terlambatCount,
  dekatCount,
  berjalanCount,
  months,
  selectedMonth,
}: TasksClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [problemItemId, setProblemItemId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter items based on chip selection
  const deferredSearch = useDeferredValue(searchQuery);
  const filteredItems = items.filter((item) => {
    // Search filter
    if (deferredSearch) {
      const q = deferredSearch.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.po.client.name.toLowerCase().includes(q) ||
        item.po.po_internal_number.toLowerCase().includes(q) ||
        (item.po.po_client_number?.toLowerCase().includes(q) ?? false);
      if (!matchesSearch) return false;
    }

    // Filter chip logic (Aktif tab only)
    if (activeTab === 'aktif' && filterChip) {
      const now = new Date();
      if (filterChip === 'terlambat') {
        return new Date(item.po.due_date) < now;
      }
      if (filterChip === 'dekat') {
        const diff = Math.ceil((new Date(item.po.due_date).getTime() - now.getTime()) / 86_400_000);
        return diff <= 7 && diff >= 0;
      }
      if (filterChip === 'berjalan') {
        const lastUpdate = item.progresses.length > 0
          ? Math.max(...item.progresses.map((p) => new Date(p.updatedAt).getTime()))
          : 0;
        return lastUpdate > 0 && Date.now() - lastUpdate <= 86_400_000;
      }
    }

    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (activeTab === 'aktif') {
      // Sort by: delayed first, then deadline closest, then urgent flag, then rework
      const aLate = getDaysLate(new Date(a.po.due_date));
      const bLate = getDaysLate(new Date(b.po.due_date));
      if (aLate !== bLate) return bLate - aLate; // More late first

      const aDue = new Date(a.po.due_date).getTime();
      const bDue = new Date(b.po.due_date).getTime();
      if (aDue !== bDue) return aDue - bDue; // Earlier due first

      const flagOrder = { BLOOD_RED: 4, RED: 3, ORANGE: 2, NORMAL: 1 };
      const aFlag = flagOrder[a.po.urgency_flag as keyof typeof flagOrder] || 0;
      const bFlag = flagOrder[b.po.urgency_flag as keyof typeof flagOrder] || 0;
      if (aFlag !== bFlag) return bFlag - aFlag;

      if (a.is_rework !== b.is_rework) return a.is_rework ? 1 : -1;

      return 0;
    }
    // Arsip: sort by done_at descending
    const aDone = a.done_at ? new Date(a.done_at).getTime() : 0;
    const bDone = b.done_at ? new Date(b.done_at).getTime() : 0;
    return bDone - aDone;
  });

  function handleTabChange(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'arsip') {
      params.set('tab', 'arsip');
    } else {
      params.delete('tab');
    }
    params.delete('filter');
    router.push(`/tasks?${params.toString()}`);
  }

  function handleFilterChip(chip: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get('filter') === chip) {
      params.delete('filter');
    } else {
      params.set('filter', chip);
    }
    router.push(`/tasks?${params.toString()}`);
  }

  function handleMonthChange(month: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (month) {
      params.set('month', month);
    } else {
      params.delete('month');
    }
    router.push(`/tasks?${params.toString()}`);
  }

  function handleSearchChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    router.push(`/tasks?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[#E5E7EB] bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold">Tugas Saya</h1>
          <div className="flex items-center gap-2">
            <Link href="/logout" className="rounded-full p-2 text-[#6B7280] hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
        {/* Search */}
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Cari item, customer, PO..."
            defaultValue={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-2xl border border-[#E5E7EB] bg-white py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-2 border-b border-[#E5E7EB]">
          <button
            onClick={() => handleTabChange('aktif')}
            className={`border-b-2 px-4 py-2 text-sm font-semibold ${
              activeTab === 'aktif'
                ? 'border-brand text-brand'
                : 'border-transparent text-[#6B7280] hover:text-[#1A1A2E]'
            }`}
          >
            Aktif ({items.filter((i) => !['DONE'].includes(i.status)).length})
          </button>
          <button
            onClick={() => handleTabChange('arsip')}
            className={`border-b-2 px-4 py-2 text-sm font-semibold ${
              activeTab === 'arsip'
                ? 'border-brand text-brand'
                : 'border-transparent text-[#6B7280] hover:text-[#1A1A2E]'
            }`}
          >
            Arsip ({items.filter((i) => i.status === 'DONE').length})
          </button>
        </div>

        {/* Filter Chips (Aktif only) */}
        {activeTab === 'aktif' && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <FilterChip
              label="Terlambat"
              count={terlambatCount}
              active={filterChip === 'terlambat'}
              onClick={() => handleFilterChip('terlambat')}
            />
            <FilterChip
              label="Dekat"
              count={dekatCount}
              active={filterChip === 'dekat'}
              onClick={() => handleFilterChip('dekat')}
            />
            <FilterChip
              label="Berjalan"
              count={berjalanCount}
              active={filterChip === 'berjalan'}
              onClick={() => handleFilterChip('berjalan')}
            />
          </div>
        )}

        {/* Month Selector (Arsip only) */}
        {activeTab === 'arsip' && months.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={() => {
                const idx = months.indexOf(selectedMonth);
                handleMonthChange(idx < months.length - 1 ? months[idx + 1] : months[0]);
              }}
              className="rounded-full p-1 text-[#6B7280] hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-[#1A1A2E]">
              {selectedMonth
                ? new Date(`${selectedMonth}-01`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
                : 'Semua Waktu'}
            </span>
            <button
              onClick={() => {
                const idx = months.indexOf(selectedMonth);
                handleMonthChange(idx > 0 ? months[idx - 1] : months[months.length - 1]);
              }}
              className="rounded-full p-1 text-[#6B7280] hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}

        {/* Item List */}
        <div className="space-y-3">
          {sortedItems.length === 0 && (
            <p className="py-12 text-center text-[#6B7280]">Tidak ada item ditemukan.</p>
          )}
          {sortedItems.map((item) => {
            const isOwnItem = deptName
              ? item.status === 'PRODUCTION' && item.progresses.some((p) => p.department.name === deptName)
              : ['DRAFTER', 'PURCHASING', 'QC', 'DELIVERY', 'ADMIN'].includes(role);

            return (
              <ItemCard
                key={item.id}
                item={item}
                role={role}
                deptName={deptName}
                isOwnItem={isOwnItem}
                isExpanded={expandedItemId === item.id}
                onToggleExpand={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                onReportProblem={() => setProblemItemId(item.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Update Panel (inline) */}
      {expandedItemId && (
        <UpdatePanel
          item={sortedItems.find((i) => i.id === expandedItemId)!}
          role={role}
          deptName={deptName}
          departmentId={departmentId}
          onClose={() => setExpandedItemId(null)}
          onReportProblem={() => setProblemItemId(expandedItemId)}
        />
      )}

      {/* Problem Sheet */}
      {problemItemId && (
        <ProblemSheet
          itemId={problemItemId}
          onClose={() => setProblemItemId(null)}
        />
      )}
    </main>
  );
}

function FilterChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        active
          ? 'border-brand bg-brand-light text-brand'
          : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-brand/50'
      }`}
    >
      {label} ({count})
    </button>
  );
}
