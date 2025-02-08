import { ApiClient } from './client';
import type { ApiResponse, AuthResponse, User } from '@/types';

export default class AuthApi extends ApiClient {
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      requireAuth: false,
    });
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.request('/users/profile', {
      method: 'GET',
      // body: {
      //   id,
      //   name,
      //   email,
      //   role,
      // },
    });
  }

  async logout(): Promise<ApiResponse<string>> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }
}
