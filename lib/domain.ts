import {
  DASHBOARD_ROLES,
  FLAG_PRIORITY,
  INVOICE_STATUSES,
  ITEM_STAGES,
  JAKARTA_TIMEZONE,
  PO_STATUSES,
  STAGE_TIMESTAMP_FIELDS,
  STATIC_ROLES,
} from './constants';
import type { InvoiceStatus, ItemStatus, POStatus, Role, StageTimestampField, UrgencyFlag } from './types';
import { isOperatorRole, isStaticRole } from './utils';

type ProgressLike = {
  departmentId: string;
  progress: number;
};

type ItemLike = {
  status: string;
  work_type: string;
};

type ItemFinanceLike = {
  status: string;
  invoice_status: string;
};

export function departmentNameToOperatorRole(departmentName: string): `OPERATOR_${string}` {
  return `OPERATOR_${departmentName.trim().toUpperCase().replaceAll(/[^A-Z0-9]+/g, '_').replaceAll(/^_+|_+$/g, '')}`;
}

export function operatorRoleToDepartmentName(role: string) {
  if (!isOperatorRole(role)) return null;
  return role.replace(/^OPERATOR_/, '').replaceAll('_', ' ');
}

export function canViewDashboard(role: string) {
  return (DASHBOARD_ROLES as readonly string[]).includes(role);
}

export function canManageUsers(role: string) {
  return role === 'ADMIN';
}

export function canReportProblem(role: string) {
  return role === 'ADMIN' || role === 'QC' || role === 'DELIVERY' || isOperatorRole(role);
}

export function canManageFinance(role: string) {
  return role === 'ADMIN' || role === 'FINANCE';
}

export function canUpdateStage(role: string, status: ItemStatus, departmentName?: string) {
  if (role === 'ADMIN') return true;
  if (status === 'DRAFTING') return role === 'DRAFTER';
  if (status === 'PURCHASING') return role === 'PURCHASING';
  if (status === 'QC') return role === 'QC';
  if (status === 'DELIVERY') return role === 'DELIVERY';
  if (status !== 'PRODUCTION' || !departmentName) return false;
  return role === departmentNameToOperatorRole(departmentName);
}

export function assertRole(role: string): asserts role is Role {
  if (!isStaticRole(role) && !isOperatorRole(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
}

export function assertItemStatus(status: string): asserts status is ItemStatus {
  if (!(ITEM_STAGES as readonly string[]).includes(status)) {
    throw new Error(`Invalid item status: ${status}`);
  }
}

export function assertPOStatus(status: string): asserts status is POStatus {
  if (!(PO_STATUSES as readonly string[]).includes(status)) {
    throw new Error(`Invalid PO status: ${status}`);
  }
}

export function assertInvoiceStatus(status: string): asserts status is InvoiceStatus {
  if (!(INVOICE_STATUSES as readonly string[]).includes(status)) {
    throw new Error(`Invalid invoice status: ${status}`);
  }
}

export function parseWorkType(workType: string) {
  const parsed: unknown = JSON.parse(workType);
  if (!Array.isArray(parsed) || !parsed.every((value) => typeof value === 'string')) {
    throw new Error('Item work_type must be a JSON array of department IDs');
  }
  return parsed;
}

export function getNextStage(status: ItemStatus): ItemStatus | null {
  const index = ITEM_STAGES.indexOf(status);
  return ITEM_STAGES[index + 1] ?? null;
}

export function getStageTimestampField(status: ItemStatus): StageTimestampField {
  return STAGE_TIMESTAMP_FIELDS[status];
}

export function checkAndAdvanceToQC(item: ItemLike, progresses: ProgressLike[]) {
  if (item.status !== 'PRODUCTION') return false;

  const departmentIds = parseWorkType(item.work_type);
  if (departmentIds.length === 0) return false;

  return departmentIds.every((departmentId) => {
    const progress = progresses.find((entry) => entry.departmentId === departmentId);
    return progress ? progress.progress >= 100 : false;
  });
}

export function computePOStatus(items: ItemFinanceLike[]): POStatus {
  if (items.length === 0) return 'ACTIVE';

  const allPaid = items.every((item) => item.invoice_status === 'PAID');
  const allDone = items.every((item) => item.status === 'DONE');

  if (allPaid) return 'CLOSED';
  if (allDone) return 'FINISHED';
  return 'ACTIVE';
}

export function canEscalateFlag(fromFlag: UrgencyFlag, toFlag: UrgencyFlag) {
  return FLAG_PRIORITY[toFlag] > FLAG_PRIORITY[fromFlag];
}

export function computeUrgencyFlag(
  dueDate: Date,
  today = new Date(),
  thresholds: { threshold1: number; threshold2: number } = { threshold1: 7, threshold2: 3 },
): UrgencyFlag {
  const daysRemaining = differenceInJakartaCalendarDays(dueDate, today);

  if (daysRemaining < 0) return 'BLOOD_RED';
  if (daysRemaining <= thresholds.threshold2) return 'RED';
  if (daysRemaining <= thresholds.threshold1) return 'ORANGE';
  return 'NORMAL';
}

export function getRoleHomeRoute(role: string, routes: Record<string, string>) {
  if (isOperatorRole(role)) return '/tasks';
  return routes[role] ?? '/login';
}

export function listStaticRoles() {
  return [...STATIC_ROLES];
}

function differenceInJakartaCalendarDays(later: Date, earlier: Date) {
  const laterDay = getJakartaDayNumber(later);
  const earlierDay = getJakartaDayNumber(earlier);
  return Math.round((laterDay - earlierDay) / 86_400_000);
}

function getJakartaDayNumber(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);

  return Date.UTC(year, month - 1, day);
}
