import { db } from './db';
import type { AuditAction } from './types';

type AuditMetadata = Record<string, string | number | boolean | null | undefined>;

type CreateAuditLogInput = {
  action: AuditAction;
  userId: string;
  itemId?: string;
  poId?: string;
  fromValue?: string | number | boolean | null;
  toValue?: string | number | boolean | null;
  metadata?: AuditMetadata;
};

export async function createAuditLog(input: CreateAuditLogInput) {
  return db.auditLog.create({
    data: {
      action: input.action,
      userId: input.userId,
      itemId: input.itemId,
      poId: input.poId,
      fromValue: stringifyAuditValue(input.fromValue),
      toValue: stringifyAuditValue(input.toValue),
      metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    },
  });
}

export function stringifyAuditValue(value: string | number | boolean | null | undefined) {
  if (value === undefined || value === null) return undefined;
  return String(value);
}
