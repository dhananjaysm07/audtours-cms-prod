// src/lib/api/client.ts
import { ApiError } from './errors';
import { createApiUrl, getHeaders, handleResponse } from './utils';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  requireAuth?: boolean;
}

export class ApiClient {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', headers = {}, body, requireAuth = true } = options;

    try {
      const response = await fetch(createApiUrl(endpoint), {
        method,
        headers: {
          ...getHeaders(requireAuth),
          ...headers,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      return handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Request failed'
      );
    }
  }
}
