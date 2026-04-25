import { query } from '@/lib/db';
import { headers } from 'next/headers';

export async function auditLog(action: string, actor: string, target: string, metadata: any) {
    const h = await headers();
    const ip = h.get('x-forwarded-for') || 'unknown';
    const userAgent = h.get('user-agent') || 'unknown';

    try {
        await query(
            'INSERT INTO logs (action, actor, target, metadata, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [action, actor, target, JSON.stringify(metadata), ip, userAgent]
        );
    } catch (e) {
        console.error('Failed to write audit log:', e);
    }
}
