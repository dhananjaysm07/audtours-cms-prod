// src/lib/authApi.ts
import { config } from '@/config/config';
import type { AuthResponse } from '@/types';

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: AuthResponse
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${config.API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok || data.status === 'error') {
        throw new ApiError(
          data.message || 'Invalid credentials',
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Login failed'
      );
    }
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('auth_token');

    if (token) {
      try {
        const response = await fetch(`${config.API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new ApiError(
            data.message || 'Logout failed',
            response.status,
            data
          );
        }
      } finally {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
  },
};
