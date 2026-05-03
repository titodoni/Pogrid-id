'use server';

import { redirect } from 'next/navigation';

import { createAuditLog } from '@/lib/audit';
import { db } from '@/lib/db';
import { canEscalateFlag, computeUrgencyFlag, departmentNameToOperatorRole } from '@/lib/domain';
import { comparePin } from '@/lib/pins';
import { formatPoNumber } from '@/lib/po';
import { requireRole } from '@/lib/session';
import type { UrgencyFlag } from '@/lib/types';
import { createNotificationsForUsers } from '@/lib/notifications';

type ParsedItemInput = {
  name: string;
  spec?: string;
  unit: string;
  qty: number;
  departmentIds: string[];
};

export async function createPOAction(formData: FormData) {
  const session = await requireRole(['ADMIN']);
  const poClientNumber = String(formData.get('poClientNumber') ?? '').trim();
  const newClientName = String(formData.get('newClientName') ?? '').trim();
  const selectedClientId = String(formData.get('clientId') ?? '').trim();
  const poDateValue = String(formData.get('poDate') ?? '').trim();
  const dueDateValue = String(formData.get('dueDate') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();
  const isUrgent = formData.get('isUrgent') === 'on';
  const isVendorJob = formData.get('isVendorJob') === 'on';
  const suggestedPoNumber = String(formData.get('suggestedPoNumber') ?? '').trim();
  const submittedPoNumber = String(formData.get('poInternalNumber') ?? '').trim();
  const items = parseItemInputs(formData);

  if ((!selectedClientId && !newClientName) || items.length === 0) redirect('/pos/new?error=validation');

  const poDate = poDateValue ? new Date(`${poDateValue}T00:00:00+07:00`) : new Date();
  const dueDate = dueDateValue ? new Date(`${dueDateValue}T00:00:00+07:00`) : poDate;
  const config = await db.systemConfig.findUnique({ where: { id: 'singleton' } });
  const poNumber = submittedPoNumber === suggestedPoNumber || !submittedPoNumber ? await reserveNextPoNumber(config?.poPrefix ?? 'PO-[YYYY]-[SEQ]') : submittedPoNumber;
  const urgencyFlag = computeUrgencyFlag(dueDate, new Date(), {
    threshold1: config?.flagThreshold1 ?? 7,
    threshold2: config?.flagThreshold2 ?? 3,
  });
  const hasDrafter = Boolean(await db.user.findFirst({ where: { role: 'DRAFTER', isActive: true }, select: { id: true } }));
  const now = new Date();

  const result = await db.$transaction(async (tx) => {
    const client = newClientName
      ? await tx.client.create({ data: { name: newClientName } })
      : await tx.client.findUniqueOrThrow({ where: { id: selectedClientId } });

    const po = await tx.pO.create({
      data: {
        po_internal_number: poNumber,
        po_client_number: poClientNumber,
        clientId: client.id,
        due_date: dueDate,
        po_date: poDate,
        is_urgent: isUrgent,
        is_vendor_job: isVendorJob,
        urgency_flag: urgencyFlag,
        notes: notes || undefined,
      },
    });

    for (const itemInput of items) {
      const item = await tx.item.create({
        data: {
          poId: po.id,
          name: itemInput.name,
          spec: itemInput.spec,
          unit: itemInput.unit,
          qty: itemInput.qty,
          work_type: JSON.stringify(itemInput.departmentIds),
          status: hasDrafter ? 'DRAFTING' : 'PURCHASING',
          drafting_started_at: hasDrafter ? now : undefined,
          purchasing_started_at: hasDrafter ? undefined : now,
        },
      });

      await tx.itemProgress.createMany({
        data: itemInput.departmentIds.map((departmentId) => ({ itemId: item.id, departmentId })),
      });
    }

    return { po, clientName: client.name };
  });

  const departmentIds = new Set(items.flatMap((item) => item.departmentIds));
  const departments = await db.department.findMany({ where: { id: { in: [...departmentIds] } }, select: { id: true, name: true } });
  const operatorRoles = departments.map((department) => departmentNameToOperatorRole(department.name));
  await createNotificationsForUsers({
    roles: operatorRoles,
    type: 'NEW_PO',
    message: `PO baru ${result.po.po_internal_number} dari ${result.clientName} telah dibuat`,
    poId: result.po.id,
  });

  await createAuditLog({
    action: 'EDIT_PO_FIELD',
    userId: session.userId!,
    poId: result.po.id,
    metadata: { field: 'created', poNumber: result.po.po_internal_number },
  });

  redirect(`/pos/${result.po.id}?created=1`);
}

export async function updatePOAction(formData: FormData) {
  const session = await requireRole(['ADMIN']);
  const poId = String(formData.get('poId') ?? '');
  const clientId = String(formData.get('clientId') ?? '');
  const poClientNumber = String(formData.get('poClientNumber') ?? '').trim();
  const poDateValue = String(formData.get('poDate') ?? '').trim();
  const dueDateValue = String(formData.get('dueDate') ?? '').trim();
  const urgencyFlag = String(formData.get('urgencyFlag') ?? '') as UrgencyFlag;
  const notes = String(formData.get('notes') ?? '').trim();
  const isUrgent = formData.get('isUrgent') === 'on';
  const isVendorJob = formData.get('isVendorJob') === 'on';

  const current = await db.pO.findUniqueOrThrow({ where: { id: poId } });
  if (urgencyFlag !== current.urgency_flag && !canEscalateFlag(current.urgency_flag as UrgencyFlag, urgencyFlag)) {
    redirect(`/pos/${poId}?error=flag`);
  }

  await db.pO.update({
    where: { id: poId },
    data: {
      clientId,
      po_client_number: poClientNumber,
      po_date: poDateValue ? new Date(`${poDateValue}T00:00:00+07:00`) : current.po_date,
      due_date: dueDateValue ? new Date(`${dueDateValue}T00:00:00+07:00`) : current.due_date,
      is_urgent: isUrgent,
      is_vendor_job: isVendorJob,
      urgency_flag: urgencyFlag,
      notes: notes || null,
    },
  });

  await createAuditLog({
    action: urgencyFlag !== current.urgency_flag ? 'FLAG_ESCALATE' : 'EDIT_PO_FIELD',
    userId: session.userId!,
    poId,
    fromValue: current.urgency_flag,
    toValue: urgencyFlag,
    metadata: { field: 'po_header' },
  });

  redirect(`/pos/${poId}?updated=1`);
}

export async function deletePOAction(formData: FormData) {
  const session = await requireRole(['ADMIN']);
  const poId = String(formData.get('poId') ?? '');
  const pin = String(formData.get('pin') ?? '');
  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId } });

  if (!(await comparePin(pin, user.pin))) redirect(`/pos/${poId}?error=pin`);

  const po = await db.pO.findUniqueOrThrow({
    where: { id: poId },
    include: { items: { select: { id: true, status: true, invoice_status: true } } },
  });
  const blocked = po.items.some((item) => item.status === 'DONE' || item.invoice_status === 'PAID');
  if (blocked) redirect(`/pos/${poId}?error=delete-blocked`);

  await db.$transaction(async (tx) => {
    const itemIds = po.items.map((item) => item.id);
    await tx.auditLog.deleteMany({ where: { OR: [{ poId }, { itemId: { in: itemIds } }] } });
    await tx.problem.deleteMany({ where: { itemId: { in: itemIds } } });
    await tx.itemProgress.deleteMany({ where: { itemId: { in: itemIds } } });
    await tx.item.deleteMany({ where: { poId } });
    await tx.pO.delete({ where: { id: poId } });
  });

  await createAuditLog({
    action: 'DELETE_PO',
    userId: session.userId!,
    poId,
    metadata: { totalItems: po.items.length, poNumber: po.po_internal_number },
  });

  redirect('/pos?deleted=1');
}

function parseItemInputs(formData: FormData): ParsedItemInput[] {
  const items: ParsedItemInput[] = [];

  for (let index = 0; index < 5; index += 1) {
    const name = String(formData.get(`itemName_${index}`) ?? '').trim();
    const spec = String(formData.get(`spec_${index}`) ?? '').trim();
    const unit = String(formData.get(`unit_${index}`) ?? 'pcs').trim() || 'pcs';
    const qty = Number(formData.get(`qty_${index}`) ?? 1);
    const departmentIds = formData.getAll(`departmentIds_${index}`).map(String).filter(Boolean);
    if (!name) continue;
    if (!Number.isFinite(qty) || qty < 1 || departmentIds.length === 0) redirect('/pos/new?error=validation');
    items.push({ name, spec: spec || undefined, unit, qty: Math.floor(qty), departmentIds });
  }

  return items;
}

async function reserveNextPoNumber(template: string) {
  const year = new Date().getFullYear();
  const sequence = await db.poSequence.upsert({
    where: { id: 'singleton' },
    update: { year, sequence: { increment: 1 } },
    create: { id: 'singleton', year, sequence: 1 },
  });

  const currentSequence = sequence.year === year ? sequence.sequence : 1;
  if (sequence.year !== year) {
    await db.poSequence.update({ where: { id: 'singleton' }, data: { year, sequence: 1 } });
  }

  return formatPoNumber(template, year, currentSequence);
}
