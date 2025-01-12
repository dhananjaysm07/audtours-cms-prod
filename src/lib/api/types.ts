// src/lib/api/types.ts
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export interface AuthResponse extends ApiResponse {
  token?: string;
  user?: {
    id: string;
    email: string;
    // Add other user fields as needed
  };
}
