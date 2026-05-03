'use server';

import { redirect } from 'next/navigation';

import { compareSuperadminPin } from '@/lib/pins';
import { getSession } from '@/lib/session';

export async function superadminLoginAction(formData: FormData) {
  const pin = String(formData.get('pin') ?? '');

  if (!(await compareSuperadminPin(pin))) {
    redirect('/superadmin?error=pin');
  }

  const session = await getSession();
  session.userId = 'superadmin';
  session.name = 'Superadmin';
  session.department = 'Platform';
  session.role = 'SUPERADMIN';
  session.isLoggedIn = true;
  await session.save();

  redirect('/superadmin');
}
