import { query as defaultQuery } from '@/lib/db';
import { headers } from 'next/headers';

export async function auditLog(
    action: string, 
    actor: string, 
    target: string, 
    metadata: any,
    dbQuery = defaultQuery
) {
    let ip = 'unknown';
    let userAgent = 'unknown';

    try {
        const h = await headers();
        ip = h.get('x-forwarded-for') || 'unknown';
        userAgent = h.get('user-agent') || 'unknown';
    } catch (e) {
        // Headers might not be available in some contexts (e.g. background tasks)
    }

    try {
        await dbQuery(
            'INSERT INTO logs (action, actor, target, metadata, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [action, actor, target, JSON.stringify(metadata), ip, userAgent]
        );
    } catch (e) {
        console.error('Failed to write audit log:', e);
    }
}
