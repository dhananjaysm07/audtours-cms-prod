// src/lib/api/artist.ts
import { ApiClient } from "./client";
import type { ApiResponse, Artist } from "@/types";

export default class ArtistApi extends ApiClient {
  // Fetch all artists
  async getArtists(): Promise<ApiResponse<Artist[]>> {
    return this.request("/artist");
  }

  // Create a new artist
  async createArtist(name: string): Promise<ApiResponse<Artist>> {
    return this.request("/artist", {
      method: "POST",
      body: { name },
    });
  }

  // Toggle artist status (active/inactive)
  async toggleArtistStatus(id: number): Promise<ApiResponse<Artist>> {
    return this.request(`/artist/${id}/toggle-status`, {
      method: "PATCH",
    });
  }
}
