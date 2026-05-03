import type { ItemStatus, UrgencyFlag } from './types';

type POProgressItem = {
  status: string;
  drawing_approved: boolean;
  purchasing_progress: number;
  progresses: { progress: number }[];
};

export function formatPoNumber(template: string, year: number, sequence: number) {
  return template.replace('[YYYY]', String(year)).replace('[SEQ]', String(sequence).padStart(4, '0'));
}

export async function peekNextPoNumber(input: {
  sequence: { year: number; sequence: number } | null;
  template: string;
  year?: number;
}) {
  const year = input.year ?? new Date().getFullYear();
  const nextSequence = input.sequence?.year === year ? input.sequence.sequence + 1 : 1;
  return formatPoNumber(input.template, year, nextSequence);
}

export function calculatePOProgress(items: POProgressItem[]) {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + calculateItemProgress(item), 0);
  return Math.round(total / items.length);
}

export function calculateItemProgress(item: POProgressItem) {
  if (item.status === 'DONE') return 100;
  if (item.status === 'DELIVERY') return 90;
  if (item.status === 'QC') return 80;
  if (item.status === 'PRODUCTION') {
    if (item.progresses.length === 0) return 40;
    const average = item.progresses.reduce((sum, progress) => sum + progress.progress, 0) / item.progresses.length;
    return Math.round(40 + average * 0.4);
  }
  if (item.status === 'PURCHASING') return Math.max(20, Math.round(20 + item.purchasing_progress * 0.2));
  if (item.status === 'DRAFTING' && item.drawing_approved) return 20;
  return 0;
}

export function getHoursLate(dueDate: Date, now = new Date()) {
  const diff = now.getTime() - dueDate.getTime();
  return diff > 0 ? Math.floor(diff / 3_600_000) : 0;
}

export function getDaysLate(dueDate: Date, now = new Date()) {
  return Math.floor(getHoursLate(dueDate, now) / 24);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function getStatusLabel(status: string) {
  return status.replaceAll('_', ' ');
}

export function isUrgentFlag(flag: string) {
  return flag === 'ORANGE' || flag === 'RED' || flag === 'BLOOD_RED';
}

export function isItemStatus(status: string): status is ItemStatus {
  return ['DRAFTING', 'PURCHASING', 'PRODUCTION', 'QC', 'DELIVERY', 'DONE'].includes(status);
}

export function isUrgencyFlag(flag: string): flag is UrgencyFlag {
  return ['NORMAL', 'ORANGE', 'RED', 'BLOOD_RED'].includes(flag);
}
