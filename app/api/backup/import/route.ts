import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BackupSchema = z.object({
    version: z.string(),
    users: z.array(z.any()).optional(),
    servers: z.array(z.any()).optional(),
    settings: z.array(z.any()).optional(),
    resellers: z.array(z.any()).optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validated = BackupSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: 'Invalid backup format', details: validated.error.format() },
                { status: 400 }
            );
        }

        const backup = validated.data;
        const connection = await pool.getConnection();

        try {
            await connection.execute('START TRANSACTION');

            for (const row of backup.settings ?? []) {
                await connection.execute(
                    'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
                    [row.key, row.value]
                );
            }

            for (const user of backup.users ?? []) {
                await connection.execute(
                    `INSERT INTO vpn_users
                        (id, username, role, parent_id, status,
                         traffic_limit_gb, traffic_total, traffic_up, traffic_down,
                         max_connections, port, main_protocol,
                         expires_at, created_at, last_connected)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                        username = VALUES(username), role = VALUES(role),
                        parent_id = VALUES(parent_id), status = VALUES(status),
                        traffic_limit_gb = VALUES(traffic_limit_gb),
                        traffic_total = VALUES(traffic_total),
                        traffic_up = VALUES(traffic_up),
                        traffic_down = VALUES(traffic_down),
                        max_connections = VALUES(max_connections),
                        port = VALUES(port), main_protocol = VALUES(main_protocol),
                        expires_at = VALUES(expires_at)`,
                    [
                        user.id, user.username, user.role, user.parent_id ?? null,
                        user.status, user.traffic_limit_gb, user.traffic_total,
                        user.traffic_up ?? 0, user.traffic_down ?? 0,
                        user.max_connections, user.port ?? null,
                        user.main_protocol ?? null, user.expires_at ?? null,
                        user.created_at, user.last_connected ?? null,
                    ]
                );
            }

            for (const server of backup.servers ?? []) {
                await connection.execute(
                    `INSERT INTO vpn_servers
                        (id, name, ip_address, domain, protocol, status, is_active,
                         load_score, connected_clients, bandwidth_ingress, bandwidth_egress,
                         latency_ms, last_check, ports,
                         supports_openvpn, supports_cisco, supports_l2tp,
                         supports_wireguard, supports_xray)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                        name = VALUES(name), ip_address = VALUES(ip_address),
                        domain = VALUES(domain), protocol = VALUES(protocol),
                        status = VALUES(status), is_active = VALUES(is_active),
                        load_score = VALUES(load_score),
                        connected_clients = VALUES(connected_clients),
                        bandwidth_ingress = VALUES(bandwidth_ingress),
                        bandwidth_egress = VALUES(bandwidth_egress),
                        latency_ms = VALUES(latency_ms), last_check = VALUES(last_check),
                        ports = VALUES(ports),
                        supports_openvpn = VALUES(supports_openvpn),
                        supports_cisco = VALUES(supports_cisco),
                        supports_l2tp = VALUES(supports_l2tp),
                        supports_wireguard = VALUES(supports_wireguard),
                        supports_xray = VALUES(supports_xray)`,
                    [
                        server.id, server.name, server.ip_address, server.domain ?? null,
                        server.protocol, server.status, server.is_active,
                        server.load_score, server.connected_clients ?? 0,
                        server.bandwidth_ingress, server.bandwidth_egress,
                        server.latency_ms, server.last_check ?? null,
                        JSON.stringify(server.ports ?? []),
                        server.supports_openvpn, server.supports_cisco,
                        server.supports_l2tp, server.supports_wireguard,
                        server.supports_xray,
                    ]
                );
            }

            for (const res of backup.resellers ?? []) {
                await connection.execute(
                    `INSERT INTO reseller_limits (id, reseller_id, max_users, allocated_traffic_gb)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                        max_users = VALUES(max_users),
                        allocated_traffic_gb = VALUES(allocated_traffic_gb)`,
                    [res.id, res.reseller_id, res.max_users, res.allocated_traffic_gb]
                );
            }

            await connection.execute('COMMIT');
        } catch (err) {
            await connection.execute('ROLLBACK');
            throw err;
        } finally {
            connection.release();
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
