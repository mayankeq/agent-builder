import { apiClient } from './client';
import { ArtifactMetadata } from '@/types';

export const downloadsApi = {
  // Download artifacts as ZIP
  downloadZip: async (sessionId: string): Promise<Blob> => {
    const response = await apiClient.getClient().get(`/downloads/${sessionId}/artifacts`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get presigned download URL
  getDownloadUrl: async (sessionId: string): Promise<{ url: string; expiresAt: string }> => {
    return apiClient.get(`/downloads/${sessionId}/artifacts/url`);
  },

  // Get artifacts metadata
  getMetadata: async (sessionId: string): Promise<ArtifactMetadata> => {
    return apiClient.get(`/downloads/${sessionId}/metadata`);
  },

  // Trigger download in browser
  triggerDownload: (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
