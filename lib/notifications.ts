import { query } from '@/lib/db';

export type NotificationType =
  | 'user_expiring'
  | 'traffic_limit'
  | 'server_offline'
  | 'server_online';

export type Severity = 'info' | 'warning' | 'critical';

let tableReady = false;

export async function ensureNotificationsTable() {
  if (tableReady) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
        message TEXT NOT NULL,
        data JSON,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_is_read (is_read),
        INDEX idx_created_at (created_at)
      )
    `);
    tableReady = true;
  } catch (_) {}
}

async function createNotification(
  type: NotificationType,
  severity: Severity,
  message: string,
  data?: Record<string, any>
) {
  await query(
    'INSERT INTO notifications (type, severity, message, data) VALUES (?, ?, ?, ?)',
    [type, severity, message, JSON.stringify(data ?? {})]
  );
}

// Called periodically from /api/stats to detect conditions and create alerts.
// Deduplication: skips creating a new notification if a recent one of the same type/target exists.
export async function runNotificationChecks() {
  await ensureNotificationsTable();

  // 1. Users expiring within 3 days
  const expiring: any[] = await query(`
    SELECT id, username, expires_at FROM vpn_users
    WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)
  `);

  for (const user of expiring) {
    const recent: any[] = await query(
      `SELECT id FROM notifications
       WHERE type = 'user_expiring'
       AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.user_id')) = ?
       AND created_at > DATE_SUB(NOW(), INTERVAL 12 HOUR)
       LIMIT 1`,
      [String(user.id)]
    );
    if (recent.length > 0) continue;

    const expiresAt = new Date(user.expires_at);
    const daysLeft = Math.ceil(
      (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    await createNotification(
      'user_expiring',
      'warning',
      `کاربر "${user.username}" در ${daysLeft} روز دیگر منقضی می‌شود`,
      { user_id: user.id, username: user.username, expires_at: user.expires_at }
    );
  }

  // 2. Users at ≥80% traffic
  const highTraffic: any[] = await query(`
    SELECT id, username, traffic_total, traffic_limit_gb FROM vpn_users
    WHERE status = 'active'
    AND traffic_limit_gb IS NOT NULL AND traffic_limit_gb > 0
    AND traffic_total >= (traffic_limit_gb * 1073741824 * 0.8)
  `);

  for (const user of highTraffic) {
    const recent: any[] = await query(
      `SELECT id FROM notifications
       WHERE type = 'traffic_limit'
       AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.user_id')) = ?
       AND created_at > DATE_SUB(NOW(), INTERVAL 12 HOUR)
       LIMIT 1`,
      [String(user.id)]
    );
    if (recent.length > 0) continue;

    const pct = Math.round(
      (user.traffic_total / (user.traffic_limit_gb * 1073741824)) * 100
    );
    await createNotification(
      'traffic_limit',
      pct >= 95 ? 'critical' : 'warning',
      `کاربر "${user.username}" — ${pct}% از سهمیه ترافیک مصرف شده`,
      { user_id: user.id, username: user.username, percent: pct }
    );
  }

  // 3. Servers offline
  const offline: any[] = await query(
    `SELECT id, name FROM vpn_servers WHERE status = 'offline' AND is_active = TRUE`
  );

  for (const server of offline) {
    const recent: any[] = await query(
      `SELECT id FROM notifications
       WHERE type = 'server_offline'
       AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.server_id')) = ?
       AND created_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
       LIMIT 1`,
      [String(server.id)]
    );
    if (recent.length > 0) continue;

    await createNotification(
      'server_offline',
      'critical',
      `سرور "${server.name}" آفلاین است`,
      { server_id: server.id, server_name: server.name }
    );
  }
}
