import { apiClient } from './client';
import {
  AgentSession,
  SessionListResponse,
  SessionStats,
  CreateAgentRequest,
  CreateAgentResponse,
} from '@/types';

export const sessionsApi = {
  // List sessions with pagination and filters
  list: async (params: {
    page?: number;
    pageSize?: number;
    status?: string;
    outputType?: string;
    search?: string;
  } = {}): Promise<SessionListResponse> => {
    return apiClient.get('/sessions', { params });
  },

  // Get session details
  get: async (sessionId: string): Promise<AgentSession> => {
    return apiClient.get(`/sessions/${sessionId}`);
  },

  // Create new agent session
  create: async (request: CreateAgentRequest): Promise<CreateAgentResponse> => {
    return apiClient.post('/agents/create', request);
  },

  // Cancel in-progress session
  cancel: async (sessionId: string): Promise<void> => {
    return apiClient.post(`/sessions/${sessionId}/cancel`);
  },

  // Delete session
  delete: async (sessionId: string): Promise<void> => {
    return apiClient.delete(`/sessions/${sessionId}`);
  },

  // Get user session statistics
  getStats: async (): Promise<SessionStats> => {
    return apiClient.get('/sessions/stats');
  },
};
