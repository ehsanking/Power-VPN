import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const token = request.headers.get('x-migration-token');
  if (!token || !process.env.MIGRATION_TOKEN || token !== process.env.MIGRATION_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const migrations = [
    `ALTER TABLE logs
     ADD COLUMN IF NOT EXISTS user_id INT,
     ADD COLUMN IF NOT EXISTS action VARCHAR(255),
     ADD COLUMN IF NOT EXISTS details TEXT,
     ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
     ADD COLUMN IF NOT EXISTS user_agent TEXT;`,

    `ALTER TABLE vpn_users
     ADD COLUMN IF NOT EXISTS traffic_up BIGINT DEFAULT 0,
     ADD COLUMN IF NOT EXISTS traffic_down BIGINT DEFAULT 0;`,

    `ALTER TABLE vpn_servers
     ADD COLUMN IF NOT EXISTS connected_clients INT DEFAULT 0,
     ADD COLUMN IF NOT EXISTS last_check TIMESTAMP NULL;`,

    `ALTER TABLE settings
     ADD COLUMN IF NOT EXISTS value_type ENUM('string','number','boolean','json') DEFAULT 'string',
     ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT FALSE;`,

    `ALTER TABLE vpn_users ADD INDEX IF NOT EXISTS idx_parent_id (parent_id);`,

    `ALTER TABLE vpn_users
     ADD COLUMN IF NOT EXISTS wg_privkey VARCHAR(255) NULL AFTER wg_pubkey;`,

    // Seed WireGuard settings from environment (set by install.sh)
    ...(process.env.WG_SERVER_PUBKEY ? [
      `INSERT INTO settings (\`key\`, \`value\`) VALUES ('wgServerPubKey', '${process.env.WG_SERVER_PUBKEY}')
       ON DUPLICATE KEY UPDATE \`value\` = IF(\`value\` = '' OR \`value\` IS NULL, '${process.env.WG_SERVER_PUBKEY}', \`value\`);`,
    ] : []),
    ...(process.env.WG_PORT ? [
      `INSERT INTO settings (\`key\`, \`value\`) VALUES ('wgPort', '${process.env.WG_PORT}')
       ON DUPLICATE KEY UPDATE \`value\` = IF(\`value\` = '' OR \`value\` IS NULL, '${process.env.WG_PORT}', \`value\`);`,
    ] : []),
  ];

  const results: string[] = [];
  for (const sql of migrations) {
    try {
      await pool.execute(sql);
      results.push('ok');
    } catch (err: any) {
      results.push(`warn: ${err.message}`);
    }
  }

  return NextResponse.json({ message: 'Migrations completed', results });
}
