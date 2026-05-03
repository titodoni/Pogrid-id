import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ROLE_HOME_ROUTES } from './constants';
import { getRoleHomeRoute, operatorRoleToDepartmentName } from './domain';

export interface SessionData {
  userId?: string;
  name?: string;
  department?: string;
  role?: string;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD!,
  cookieName: 'pogrid-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function setUserSession(user: { id: string; name: string; role: string }) {
  const session = await getSession();
  session.userId = user.id;
  session.name = user.name;
  session.role = user.role;
  session.department = operatorRoleToDepartmentName(user.role) ?? user.role;
  session.isLoggedIn = true;
  await session.save();
}

export async function clearSession() {
  const session = await getSession();
  session.destroy();
}

export async function requireSession() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId || !session.role) redirect('/login');
  return session;
}

export async function requireRole(allowedRoles: readonly string[]) {
  const session = await requireSession();
  if (!allowedRoles.includes(session.role!)) redirect(getRoleHomeRoute(session.role!, ROLE_HOME_ROUTES));
  return session;
}

export async function redirectIfLoggedIn() {
  const session = await getSession();
  if (session.isLoggedIn && session.role) redirect(getRoleHomeRoute(session.role, ROLE_HOME_ROUTES));
}
