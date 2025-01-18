import { ApiClient } from './client';
import type { ApiResponse, AuthResponse } from '@/types';

export default class AuthApi extends ApiClient {
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      requireAuth: false,
    });
  }

  async logout(): Promise<ApiResponse<string>> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }
}
