import type { AuthUser } from '../types/Staff';

const BASE = '/api';

// backend returns structure
export interface ApiAuditEntry {
  id: number;
  timestamp: string;
  user_id: number;
  user_name: string;
  role: string;
  action: string;
  details: string;
}

// fetch audit from be
export async function getAuditLogs(): Promise<ApiAuditEntry[]> {
  const res = await fetch(`${BASE}/audit-logs`, { //send request
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json(); //returns array of logs
}

export async function appendAuditLog(
  user: AuthUser,
  action: string,
  details: string,
): Promise<void> {
  try {
    const res = await fetch(`${BASE}/audit-logs`, { //call id
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        staff_id:  user.staff_id,
        action,
        details,
        user_name: user.full_name,
        role:      user.role_name,
      }),
    });

    if (!res.ok){
      console.warn('Audit log failed:', res.status);
    }
  } catch (err) {
    console.warn('Audit log network error:', err);
    // Audit failures should never block the main flow
  }
}
