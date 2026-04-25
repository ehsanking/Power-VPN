import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { execSync } from 'child_process';
import { query } from '@/lib/db';
import { generateWgKeyPair, generateWgConfig, assignWgIp } from '@/lib/wg-generator';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('client_token');
    if (!tokenCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });

    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jose.jwtVerify(tokenCookie.value, secret);
    const username = payload.username as string;

    // ── Fetch user ───────────────────────────────────────────────────────────
    const users = await query(
      'SELECT * FROM vpn_users WHERE username = ? AND status = "active"',
      [username]
    );
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
    }
    const user = users[0];

    // ── Generate or reuse WireGuard keys ─────────────────────────────────────
    let wgPrivKey: string = user.wg_privkey;
    let wgPubKey:  string = user.wg_pubkey;
    let wgIp:      string = user.wg_ip;

    if (!wgPrivKey || !wgPubKey) {
      const pair = generateWgKeyPair();
      wgPrivKey = pair.privateKey;
      wgPubKey  = pair.publicKey;

      // Assign IP if not yet set
      if (!wgIp) {
        const usedRows = await query('SELECT wg_ip FROM vpn_users WHERE wg_ip IS NOT NULL');
        wgIp = assignWgIp(usedRows.map((r: any) => r.wg_ip));
      }

      await query(
        'UPDATE vpn_users SET wg_privkey = ?, wg_pubkey = ?, wg_ip = ? WHERE id = ?',
        [wgPrivKey, wgPubKey, wgIp, user.id]
      );
    } else if (!wgIp) {
      const usedRows = await query('SELECT wg_ip FROM vpn_users WHERE wg_ip IS NOT NULL');
      wgIp = assignWgIp(usedRows.map((r: any) => r.wg_ip));
      await query('UPDATE vpn_users SET wg_ip = ? WHERE id = ?', [wgIp, user.id]);
    }

    // ── Fetch server WireGuard settings ──────────────────────────────────────
    const settingRows = await query(
      'SELECT `key`, `value` FROM settings WHERE `key` IN ("wgServerPubKey","wgPort","defaultDns")'
    );
    const settings: Record<string, string> = {};
    for (const row of settingRows) settings[row.key] = row.value;

    // Prefer DB value; fall back to env var set by install.sh
    const serverPubKey = settings['wgServerPubKey'] || process.env.WG_SERVER_PUBKEY || '';
    if (!serverPubKey) {
      return NextResponse.json(
        { error: 'WireGuard server public key not configured.' },
        { status: 503 }
      );
    }

    const wgIface = process.env.WG_IFACE || 'wg0';

    // Pick first active WireGuard-capable server; fall back to current host
    const servers = await query(
      'SELECT ip_address FROM vpn_servers WHERE supports_wireguard = TRUE AND status = "online" AND is_active = TRUE LIMIT 1'
    );
    const serverEndpoint = servers[0]?.ip_address || '127.0.0.1';

    const wgPort = parseInt(settings['wgPort'] || process.env.WG_PORT || '51820', 10);
    const dns    = settings['defaultDns'] || '1.1.1.1';

    // ── Register peer on the live WireGuard interface ────────────────────────
    try {
      execSync(`sudo wg set ${wgIface} peer ${wgPubKey} allowed-ips ${wgIp}/32`, {
        timeout: 5000,
        stdio: 'pipe',
      });
    } catch {
      // Non-fatal: peer may already exist or sudo not available in dev
    }

    // ── Generate .conf ────────────────────────────────────────────────────────
    const conf = generateWgConfig({
      clientPrivKey:  wgPrivKey,
      clientIp:       wgIp,
      serverPubKey,
      serverEndpoint,
      wgPort,
      dns,
    });

    return new Response(conf, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${username}-wg.conf"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
