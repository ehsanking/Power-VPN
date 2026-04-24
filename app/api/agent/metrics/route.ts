import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';

const metricsSchema = z.object({
  server_id: z.number().int().positive(),
  cpu_percent: z.number().min(0).max(100),
  bandwidth_ingress_mbps: z.number().min(0),
  bandwidth_egress_mbps: z.number().min(0),
  active_connections: z.number().int().min(0),
  latency_ms: z.number().int().min(0).optional(),
  status: z.enum(['online', 'offline']).optional(),
});

export async function POST(req: Request) {
  // Authenticate via Bearer token (agent key)
  const authHeader = req.headers.get('Authorization') || '';
  const agentKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!agentKey) {
    return NextResponse.json({ error: 'Missing agent key' }, { status: 401 });
  }

  try {
    // Lazy-add agent_key column if not yet created
    try {
      await query('ALTER TABLE vpn_servers ADD COLUMN agent_key VARCHAR(64) NULL');
    } catch (_) {}

    const body = await req.json();
    const parsed = metricsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e: any) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify agent key matches the server_id
    const servers: any[] = await query(
      'SELECT id FROM vpn_servers WHERE id = ? AND agent_key = ?',
      [data.server_id, agentKey]
    );
    if (!servers.length) {
      return NextResponse.json({ error: 'Invalid agent key or server_id' }, { status: 403 });
    }

    // Update server metrics with real data
    await query(
      `UPDATE vpn_servers SET
        bandwidth_ingress = ?,
        bandwidth_egress = ?,
        latency_ms = ?,
        load_score = ?,
        status = ?
       WHERE id = ?`,
      [
        Math.round(data.bandwidth_ingress_mbps),
        Math.round(data.bandwidth_egress_mbps),
        data.latency_ms ?? 0,
        Math.round(data.cpu_percent),   // cpu_percent used as load_score (0-100)
        data.status ?? 'online',
        data.server_id,
      ]
    );

    // Record history entry (10% chance to avoid DB bloat, or always record — here: always)
    await query(
      'INSERT INTO server_status_history (server_id, status, load_score) VALUES (?, ?, ?)',
      [data.server_id, data.status ?? 'online', Math.round(data.cpu_percent)]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
