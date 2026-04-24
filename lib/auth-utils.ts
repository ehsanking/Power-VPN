import { query } from '@/lib/db';
import crypto from 'crypto';

export async function getJwtSecret(): Promise<string> {
    try {
        const result: any[] = await query('SELECT `value` FROM settings WHERE `key` = "jwtSecret"');
        if (result && result.length > 0 && result[0].value) {
            return result[0].value;
        }

        // Generate and save
        const newSecret = crypto.randomBytes(64).toString('hex');
        await query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value`=?', ['jwtSecret', newSecret, newSecret]);
        return newSecret;
    } catch (e) {
        return process.env.JWT_SECRET || 'fallback-secret-for-dev';
    }
}
