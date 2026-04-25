import { TextEncoder } from 'util';

export async function getJwtSecret(): Promise<Uint8Array> {
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
         return new TextEncoder().encode(process.env.JWT_SECRET);
    }
    throw new Error("A 32+ char JWT_SECRET must be provided in the environment variables.");
}
