import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { verifySync } from 'otplib';
import { query } from '@/lib/db';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { parseBody, adminLoginSchema } from '@/lib/validation';
import { auditLog } from '@/lib/audit';

const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';

const _rawPass = process.env.ADMIN_PASSWORD || 'password';
const _preHash = process.env.ADMIN_PASSWORD_HASH;

let adminPasswordHash: string;
if (_preHash) {
  adminPasswordHash = _preHash;
} else {
  adminPasswordHash = bcrypt.hashSync(_rawPass, 10);
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[Security] Set ADMIN_PASSWORD_HASH to a bcrypt hash instead of ADMIN_PASSWORD in .env'
    );
  }
}

async function getSetting(key: string): Promise<string | null> {
  try {
    const rows: any[] = await query(
      'SELECT `value` FROM settings WHERE `key` = ?',
      [key]
    );
    return rows[0]?.value ?? null;
  } catch (_) {
    return null;
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('vpn_session');

  if (session?.value === 'authenticated') {
    return NextResponse.json({
      user: { email: ADMIN_USER + '@local', displayName: 'Administrator' },
      isAdmin: true,
    });
  }

  return NextResponse.json({ user: null, isAdmin: false });
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`admin-login:${ip}`, 10, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl);

  try {
    const body = await req.json();
    const parsed = parseBody(adminLoginSchema, body);
    if (!parsed.success) return parsed.response;

    const { username, password, totpCode } = parsed.data as any;

    const usernameMatch = username === ADMIN_USER;
    const passwordMatch = await bcrypt.compare(password, adminPasswordHash);

    if (!usernameMatch || !passwordMatch) {
      await auditLog('auth.login_failed', `Failed login attempt for username: ${username}`, {
        ip,
      });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if 2FA is enabled
    const twoFactorEnabled = (await getSetting('twoFactorEnabled')) === 'true';

    if (twoFactorEnabled) {
      if (!totpCode) {
        // Password correct but 2FA required → ask for code without granting session
        return NextResponse.json({ requires2fa: true }, { status: 200 });
      }

      const secret = await getSetting('twoFactorSecret');
      if (!secret) {
        return NextResponse.json({ error: '2FA misconfigured' }, { status: 500 });
      }

      const result = verifySync({ token: String(totpCode), secret });
      const validTotp = typeof result === 'object' ? result.valid : !!result;
      if (!validTotp) {
        await auditLog('auth.login_failed', 'Correct password but invalid 2FA code', { ip });
        return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 });
      }
    }

    // Grant session
    const cookieStore = await cookies();
    cookieStore.set('vpn_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    });

    await auditLog('auth.login', `Admin "${username}" logged in`, { ip });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('vpn_session');
  await auditLog('auth.logout', 'Admin logged out');
  return NextResponse.json({ success: true });
}
