'use server';

import { redirect } from 'next/navigation';

import { db } from '@/lib/db';
import { comparePin } from '@/lib/pins';
import { setUserSession } from '@/lib/session';
import { ROLE_HOME_ROUTES } from '@/lib/constants';
import { getRoleHomeRoute } from '@/lib/domain';

export async function loginAction(formData: FormData) {
  const userId = String(formData.get('userId') ?? '');
  const pin = String(formData.get('pin') ?? '');

  const user = await db.user.findFirst({
    where: { id: userId, isActive: true },
    select: { id: true, name: true, role: true, pin: true },
  });

  if (!user || !(await comparePin(pin, user.pin))) {
    redirect(`/login?error=pin&userId=${encodeURIComponent(userId)}`);
  }

  await setUserSession(user);
  redirect(getRoleHomeRoute(user.role, ROLE_HOME_ROUTES));
}
