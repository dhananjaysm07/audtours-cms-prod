import { storeApi } from "@/lib/api";
import { CreateStorePayload } from "@/lib/api/store";
import { Store } from "@/types";
import { create } from "zustand";
import { toast } from "sonner";

interface StorefrontState {
  stores: Store[];
  currentStore: Store | null;
  isLoading: boolean;
  error: string | null;
  error_status: number | null;
  display_toast: boolean;
  fetchStores: () => Promise<void>;
  fetchStore: (id: number) => Promise<void>;
  createStore: (data: CreateStorePayload) => Promise<void>;
  updateStore: (id: number, data: Partial<CreateStorePayload>) => Promise<void>;
  toggleStoreActivation: (id: number, isActive: boolean) => Promise<void>;
}

export const useStorefrontStore = create<StorefrontState>((set, get) => ({
  stores: [],
  currentStore: null,
  isLoading: false,
  error: null,
  error_status: null,
  display_toast: false,

  fetchStores: async () => {
    set({ isLoading: true });
    try {
      const response = await storeApi.getStores();
      set({
        stores: response.data,
        isLoading: false,
        error: null,
        error_status: null,
      });
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Failed to fetch stores";
      set({
        error: error_message,
        error_status: error instanceof Response ? error.status : 500,
        isLoading: false,
      });
      toast.error(error_message);
    }
  },

  fetchStore: async (id: number) => {
    set({ isLoading: true });
    try {
      const response = await storeApi.getStore(id);
      set({
        currentStore: response.data,
        isLoading: false,
        error: null,
        error_status: null,
      });
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Failed to fetch store";
      set({
        error: error_message,
        error_status: error instanceof Response ? error.status : 500,
        isLoading: false,
      });
      toast.error(error_message);
    }
  },

  createStore: async (data: CreateStorePayload) => {
    set({ isLoading: true });
    try {
      const response = await storeApi.createStore(data);
      set((state) => ({
        stores: [response.data, ...state.stores],
        isLoading: false,
        error: null,
        error_status: null,
      }));
      toast.success("Store created successfully");
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Failed to create store";
      set({
        error: error_message,
        error_status: error instanceof Response ? error.status : 500,
        isLoading: false,
      });
      toast.error(error_message);
    }
  },

  updateStore: async (id: number, data: Partial<CreateStorePayload>) => {
    set({ isLoading: true });
    try {
      const response = await storeApi.updateStore(id, data);
      set((state) => ({
        stores: state.stores.map((store) =>
          store.id === id ? response.data : store
        ),
        isLoading: false,
        error: null,
        error_status: null,
      }));
      toast.success("Store updated successfully");
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Failed to update store";
      set({
        error: error_message,
        error_status: error instanceof Response ? error.status : 500,
        isLoading: false,
      });
      toast.error(error_message);
    }
  },

  toggleStoreActivation: async (id: number, isActive: boolean) => {
    try {
      const response = await storeApi.toggleStoreActivation(id, { isActive });
      set((state) => ({
        stores: state.stores.map((store) =>
          store.id === id ? response.data : store
        ),
        error: null,
        error_status: null,
      }));
      toast.success(
        `Store ${isActive ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      const error_message =
        error instanceof Error
          ? error.message
          : "Failed to toggle store activation status";
      set({
        error: error_message,
        error_status: error instanceof Response ? error.status : 500,
      });
      toast.error(error_message);
    }
  },
}));
