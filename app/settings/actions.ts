'use server';

import { redirect } from 'next/navigation';

import { createAuditLog } from '@/lib/audit';
import { db } from '@/lib/db';
import { generateEasyPin, hashPin } from '@/lib/pins';
import { requireRole } from '@/lib/session';

export async function createUserAction(formData: FormData) {
  const session = await requireRole(['ADMIN']);
  const name = String(formData.get('name') ?? '').trim();
  const username = String(formData.get('username') ?? '').trim();
  const role = String(formData.get('role') ?? '').trim();
  if (!name || !username || !role) redirect('/settings?error=user');

  const pin = generateEasyPin();
  const user = await db.user.create({
    data: { name, username, role, pin: await hashPin(pin) },
  });

  await createAuditLog({
    action: 'USER_CREATED',
    userId: session.userId!,
    metadata: { targetUserId: user.id, role },
  });

  redirect(`/settings?createdUserId=${encodeURIComponent(user.id)}&pin=${pin}`);
}

export async function toggleUserAction(formData: FormData) {
  const session = await requireRole(['ADMIN']);
  const userId = String(formData.get('userId') ?? '');
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { isActive: true } });
  const updated = await db.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });

  await createAuditLog({
    action: 'USER_TOGGLED',
    userId: session.userId!,
    metadata: { targetUserId: userId, isActive: updated.isActive },
  });

  redirect('/settings?toggled=1');
}

export async function resetSettingsUserPinAction(formData: FormData) {
  const session = await requireRole(['ADMIN']);
  const userId = String(formData.get('userId') ?? '');
  const pin = generateEasyPin();
  await db.user.update({ where: { id: userId }, data: { pin: await hashPin(pin) } });

  await createAuditLog({
    action: 'PIN_RESET',
    userId: session.userId!,
    metadata: { targetUserId: userId },
  });

  redirect(`/settings?resetUserId=${encodeURIComponent(userId)}&pin=${pin}`);
}

export async function createClientAction(formData: FormData) {
  await requireRole(['ADMIN']);
  const name = String(formData.get('name') ?? '').trim();
  if (!name) redirect('/settings?error=client');
  await db.client.create({ data: { name } });
  redirect('/settings?clientCreated=1');
}
