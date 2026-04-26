import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ username: string }> }
  ) {
    try {
        const { username } = await params;
        const user = await queryOne('SELECT username, port, cisco_password, l2tp_password, wg_pubkey, xray_uuid FROM vpn_users WHERE username = ?', [username]);
        if (!user) throw new Error("User not found");

        const settingsRow = await queryOne('SELECT `key`, `value` FROM settings WHERE `key` = "publicIp"');
        const publicIp = settingsRow?.value || '127.0.0.1';

        // We'll generate a basic OpenVPN style config for now, showcasing dynamic details
        const configText = `client
dev tun
proto udp
remote ${publicIp} ${user.port || 1194}
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
auth-user-pass
cipher AES-256-GCM
# Username: ${user.username}
# Xray UUID: ${user.xray_uuid || 'N/A'}
# WireGuard PubKey: ${user.wg_pubkey || 'N/A'}
# Cisco: ${user.cisco_password || 'N/A'}
<ca>
-----BEGIN CERTIFICATE-----
MIIB_FAKE_CERTIFICATE_HERE
-----END CERTIFICATE-----
</ca>
`;
        const headers = new Headers();
        headers.set('Content-Type', 'application/x-openvpn-profile');
        headers.set('Content-Disposition', `attachment; filename="${username}.ovpn"`);

        return new NextResponse(configText, { headers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
