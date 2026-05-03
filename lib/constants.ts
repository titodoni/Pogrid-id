export const JAKARTA_TIMEZONE = 'Asia/Jakarta';

export const FLAG_COLORS = {
  NORMAL: '#16A34A',
  ORANGE: '#F97316',
  RED: '#EF4444',
  BLOOD_RED: '#7F1D1D',
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
