'use server';

import { redirect } from 'next/navigation';

import { createAuditLog } from '@/lib/audit';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/session';

export async function resolveProblemAction(formData: FormData) {
  const session = await requireRole(['ADMIN']);
  const problemId = String(formData.get('problemId') ?? '');
  const resolutionNote = String(formData.get('resolutionNote') ?? '').trim();

  const problem = await db.problem.findUniqueOrThrow({
    where: { id: problemId },
    include: { item: { select: { poId: true } } },
  });

  await db.problem.update({
    where: { id: problemId },
    data: {
      resolved: true,
      resolvedBy: session.userId,
      resolvedAt: new Date(),
      resolution_note: resolutionNote || undefined,
    },
  });

  await createAuditLog({
    action: 'PROBLEM_RESOLVED',
    userId: session.userId!,
    poId: problem.item.poId,
    itemId: problem.itemId,
    metadata: { problemId, resolutionNote: resolutionNote || null },
  });

  redirect('/masalah?resolved=1');
}
