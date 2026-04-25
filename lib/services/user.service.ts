import { UserRepository } from '@/lib/repositories/user.repo';

export const UserService = {
  async getUser(id: number) {
    return await UserRepository.findById(id);
  },

  async listUsers(page: number, limit: number) {
    const offset = (page - 1) * limit;
    return await UserRepository.getAll(limit, offset);
  }
};
