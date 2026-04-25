import crypto from 'crypto';

// Use ENCRYPTION_KEY from environment, or generate a random one if it's somehow missing in runtime
// In production, ENCRYPTION_KEY should always be provided and securely stored.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(12);
    // ensure key is 32 bytes (256 bits)
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substring(0, 32);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    // format: iv:authTag:encryptedText
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(text: string): string | null {
    try {
        const parts = text.split(':');
        if (parts.length !== 3) return null;
        
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encryptedText = parts[2];
        
        const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substring(0, 32);
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error);
        return null; // Return null if decryption fails (e.g. wrong key, corrupted data)
    }
}
