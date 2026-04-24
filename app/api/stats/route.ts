import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { runNotificationChecks } from '@/lib/notifications';

export async function GET() {
  try {
    const [userCount, activeSessions, serverCount, totalTraffic, avgLoad] =
      await Promise.all([
        query('SELECT COUNT(*) as count FROM vpn_users'),
        query('SELECT COUNT(*) as count FROM sessions WHERE status = "active"'),
        query('SELECT COUNT(*) as count FROM vpn_servers WHERE status = "online"'),
        query('SELECT SUM(traffic_total) as total FROM vpn_users'),
        query('SELECT AVG(load_score) as avg FROM vpn_servers WHERE is_active = TRUE'),
      ]);

    // Run notification checks asynchronously — don't block the response
    runNotificationChecks().catch((e) =>
      console.error('[notifications] check failed:', e)
    );

    return NextResponse.json({
      activeUsers: userCount[0]?.count || 0,
      activeSessions: activeSessions[0]?.count || 0,
      onlineServers: serverCount[0]?.count || 0,
      totalTraffic: totalTraffic[0]?.total || 0,
      systemLoad: Math.round(avgLoad[0]?.avg || 0),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
