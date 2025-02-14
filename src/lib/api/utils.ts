// src/lib/api/utils.ts
import { useAuthStore } from '@/store/useAuthStore';
import { ApiError } from './errors';
import { config } from '@/config/config';

export const createApiUrl = (endpoint: string): string => {
  return `${config.API_URL}${endpoint}`;
};

export const getHeaders = (includeAuth = true): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

export async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.status === 'error') {
    if (response.status === 401) {
      useAuthStore.getState().logout();
    }
    throw new ApiError(
      data?.message || 'API request failed',
      response.status,
      data,
    );
  }

  return data;
}
