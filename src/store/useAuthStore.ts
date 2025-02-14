// src/store/useAuthStore.ts
import { create } from 'zustand';
import type { User } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetError: () => void;
  getToken: () => string | null;
  fetchUser: () => Promise<void>;
}

const getStoredUser = (): User | null => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  token: localStorage.getItem('auth_token') || null,
  user: getStoredUser(),
  isAuthenticated: Boolean(localStorage.getItem('auth_token')),
  isLoading: false,
  error: null,

  getToken: () => get().token,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(email, password);

      if (response.status === 'error' || !response.data) {
        throw new Error(response.message || 'Login failed');
      }

      const { token, user } = response.data;

      // Store token and user data
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
        isAuthenticated: false,
        token: null,
        user: null,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear stored data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');

      // Reset state
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const response = await authApi.getMe();
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  resetError: () => set({ error: null }),
}));

useAuthStore.getState().fetchUser();
// Custom hooks for common auth operations
export const useIsAuthenticated = () =>
  useAuthStore(state => state.isAuthenticated);
export const useCurrentUser = () => useAuthStore(state => state.user);
export const useIsAdmin = () =>
  useAuthStore(state => state.user?.role === 'admin');
