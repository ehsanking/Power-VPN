import mysql from 'mysql2/promise';

const poolConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Log warning if config is missing
if (!poolConfig.host || !poolConfig.user) {
  console.warn('Database environment variables ARE MISSING. API calls will fail.');
}

const pool = mysql.createPool(poolConfig);

export default pool;

// Simple in-memory mutex simulating GLOBAL_SYNC_LOCK
let isLocked = false;
const writeQueue: (() => void)[] = [];

async function acquireLock() {
    return new Promise<void>((resolve) => {
        if (!isLocked) {
            isLocked = true;
            resolve();
        } else {
            writeQueue.push(resolve);
        }
    });
}

function releaseLock() {
    if (writeQueue.length > 0) {
        const next = writeQueue.shift();
        next && next();
    } else {
        isLocked = false;
    }
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const isWrite = /^\s*(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE)/i.test(sql);
  if (isWrite) {
      await acquireLock();
  }
  
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T;
  } catch (err: any) {
    console.error('Database query error:', err.message);
    throw err;
  } finally {
    if (isWrite) releaseLock();
  }
}
