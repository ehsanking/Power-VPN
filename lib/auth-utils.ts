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
        if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
             return process.env.JWT_SECRET;
        }
        // Force crashing if we can't get a secure token, rather than providing an insecure default
        throw new Error('Database is unreachable and no secure JWT_SECRET environment variable is defined. Refusing to use fallback secret.');
    }
}
