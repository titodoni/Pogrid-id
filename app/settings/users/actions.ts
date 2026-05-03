'use server';

import { redirect } from 'next/navigation';

import { createAuditLog } from '@/lib/audit';
import { db } from '@/lib/db';
import { generateEasyPin, hashPin } from '@/lib/pins';
import { requireRole } from '@/lib/session';

export async function resetUserPinAction(formData: FormData) {
  const session = await requireRole(['ADMIN']);
  const userId = String(formData.get('userId') ?? '');
  const newPin = generateEasyPin();

  await db.user.update({
    where: { id: userId },
    data: { pin: await hashPin(newPin) },
  });

  await createAuditLog({
    action: 'PIN_RESET',
    userId: session.userId!,
    metadata: { targetUserId: userId },
  });

  redirect(`/settings/users?resetUserId=${encodeURIComponent(userId)}&pin=${newPin}`);
}
