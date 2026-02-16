import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }

        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || 'An unexpected error occurred',
          code: error.response?.data?.code,
          details: error.response?.data?.details,
        };

        return Promise.reject(apiError);
      }
    );
  }

  public getClient(): AxiosInstance {
    return this.client;
  }

  // Helper methods for common HTTP methods
  public async get<T>(url: string, config = {}) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: unknown, config = {}) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: unknown, config = {}) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config = {}) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  public async patch<T>(url: string, data?: unknown, config = {}) {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient.getClient();
