import axios, { AxiosInstance, AxiosError } from 'axios';
import type { User, AuthConfig, AgentCreateRequest, AgentSession, AgentListResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================
  // Authentication
  // ============================================

  async getAuthConfig(): Promise<AuthConfig> {
    const response = await this.client.get<AuthConfig>('/api/auth/config');
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/api/auth/me');
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/api/auth/logout');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  initiateGoogleLogin(): void {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  }

  // ============================================
  // Agents
  // ============================================

  async createAgent(request: AgentCreateRequest): Promise<AgentSession> {
    const response = await this.client.post<AgentSession>('/api/agents/create', request);
    return response.data;
  }

  async getAgent(sessionId: string): Promise<AgentSession> {
    const response = await this.client.get<AgentSession>(`/api/agents/${sessionId}`);
    return response.data;
  }

  async listAgents(): Promise<AgentListResponse> {
    const response = await this.client.get<AgentListResponse>('/api/agents');
    return response.data;
  }

  async downloadAgent(sessionId: string): Promise<void> {
    const token = this.getToken();
    const url = `${API_BASE_URL}/api/agents/${sessionId}/download`;

    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `agent-${sessionId}.zip`;

    // Add authorization header via fetch and blob
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);

    link.href = objectUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL
    window.URL.revokeObjectURL(objectUrl);
  }

  // ============================================
  // Utility
  // ============================================

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const apiClient = new APIClient();
export default apiClient;
