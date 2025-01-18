// src/lib/api/client.ts
import { ApiError } from "./errors";
import { createApiUrl, getHeaders, handleResponse } from "./utils";

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown | FormData;
  requireAuth?: boolean;
}

export class ApiClient {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", headers = {}, body, requireAuth = true } = options;

    try {
      const isFormData = body instanceof FormData;
      // Base headers including auth if required
      const baseHeaders = getHeaders(requireAuth);

      // For FormData, don't include Content-Type (browser will set it)
      // For JSON, keep the application/json Content-Type
      const requestHeaders = {
        ...(!isFormData
          ? baseHeaders
          : { Authorization: baseHeaders.Authorization }),
        ...headers,
      };

      const response = await fetch(createApiUrl(endpoint), {
        method,
        headers: requestHeaders,
        body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      });

      return handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : "Request failed"
      );
    }
  }
}
