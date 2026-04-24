import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { auditLog } from '@/lib/audit';

// Only callable by an authenticated admin session
export async function POST(req: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get('vpn_session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Lazy-add agent_key column to vpn_servers
    try {
      await query('ALTER TABLE vpn_servers ADD COLUMN agent_key VARCHAR(64) NULL');
    } catch (_) {}

    const { server_id } = await req.json();
    if (!server_id || isNaN(Number(server_id))) {
      return NextResponse.json({ error: 'Valid server_id required' }, { status: 400 });
    }

    const servers: any[] = await query(
      'SELECT id, name FROM vpn_servers WHERE id = ?',
      [Number(server_id)]
    );
    if (!servers.length) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    const agentKey = crypto.randomBytes(32).toString('hex');
    await query('UPDATE vpn_servers SET agent_key = ? WHERE id = ?', [
      agentKey,
      Number(server_id),
    ]);

    await auditLog('agent.registered', `Agent key issued for server "${servers[0].name}"`, {
      server_id: Number(server_id),
      server_name: servers[0].name,
    });

    return NextResponse.json({ agent_key: agentKey });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
