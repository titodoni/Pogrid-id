export const JAKARTA_TIMEZONE = 'Asia/Jakarta';

export const STATIC_ROLES = [
  'ADMIN',
  'OWNER',
  'MANAGER',
  'SALES',
  'QC',
  'DELIVERY',
  'FINANCE',
  'DRAFTER',
  'PURCHASING',
] as const;

export const DASHBOARD_ROLES = ['ADMIN', 'OWNER', 'MANAGER', 'SALES'] as const;
export const ADMIN_NOTIFICATION_ROLES = ['OWNER', 'MANAGER', 'ADMIN'] as const;

export const FLAG_COLORS = {
  NORMAL: '#16A34A',
  ORANGE: '#F97316',
  RED: '#EF4444',
  BLOOD_RED: '#7F1D1D',
} as const;

export const FLAG_PRIORITY = {
  NORMAL: 1,
  ORANGE: 2,
  RED: 3,
  BLOOD_RED: 4,
} as const;

export const ITEM_STAGES = ['DRAFTING', 'PURCHASING', 'PRODUCTION', 'QC', 'DELIVERY', 'DONE'] as const;
export const PO_STATUSES = ['ACTIVE', 'FINISHED', 'CLOSED'] as const;
export const INVOICE_STATUSES = ['PENDING', 'INVOICED', 'PAID'] as const;

export const STAGE_TIMESTAMP_FIELDS = {
  DRAFTING: 'drafting_started_at',
  PURCHASING: 'purchasing_started_at',
  PRODUCTION: 'production_started_at',
  QC: 'qc_started_at',
  DELIVERY: 'delivery_started_at',
  DONE: 'done_at',
} as const;

export const DEFAULT_DEPARTMENTS = ['Machining', 'Fabrikasi', 'Finishing'] as const;

export const ROLE_HOME_ROUTES: Record<string, string> = {
  ADMIN: '/pos',
  OWNER: '/dashboard',
  MANAGER: '/dashboard',
  SALES: '/dashboard',
  FINANCE: '/finance',
  DRAFTER: '/tasks',
  PURCHASING: '/tasks',
  QC: '/tasks',
  DELIVERY: '/tasks',
};
