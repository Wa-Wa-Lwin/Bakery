import type { AuthUser } from '../types/Staff';

export interface AuditEntry {
  id: string;
  timestamp: string;
  user_id: number;
  user_name: string;
  role: string;
  action: string;
  details: string;
}

const AUDIT_KEY = 'bakery_audit';

export function loadAudit(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    if (raw) return JSON.parse(raw) as AuditEntry[];
  } catch { /* fallthrough */ }
  return [];
}

export function appendAudit(user: AuthUser, action: string, details: string): void {
  const entries = loadAudit();
  const entry: AuditEntry = {
    id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    user_id: user.staff_id,
    user_name: user.full_name,
    role: user.role_name,
    action,
    details,
  };
  localStorage.setItem(AUDIT_KEY, JSON.stringify([entry, ...entries]));
}
