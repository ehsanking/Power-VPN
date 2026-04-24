import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { generateSecret, generateSync, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { auditLog } from '@/lib/audit';

const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ISSUER = 'PowerVPN';

function buildOtpauthUrl(secret: string): string {
  const label = encodeURIComponent(`${ISSUER}:${ADMIN_USER}`);
  const issuer = encodeURIComponent(ISSUER);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

function checkCode(token: string, secret: string): boolean {
  try {
    const result = verifySync({ token, secret });
    return typeof result === 'object' ? result.valid : !!result;
  } catch (_) {
    return false;
  }
}

async function getSetting(key: string): Promise<string | null> {
  const rows: any[] = await query(
    'SELECT `value` FROM settings WHERE `key` = ?',
    [key]
  );
  return rows[0]?.value ?? null;
}

async function setSetting(key: string, value: string) {
  await query(
    'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
    [key, value, value]
  );
}

function requireAdmin(cookieStore: any) {
  return cookieStore.get('vpn_session')?.value === 'authenticated';
}

// GET: return status + setup QR if not yet enabled
export async function GET() {
  const cookieStore = await cookies();
  if (!requireAdmin(cookieStore)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const enabled = (await getSetting('twoFactorEnabled')) === 'true';
  if (enabled) {
    return NextResponse.json({ enabled: true });
  }

  const secret = generateSecret();
  await setSetting('twoFactorPendingSecret', secret);

  const otpauthUrl = buildOtpauthUrl(secret);
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  return NextResponse.json({ enabled: false, qrDataUrl, secret });
}

// POST: verify TOTP and enable 2FA
export async function POST(req: Request) {
  const cookieStore = await cookies();
  if (!requireAdmin(cookieStore)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'TOTP code required' }, { status: 400 });
  }

  const pendingSecret = await getSetting('twoFactorPendingSecret');
  if (!pendingSecret) {
    return NextResponse.json(
      { error: 'No pending 2FA setup. Call GET first.' },
      { status: 400 }
    );
  }

  if (!checkCode(code, pendingSecret)) {
    return NextResponse.json({ error: 'Invalid TOTP code' }, { status: 400 });
  }

  await setSetting('twoFactorSecret', pendingSecret);
  await setSetting('twoFactorEnabled', 'true');
  await query('DELETE FROM settings WHERE `key` = "twoFactorPendingSecret"');

  await auditLog('2fa.enabled', 'Admin enabled two-factor authentication');
  return NextResponse.json({ success: true });
}

// DELETE: disable 2FA after verifying current TOTP
export async function DELETE(req: Request) {
  const cookieStore = await cookies();
  if (!requireAdmin(cookieStore)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code) {
    return NextResponse.json(
      { error: 'TOTP code required to disable 2FA' },
      { status: 400 }
    );
  }

  const secret = await getSetting('twoFactorSecret');
  if (!secret) {
    return NextResponse.json({ error: '2FA is not enabled' }, { status: 400 });
  }

  if (!checkCode(String(code), secret)) {
    return NextResponse.json({ error: 'Invalid TOTP code' }, { status: 400 });
  }

  await query(
    'DELETE FROM settings WHERE `key` IN ("twoFactorSecret", "twoFactorEnabled", "twoFactorPendingSecret")'
  );

  await auditLog('2fa.disabled', 'Admin disabled two-factor authentication');
  return NextResponse.json({ success: true });
}
