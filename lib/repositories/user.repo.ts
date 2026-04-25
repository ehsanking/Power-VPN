import { query } from '@/lib/db';
import logger from '@/lib/logger';

export interface User {
  id: number;
  username: string;
  role: string;
  status: string;
  traffic_limit_gb: number;
  expires_at: string | null;
}

export const UserRepository = {
  async findById(id: number): Promise<User | null> {
    try {
      const users = await query('SELECT * FROM vpn_users WHERE id = ? LIMIT 1', [id]) as User[];
      return users.length > 0 ? users[0] : null;
    } catch (err) {
      logger.error({ err }, 'Error finding user by ID');
      throw err;
    }
  },

  async getAll(limit: number, offset: number): Promise<{ users: User[], total: number }> {
     try {
       // Parallel queries for total count and paginated data
       const [users, countResult] = await Promise.all([
         query('SELECT * FROM vpn_users ORDER BY id DESC LIMIT ? OFFSET ?', [limit, offset]) as Promise<User[]>,
         query('SELECT COUNT(*) as total FROM vpn_users') as Promise<{ total: number }[]>
       ]);
       return { users, total: countResult[0].total, limit, offset };
     } catch (err) {
       logger.error({ err }, 'Error getting all users');
       throw err;
     }
  }
};
