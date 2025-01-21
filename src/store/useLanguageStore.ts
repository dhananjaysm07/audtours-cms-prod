// src/store/useLanguageStore.ts
import { create } from "zustand";
import { languageApi } from "@/lib/api";

interface Language {
  id: number;
  name: string;
  isActive: boolean;
}

interface LanguageState {
  languages: Language[];
  isLoading: boolean;
  error: string | null;
  fetchLanguages: () => Promise<void>;
  createLanguage: (name: string) => Promise<void>;
  toggleLanguageStatus: (id: number) => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  languages: [],
  isLoading: false,
  error: null,

  fetchLanguages: async () => {
    set({ isLoading: true });
    try {
      const response = await languageApi.getLanguages();
      set({ languages: response.data, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch languages",
        isLoading: false,
      });
    }
  },

  createLanguage: async (name: string) => {
    set({ isLoading: true });
    try {
      await languageApi.createLanguage(name);
      await get().fetchLanguages();
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to create language",
        isLoading: false,
      });
    }
  },

  toggleLanguageStatus: async (id: number) => {
    try {
      await languageApi.toggleLanguageStatus(id);
      await get().fetchLanguages();
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to toggle language status",
      });
    }
  },
}));
