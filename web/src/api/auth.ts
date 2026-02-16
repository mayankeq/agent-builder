import { apiClient } from './client';
import { User, SSOProvider, AuthStatus } from '@/types';

export const authApi = {
  // Get available SSO providers
  getProviders: async (): Promise<SSOProvider[]> => {
    return apiClient.get('/auth/providers');
  },

  // Get current user info
  getMe: async (): Promise<User> => {
    return apiClient.get('/auth/me');
  },

  // Check authentication status
  getStatus: async (): Promise<AuthStatus> => {
    return apiClient.get('/auth/status');
  },

  // Refresh JWT token
  refreshToken: async (): Promise<{ token: string }> => {
    return apiClient.post('/auth/refresh');
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('auth_token');
  },

  // Logout from all devices
  logoutAll: async (): Promise<void> => {
    await apiClient.post('/auth/logout-all');
    localStorage.removeItem('auth_token');
  },

  // Set auth token
  setToken: (token: string): void => {
    localStorage.setItem('auth_token', token);
  },

  // Get auth token
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  // Clear auth token
  clearToken: (): void => {
    localStorage.removeItem('auth_token');
  },
};
