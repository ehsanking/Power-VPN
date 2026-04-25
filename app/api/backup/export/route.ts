import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const users: any[] = await query('SELECT * FROM vpn_users');
        const servers: any[] = await query('SELECT * FROM vpn_servers');
        const settings: any[] = await query('SELECT * FROM settings');
        const resellers: any[] = await query('SELECT * FROM reseller_limits');
        
        // Strip sensitive fields across the application for backups so they aren't portable off-system
        const safeUsers = users.map(u => {
            const safeU = { ...u };
            delete safeU.password_hash;
            delete safeU.cisco_password;
            delete safeU.l2tp_password;
            return safeU;
        });

        const safeSettings = settings.filter(s => s.key !== 'jwtSecret' && s.key !== 'caPrivateKey');

        const backup = {
            version: '2.0',
            exported_at: new Date().toISOString(),
            users: safeUsers,
            servers,
            settings: safeSettings,
            resellers
        };

        return new NextResponse(JSON.stringify(backup, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': 'attachment; filename="backup.json"'
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
