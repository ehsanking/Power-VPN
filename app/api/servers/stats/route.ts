import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Simulate data: update random servers with bandwidth/latency to make the dashboard look alive
    // Removed direct pool.query with string manipulation here for security. In a real-world scenario, 
    // a backend task / cron job will gather these stats and insert them via parameterized queries.
    
    // Fetch server info and join with active session counts
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
        s.disk_io,
        s.packet_loss,
        s.error_count,
        (SELECT COUNT(*) FROM sessions WHERE server_id = s.id AND status = 'active') as active_connections
      FROM vpn_servers s
      WHERE s.is_active = TRUE
      ORDER BY s.load_score ASC
    `);

    // Add some random variety for simulation if metrics are zeroes
    const enrichedServers = (servers as any[]).map(server => ({
      ...server,
      disk_io: server.disk_io || Math.floor(Math.random() * 500),
      packet_loss: server.packet_loss || (Math.random() * 0.5).toFixed(2),
      error_count: server.error_count || Math.floor(Math.random() * 5)
    }));

    return NextResponse.json(enrichedServers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
