import crypto from 'crypto';

export interface WgKeyPair {
  privateKey: string; // base64 Curve25519 private key
  publicKey:  string; // base64 Curve25519 public key
}

export interface WgConfigParams {
  clientPrivKey:   string;
  clientIp:        string; // e.g. "10.8.0.2"
  serverPubKey:    string;
  serverEndpoint:  string; // IP or domain of server
  wgPort:          number;
  dns?:            string;
}

export function generateWgKeyPair(): WgKeyPair {
  const { privateKey: privObj, publicKey: pubObj } = crypto.generateKeyPairSync('x25519');

  // X25519 PKCS8 DER: last 32 bytes = raw private key
  const privDer = privObj.export({ type: 'pkcs8', format: 'der' }) as Buffer;
  // X25519 SPKI DER:  last 32 bytes = raw public key
  const pubDer  = pubObj.export({ type: 'spki',  format: 'der' }) as Buffer;

  return {
    privateKey: privDer.slice(-32).toString('base64'),
    publicKey:  pubDer.slice(-32).toString('base64'),
  };
}

export function generateWgConfig(params: WgConfigParams): string {
  const dns = params.dns || '1.1.1.1';
  return [
    '[Interface]',
    `PrivateKey = ${params.clientPrivKey}`,
    `Address = ${params.clientIp}/24`,
    `DNS = ${dns}`,
    '',
    '[Peer]',
    `PublicKey = ${params.serverPubKey}`,
    'AllowedIPs = 0.0.0.0/0, ::/0',
    `Endpoint = ${params.serverEndpoint}:${params.wgPort}`,
    'PersistentKeepalive = 25',
    '',
  ].join('\n');
}

/**
 * Pick the next free /24 IP in 10.8.0.0/24.
 * Server is always 10.8.0.1; clients start from 10.8.0.2.
 */
export function assignWgIp(usedIps: string[]): string {
  const used = new Set(usedIps.filter(Boolean));
  for (let i = 2; i <= 254; i++) {
    const ip = `10.8.0.${i}`;
    if (!used.has(ip)) return ip;
  }
  throw new Error('WireGuard IP pool exhausted (max 253 peers)');
}
