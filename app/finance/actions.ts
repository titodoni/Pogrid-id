'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/session';
import { db } from '@/lib/db';
import { InvoiceStatus } from '@/lib/types';
import { validateInvoiceTransition, computePOStatus } from '@/lib/domain';
import { createAuditLog } from '@/lib/audit';

export async function updateInvoiceStatus(itemId: string, status: InvoiceStatus) {
  const session = await requireRole(['ADMIN', 'FINANCE']);
  
  const item = await db.item.findUnique({
    where: { id: itemId },
    select: { id: true, invoice_status: true, poId: true },
  });

  if (!item) throw new Error('Item not found');
  if (!validateInvoiceTransition(item.invoice_status as InvoiceStatus, status)) {
    throw new Error('Invalid status transition');
  }

  await db.item.update({
    where: { id: itemId },
    data: { invoice_status: status },
  });

  // Recompute PO status
  const poItems = await db.item.findMany({ where: { poId: item.poId } });
  const newPOStatus = computePOStatus(poItems);
  await db.pO.update({
    where: { id: item.poId },
    data: { status: newPOStatus },
  });

  await createAuditLog({
    userId: session.userId!,
    action: 'INVOICE_UPDATE',
    itemId: itemId,
    poId: item.poId,
    fromValue: item.invoice_status,
    toValue: status,
    metadata: { details: `Transitioned to ${status}` },
  });

  revalidatePath('/finance');
  revalidatePath(`/pos/${item.poId}`);
}
