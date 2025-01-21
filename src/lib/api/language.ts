// src/lib/api/language.ts
import { ApiClient } from "./client";
import type { ApiResponse, Language } from "@/types";

export default class LanguageApi extends ApiClient {
  async getLanguages(): Promise<ApiResponse<Language[]>> {
    return this.request("/language");
  }

  async createLanguage(name: string): Promise<ApiResponse<Language>> {
    return this.request("/language", {
      method: "POST",
      body: { name },
    });
  }

  async toggleLanguageStatus(id: number): Promise<ApiResponse<Language>> {
    return this.request(`/language/${id}/toggle-status`, {
      method: "PATCH",
    });
  }
}
