// src/lib/api/subscriptions.ts
import {
  ApiResponse,
  CodeResponse,
  CreateCodeData,
  GetCodesResponse,
} from '@/types';
import { ApiClient } from './client';

export default class SubscriptionApi extends ApiClient {
  async createCode(data: CreateCodeData): Promise<ApiResponse<CodeResponse>> {
    return this.request('/subscriptions/codes', {
      method: 'POST',
      body: data,
    });
  }

  async getCodes(page = 1, limit = 10): Promise<ApiResponse<GetCodesResponse>> {
    return this.request(`/subscriptions/codes?page=${page}&limit=${limit}`);
  }

  async searchCodes(query: string): Promise<ApiResponse<CodeResponse[]>> {
    return this.request(
      `/subscriptions/codes/search?query=${encodeURIComponent(query)}`
    );
  }

  async deactivateCode(codeId: number): Promise<ApiResponse<void>> {
    return this.request(`/subscriptions/codes/${codeId}/expire`, {
      method: 'POST',
    });
  }

  // Additional utility methods could be added here
  async isCodeValid(code: string): Promise<ApiResponse<{ valid: boolean }>> {
    return this.request(`/subscriptions/codes/${code}/validate`);
  }

  async getCodeDetails(codeId: number): Promise<ApiResponse<CodeResponse>> {
    return this.request(`/subscriptions/codes/${codeId}`);
  }
}
