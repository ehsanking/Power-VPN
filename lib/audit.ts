import { query } from '@/lib/db';

export type AuditAction =
  | 'user.create'
  | 'user.delete'
  | 'user.status_change'
  | 'server.create'
  | 'server.delete'
  | 'settings.update'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.login_failed'
  | '2fa.enabled'
  | '2fa.disabled'
  | 'agent.registered';

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        context JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_action (action),
        INDEX idx_created_at (created_at)
      )
    `);
    tableReady = true;
  } catch (_) {}
}

export async function auditLog(
  action: AuditAction,
  details: string,
  context?: Record<string, any>
) {
  await ensureTable();
  try {
    await query(
      'INSERT INTO audit_logs (action, details, context) VALUES (?, ?, ?)',
      [action, details, JSON.stringify(context ?? {})]
    );
  } catch (e) {
    console.error('[audit] write failed:', e);
  }
}
