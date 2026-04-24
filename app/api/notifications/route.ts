import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { ensureNotificationsTable } from '@/lib/notifications';

function requireAdmin(cookieStore: any) {
  return cookieStore.get('vpn_session')?.value === 'authenticated';
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  if (!requireAdmin(cookieStore)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureNotificationsTable();

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get('unread') === 'true';

  const whereClause = unreadOnly ? 'WHERE is_read = FALSE' : '';
  const rows = await query(
    `SELECT id, type, severity, message, data, is_read, created_at
     FROM notifications ${whereClause}
     ORDER BY created_at DESC
     LIMIT 50`
  );

  return NextResponse.json(rows);
}

export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  if (!requireAdmin(cookieStore)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();

  if (id === 'all') {
    await query('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE');
  } else if (typeof id === 'number' && id > 0) {
    await query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
  } else {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
