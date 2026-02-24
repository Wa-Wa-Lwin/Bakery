// Re-export from the API module for backward compat with existing callers
export type { ApiAuditEntry as AuditEntry } from '../api/auditLog';
export { appendAuditLog as appendAudit, getAuditLogs as loadAudit } from '../api/auditLog';
