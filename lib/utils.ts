import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { STATIC_ROLES } from './constants';
import type { Role, StaticRole } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isOperatorRole(role: string): role is `OPERATOR_${string}` {
  return role.startsWith('OPERATOR_');
}

export function isStaticRole(role: string): role is StaticRole {
  return (STATIC_ROLES as readonly string[]).includes(role);
}

export function isRole(role: string): role is Role {
  return isStaticRole(role) || isOperatorRole(role);
}
