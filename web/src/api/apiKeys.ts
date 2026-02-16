import { apiClient } from './client';
import { ApiKeyStatus } from '@/types';

export const apiKeysApi = {
  // Add or update API key
  add: async (apiKey: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post('/api-keys', { apiKey });
  },

  // Validate stored API key
  validate: async (): Promise<{ valid: boolean; message: string }> => {
    return apiClient.post('/api-keys/validate');
  },

  // Get API key status
  getStatus: async (): Promise<ApiKeyStatus> => {
    return apiClient.get('/api-keys/status');
  },

  // Delete API key
  delete: async (): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete('/api-keys');
  },
};
