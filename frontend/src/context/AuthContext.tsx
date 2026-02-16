import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import apiClient from '../api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string) => void;
  login: () => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null
        });
      },

      setToken: (token) => {
        apiClient.setToken(token);
        set({ isAuthenticated: true });
      },

      login: () => {
        apiClient.initiateGoogleLogin();
      },

      logout: async () => {
        try {
          await apiClient.logout();
          set({
            user: null,
            isAuthenticated: false,
            error: null
          });
        } catch (error) {
          console.error('Logout error:', error);
          // Force logout even if API call fails
          set({
            user: null,
            isAuthenticated: false
          });
        }
      },

      fetchUser: async () => {
        if (!apiClient.isAuthenticated()) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const user = await apiClient.getCurrentUser();
          set({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          console.error('Failed to fetch user:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.response?.data?.message || 'Failed to fetch user'
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);
