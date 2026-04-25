import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'vpn_panel',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function validateConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

// Ensure connection is validated on startup
if (process.env.NODE_ENV !== 'test') {
  validateConnection();
}

export default pool;
