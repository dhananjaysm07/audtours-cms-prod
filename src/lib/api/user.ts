import { ApiClient } from './client';
import type { ApiResponse, CodeResponse, User } from '@/types';

class UserApi extends ApiClient {
  async getUsers(page = 1, limit = 10): Promise<ApiResponse<User[]>> {
    return this.request(`/users?page=${page}&limit=${limit}`);
  }

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    return this.request(`/users/search?query=${encodeURIComponent(query)}`);
  }

  async getUserCodes(userId: number): Promise<ApiResponse<CodeResponse[]>> {
    return this.request(`/users/${userId}/codes`);
  }
}

export const userApi = new UserApi();
