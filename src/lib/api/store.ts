import { ApiClient } from './client';
import type { ApiResponse, Store } from '@/types';

export interface CreateStorePayload {
  bokunId: string;
  file: File;
  heading: string;
  description: string;
  country: string;
  continent: string;
  tag?: string; // New field
  nodeIds: number[];
}

export interface UpdateStorePayload {
  bokunId?: string;
  file?: File;
  heading?: string;
  description?: string;
  country?: string;
  continent?: string;
  tag?: string; // New field
}

interface ToggleActivationPayload {
  isActive: boolean;
}

export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
}

export default class StoreApi extends ApiClient {
  async getStores(): Promise<ApiResponse<Store[]>> {
    return this.request('/store');
  }

  async getStore(id: number): Promise<ApiResponse<Store>> {
    return this.request(`/store/${id}`);
  }

  async searchStores(
    params: SearchParams = {},
  ): Promise<ApiResponse<{ stores: Store[]; total: number }>> {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('query', params.query);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    return this.request(`/store/search?${queryParams.toString()}`);
  }

  async createStore(data: CreateStorePayload): Promise<ApiResponse<Store>> {
    // Create FormData to handle file upload
    const formData = new FormData();
    formData.append('bokunId', data.bokunId);
    formData.append('file', data.file);
    formData.append('heading', data.heading);
    formData.append('description', data.description);
    formData.append('country', data.country);
    formData.append('continent', data.continent);
    if (data.tag) formData.append('tag', data.tag); // Add tag if it exists
    formData.append('nodeIds', JSON.stringify(data.nodeIds));

    return this.request('/store', {
      method: 'POST',
      body: formData,
    });
  }

  async updateStore(
    id: number,
    data: UpdateStorePayload,
  ): Promise<ApiResponse<Store>> {
    // Create FormData to handle optional file upload
    const formData = new FormData();

    if (data.bokunId) formData.append('bokunId', data.bokunId);
    if (data.file) formData.append('file', data.file);
    if (data.heading) formData.append('heading', data.heading);
    if (data.description) formData.append('description', data.description);
    if (data.country) formData.append('country', data.country);
    if (data.continent) formData.append('continent', data.continent);
    if (data.tag !== undefined) formData.append('tag', data.tag); // Handle empty string case too

    return this.request(`/store/${id}`, {
      method: 'PATCH',
      body: formData,
    });
  }

  async toggleStoreActivation(
    id: number,
    data: ToggleActivationPayload,
  ): Promise<ApiResponse<Store>> {
    return this.request(`/store/${id}/activation`, {
      method: 'PATCH',
      body: data,
    });
  }
}
