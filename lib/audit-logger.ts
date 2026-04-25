import { headers } from 'next/headers';
import { query } from './db';

export async function auditLog(
  action: string,
  actor: string,
  target: string,
  context: Record<string, any> = {}
) {
  let ipAddress = 'unknown';
  let userAgent = 'unknown';

  try {
    const head = await headers();
    ipAddress = head.get('x-forwarded-for') || head.get('x-real-ip') || 'unknown';
    userAgent = head.get('user-agent') || 'unknown';
  } catch {
    // Headers not available in background tasks
  }

  try {
    await query(
      'INSERT INTO logs (level, message, context, created_at) VALUES (?, ?, ?, NOW())',
      [
        'info',
        `[${action}] actor=${actor} target=${target}`,
        JSON.stringify({ action, actor, target, ipAddress, userAgent, ...context }),
      ]
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
