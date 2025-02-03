// src/store/useArtistStore.ts
import { create } from "zustand";
import { artistApi } from "@/lib/api"; // Replace with your API client for artists

interface Artist {
  id: number;
  name: string;
  isActive: boolean;
}

interface ArtistState {
  artists: Artist[];
  isLoading: boolean;
  error: string | null;
  fetchArtists: () => Promise<void>;
  createArtist: (name: string) => Promise<void>;
  toggleArtistStatus: (id: number) => Promise<void>;
}

export const useArtistStore = create<ArtistState>((set, get) => ({
  artists: [],
  isLoading: false,
  error: null,

  // Fetch all artists
  fetchArtists: async () => {
    set({ isLoading: true });
    try {
      const response = await artistApi.getArtists();
      set({ artists: response.data, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch artists",
        isLoading: false,
      });
    }
  },

  // Create a new artist
  createArtist: async (name: string) => {
    set({ isLoading: true });
    try {
      await artistApi.createArtist(name);
      await get().fetchArtists(); // Refresh the list after creation
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to create artist",
        isLoading: false,
      });
    }
  },

  // Toggle artist status (active/inactive)
  toggleArtistStatus: async (id: number) => {
    try {
      await artistApi.toggleArtistStatus(id);
      await get().fetchArtists(); // Refresh the list after toggling status
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to toggle artist status",
      });
    }
  },
}));
