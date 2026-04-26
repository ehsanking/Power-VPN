import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

const ServerSchema = z.object({
  name: z.string().min(1).max(255),
  ip_address: z.string().min(1),
  domain: z.string().optional().nullable(),
  ports: z.array(z.number().int().min(1).max(65535)).default([1194]),
  protocol: z.enum(['udp', 'tcp']).default('udp'),
  supports_openvpn: z.boolean().default(true),
  supports_cisco: z.boolean().default(false),
  supports_l2tp: z.boolean().default(false),
  supports_wireguard: z.boolean().default(false),
  supports_xray: z.boolean().default(false),
});

export async function GET() {
    try {
        const servers = await query('SELECT * FROM vpn_servers ORDER BY id DESC');
        return NextResponse.json(servers);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validated = ServerSchema.parse(body);
        const { 
          name, ip_address, domain, ports, protocol,
          supports_openvpn, supports_cisco, supports_l2tp, supports_wireguard, supports_xray
        } = validated;
        
        const result: any = await query(
            `INSERT INTO vpn_servers 
            (name, ip_address, domain, ports, protocol, supports_openvpn, supports_cisco, supports_l2tp, supports_wireguard, supports_xray) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              name, ip_address, domain || null, JSON.stringify(ports), protocol,
              supports_openvpn ? 1 : 0, supports_cisco ? 1 : 0, supports_l2tp ? 1 : 0, supports_wireguard ? 1 : 0, supports_xray ? 1 : 0
            ]
        );
        
        return NextResponse.json({ id: result.insertId, success: true });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) throw new Error('ID required');

        await query('DELETE FROM vpn_servers WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error);
    }
}
