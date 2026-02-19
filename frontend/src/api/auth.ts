import type { Staff, AuthUser } from '../types/Staff';

const BASE = '/api';
const SESSION_KEY = 'bakery_auth_user';

export interface LoginError {
  message: string;
  errors?: Record<string, string[]>;
}

export async function login(accessCode: string): Promise<AuthUser> {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ access_code: accessCode }),
  });

  if (!res.ok) {
    const body: LoginError = await res.json();
    throw body;
  }

  const staff: Staff = await res.json();
  const user: AuthUser = {
    staff_id: staff.staff_id,
    full_name: staff.full_name,
    role_name: staff.role_name,
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function getSessionUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as AuthUser;
  } catch { /* ignore */ }
  return null;
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
