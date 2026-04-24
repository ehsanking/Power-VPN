import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Return real metrics collected by node agents.
    // load_score is updated by agents via POST /api/agent/metrics.
    // If no agent is running, metrics stay at their last known values.
    const servers = await query(`
      SELECT
        s.id,
        s.name,
        s.ip_address,
        s.load_score,
        s.status,
        s.bandwidth_ingress,
        s.bandwidth_egress,
        s.latency_ms,
        (SELECT COUNT(*) FROM sessions WHERE server_id = s.id AND status = 'active') as active_connections
      FROM vpn_servers s
      WHERE s.is_active = TRUE
      ORDER BY s.load_score ASC
    `);

    // Occasionally snapshot to history (10% chance to limit write volume)
    if (Math.random() < 0.1) {
      await query(`
        INSERT INTO server_status_history (server_id, status, load_score)
        SELECT id, status, load_score FROM vpn_servers WHERE is_active = TRUE
      `);
    }

    return NextResponse.json(servers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
