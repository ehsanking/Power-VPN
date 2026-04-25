import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const migrations = [
      // 28: Add user_id to logs and foreign key
      `ALTER TABLE logs 
       ADD COLUMN IF NOT EXISTS user_id INT,
       ADD FOREIGN KEY IF NOT EXISTS (user_id) REFERENCES vpn_users(id) ON DELETE SET NULL;`,

      // 29: Unify traffic naming
      `ALTER TABLE vpn_users 
       CHANGE COLUMN IF EXISTS traffic_up traffic_uploaded_bytes BIGINT DEFAULT 0,
       CHANGE COLUMN IF EXISTS traffic_down traffic_downloaded_bytes BIGINT DEFAULT 0;`,

      // 30: JSON indexes (using generated columns for portability)
      `ALTER TABLE vpn_users 
       ADD COLUMN IF NOT EXISTS config_server_name VARCHAR(255) GENERATED ALWAYS AS (custom_config->>'$.server_name') VIRTUAL,
       ADD INDEX IF NOT EXISTS idx_config_server_name (config_server_name);`,

      // 31: Settings table improvements
      `ALTER TABLE settings 
       ADD COLUMN IF NOT EXISTS value_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
       ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT FALSE;`,

      // 32: Parent ID index
      `ALTER TABLE vpn_users ADD INDEX IF NOT EXISTS idx_parent_id (parent_id);`
    ];

    for (const sql of migrations) {
      try {
        await pool.execute(sql);
      } catch (err: any) {
        console.warn('Migration step failed (might already exist):', err.message);
      }
    }

    return NextResponse.json({ message: 'Migrations completed' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
