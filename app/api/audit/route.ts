import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get('vpn_session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure table exists
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
  } catch (_) {}

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
  const offset = parseInt(searchParams.get('offset') || '0');

  const whereClause = action ? 'WHERE action = ?' : '';
  const params: any[] = action ? [action, limit, offset] : [limit, offset];

  const rows = await query(
    `SELECT id, action, details, context, created_at
     FROM audit_logs ${whereClause}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    params
  );

  return NextResponse.json(rows);
}
