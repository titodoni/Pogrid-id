'use server';

import { redirect } from 'next/navigation';

import { createAuditLog } from '@/lib/audit';
import { db } from '@/lib/db';
import { hashPin, isFourDigitPin } from '@/lib/pins';
import { requireSession } from '@/lib/session';

export async function changeOwnPinAction(formData: FormData) {
  const session = await requireSession();
  const pin = String(formData.get('pin') ?? '');
  const confirmPin = String(formData.get('confirmPin') ?? '');

  if (!isFourDigitPin(pin) || pin !== confirmPin) {
    redirect('/profile?error=pin');
  }

  await db.user.update({
    where: { id: session.userId },
    data: { pin: await hashPin(pin) },
  });

  await createAuditLog({
    action: 'SELF_PIN_CHANGE',
    userId: session.userId!,
    metadata: { targetUserId: session.userId },
  });

  redirect('/profile?changed=1');
}
