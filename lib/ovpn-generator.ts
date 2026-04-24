export async function generateOvpnProfile(username: string, servers: any[] = []): Promise<string> {
  // Config defaults
  const defaults = {
    cipher: 'AES-256-GCM',
    auth: 'SHA256',
    protocol: 'udp'
  };

  const remoteLines = servers.length > 0 
    ? servers.map(s => {
        const ports = Array.isArray(s.ports) ? s.ports : JSON.parse(s.ports || '[1194]');
        return ports.map((p: number) => `remote ${s.ip_address} ${p}`).join('\n');
      }).join('\n')
    : `remote 45.12.99.1 1194`;

  // Placeholder certs - In production, these should be fetched from the secure Cert Service
  const ca = `-----BEGIN CERTIFICATE-----\nCA_CERT_HERE\n-----END CERTIFICATE-----`;
  const cert = `-----BEGIN CERTIFICATE-----\nCLIENT_CERT_FOR_${username.toUpperCase()}\n-----END CERTIFICATE-----`;
  const key = `-----BEGIN PRIVATE KEY-----\nCLIENT_KEY_FOR_${username.toUpperCase()}\n-----END PRIVATE KEY-----`;
  const tlsAuth = `-----BEGIN OpenVPN Static key V1-----\nTLS_AUTH_KEY\n-----END OpenVPN Static key V1-----`;

  return `client
dev tun
proto ${defaults.protocol}
${remoteLines}
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
auth ${defaults.auth}
cipher ${defaults.cipher}
key-direction 1
verb 3
connect-retry 1
connect-timeout 5

<ca>
${ca}
</ca>
<cert>
${cert}
</cert>
<key>
${key}
</key>
<tls-auth>
${tlsAuth}
</tls-auth>`;
}

export function downloadFile(filename: string, content: string) {
  const element = document.createElement('a');
  const file = new Blob([content], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
