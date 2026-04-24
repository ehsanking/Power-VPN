import { NextResponse } from 'next/server';
import pool, { query } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const backup = await req.json();
        
        if (!backup.version || !backup.users) {
            return NextResponse.json({ error: 'Invalid backup format' }, { status: 400 });
        }

        // To do a real import safely, we should use transactions.
        // We'll trust the payload for now.
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            if (backup.settings && backup.settings.length > 0) {
                // Clear and insert
                await connection.query('DELETE FROM settings');
                for (const row of backup.settings) {
                    await connection.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', [row.key, row.value]);
                }
            }

            if (backup.users && backup.users.length > 0) {
                // For simplicity, we skip existing users or we could clear all, but clearing breaks active sessions.
                // In a true migration, you'd insert ignore.
                for (const user of backup.users) {
                    // Just insert ignore
                    await connection.query(`
                        INSERT IGNORE INTO vpn_users 
                        (id, username, password_hash, role, parent_id, status, traffic_limit_gb, max_connections, cisco_password, l2tp_password, wg_pubkey, wg_ip) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        user.id, user.username, user.password_hash, user.role, user.parent_id, 
                        user.status, user.traffic_limit_gb, user.max_connections, 
                        user.cisco_password, user.l2tp_password, user.wg_pubkey, user.wg_ip
                    ]);
                }
            }

            // Similarly for resellers and servers...
            
            await connection.commit();
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
