import { ApiClient } from "./client";
import type { ApiResponse, Store } from "@/types";

export interface CreateStorePayload {
  bokunId: string;
  file: File;
  heading: string;
  description: string;
  nodeIds: number[];
}

export interface UpdateStorePayload {
  bokunId?: string;
  file?: File;
  heading?: string;
  description?: string;
}

interface ToggleActivationPayload {
  isActive: boolean;
}

export default class StoreApi extends ApiClient {
  async getStores(): Promise<ApiResponse<Store[]>> {
    return this.request("/store");
  }

  async getStore(id: number): Promise<ApiResponse<Store>> {
    return this.request(`/store/${id}`);
  }

  async createStore(data: CreateStorePayload): Promise<ApiResponse<Store>> {
    // Create FormData to handle file upload
    const formData = new FormData();
    formData.append("bokunId", data.bokunId);
    formData.append("file", data.file);
    formData.append("heading", data.heading);
    formData.append("description", data.description);
    formData.append("nodeIds", JSON.stringify(data.nodeIds));

    return this.request("/store", {
      method: "POST",
      body: formData,
    });
  }

  async updateStore(
    id: number,
    data: UpdateStorePayload
  ): Promise<ApiResponse<Store>> {
    // Create FormData to handle optional file upload
    const formData = new FormData();

    if (data.bokunId) formData.append("bokunId", data.bokunId);
    if (data.file) formData.append("file", data.file);
    if (data.heading) formData.append("heading", data.heading);
    if (data.description) formData.append("description", data.description);

    return this.request(`/store/${id}`, {
      method: "PATCH",
      body: formData,
    });
  }

  async toggleStoreActivation(
    id: number,
    data: ToggleActivationPayload
  ): Promise<ApiResponse<Store>> {
    return this.request(`/store/${id}/activation`, {
      method: "PATCH",
      body: data,
    });
  }
}
