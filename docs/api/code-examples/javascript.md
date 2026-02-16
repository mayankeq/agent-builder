# JavaScript/TypeScript Code Examples

Complete TypeScript SDK for the Agent-Builder API with full type safety.

## Installation

```bash
npm install axios ws
npm install --save-dev @types/ws
```

## Complete TypeScript SDK

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import WebSocket from 'ws';

// Types
export enum OutputType {
  SKILL = 'skill',
  MCP = 'mcp',
  CLI = 'cli',
  LIBRARY = 'library',
}

export enum Language {
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
}

export enum SessionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum Phase {
  CLARIFICATION = 'clarification',
  DESIGN = 'design',
  IMPLEMENTATION = 'implementation',
  PACKAGING = 'packaging',
  LEARNING = 'learning',
}

export interface User {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'azure' | 'okta';
  createdAt: string;
  lastLogin: string;
}

export interface Session {
  id: string;
  userRequest: string;
  status: SessionStatus;
  currentPhase?: Phase;
  progress: number;
  outputType: OutputType;
  language: Language;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  hasArtifacts: boolean;
}

export interface SessionDetail extends Session {
  metadata?: Record<string, any>;
  artifactsS3Key?: string;
}

export interface AuditLogEntry {
  eventType: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CreateAgentRequest {
  description: string;
  outputType?: OutputType;
  language?: Language;
  interactive?: boolean;
}

export interface ApiKeyStatus {
  exists: boolean;
  valid?: boolean;
  lastValidated?: string;
  createdAt?: string;
}

export interface AgentExample {
  id: string;
  name: string;
  description: string;
  outputType: OutputType;
  language: Language;
}

export class AgentBuilderError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AgentBuilderError';
  }
}

export class AgentBuilderClient {
  private client: AxiosInstance;
  private token?: string;

  constructor(
    private baseURL: string = 'https://api.agent-builder.com',
    token?: string
  ) {
    this.token = token;

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();

    if (token) {
      this.setToken(token);
    }
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<any>) => {
        const message = error.response?.data?.message || error.message;
        const code = error.response?.data?.code;
        const details = error.response?.data?.details;

        throw new AgentBuilderError(message, code, details);
      }
    );
  }

  setToken(token: string): void {
    this.token = token;
  }

  // Authentication

  async getAuthProviders(): Promise<Array<{ id: string; name: string; enabled: boolean }>> {
    const { data } = await this.client.get('/api/auth/providers');
    return data.providers;
  }

  async getCurrentUser(): Promise<{ user: User; session: { expiresAt: string } }> {
    const { data } = await this.client.get('/api/auth/me');
    return data;
  }

  async refreshToken(): Promise<{ token: string; expiresAt: string }> {
    const { data } = await this.client.post('/api/auth/refresh');
    this.setToken(data.token);
    return data;
  }

  async logout(): Promise<void> {
    await this.client.post('/api/auth/logout');
  }

  async logoutAll(): Promise<{ count: number }> {
    const { data } = await this.client.post('/api/auth/logout-all');
    return data;
  }

  // API Keys

  async addApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    const { data } = await this.client.post('/api/api-keys', { apiKey });
    return data;
  }

  async validateApiKey(): Promise<{ valid: boolean; message: string; lastValidated?: string }> {
    try {
      const { data } = await this.client.post('/api/api-keys/validate');
      return data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        return error.response.data;
      }
      throw error;
    }
  }

  async getApiKeyStatus(): Promise<ApiKeyStatus> {
    const { data } = await this.client.get('/api/api-keys/status');
    return data;
  }

  async deleteApiKey(): Promise<{ success: boolean; message: string }> {
    const { data } = await this.client.delete('/api/api-keys');
    return data;
  }

  // Agent Creation

  async createAgent(request: CreateAgentRequest): Promise<string> {
    const { data } = await this.client.post('/api/agents/create', request);
    return data.sessionId;
  }

  async getExamples(): Promise<AgentExample[]> {
    const { data } = await this.client.get('/api/agents/examples');
    return data.examples;
  }

  // Sessions

  async listSessions(
    page: number = 1,
    pageSize: number = 20,
    status?: SessionStatus
  ): Promise<{ sessions: Session[]; pagination: Pagination }> {
    const params: any = { page, pageSize: Math.min(pageSize, 100) };
    if (status) {
      params.status = status;
    }

    const { data } = await this.client.get('/api/sessions', { params });
    return data;
  }

  async getSession(sessionId: string): Promise<{
    session: SessionDetail;
    auditLog: AuditLogEntry[];
  }> {
    const { data } = await this.client.get(`/api/sessions/${sessionId}`);
    return data;
  }

  async cancelSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    const { data } = await this.client.post(`/api/sessions/${sessionId}/cancel`);
    return data;
  }

  async deleteSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    const { data } = await this.client.delete(`/api/sessions/${sessionId}`);
    return data;
  }

  async getSessionStats(): Promise<{
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
    averageDuration: number;
  }> {
    const { data } = await this.client.get('/api/sessions/stats');
    return data.stats;
  }

  // Downloads

  async downloadArtifacts(sessionId: string): Promise<Blob> {
    const { data } = await this.client.get(`/api/downloads/${sessionId}/artifacts`, {
      responseType: 'blob',
    });
    return data;
  }

  async getDownloadUrl(
    sessionId: string,
    expiresIn: number = 3600
  ): Promise<{ url: string; expiresIn: number; expiresAt: string }> {
    const { data } = await this.client.get(`/api/downloads/${sessionId}/artifacts/url`, {
      params: { expiresIn: Math.min(expiresIn, 7200) },
    });
    return data;
  }

  async getArtifactsMetadata(sessionId: string): Promise<{
    sessionId: string;
    artifacts: {
      size: number;
      lastModified: string;
      contentType: string;
      s3Key: string;
    };
    session: {
      status: string;
      outputType: string;
      language: string;
      completedAt: string;
    };
  }> {
    const { data } = await this.client.get(`/api/downloads/${sessionId}/metadata`);
    return data;
  }

  // Utilities

  async waitForCompletion(
    sessionId: string,
    options: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (session: SessionDetail) => void;
    } = {}
  ): Promise<SessionDetail> {
    const { pollInterval = 5000, timeout = 3600000, onProgress } = options;
    const startTime = Date.now();

    while (true) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Session did not complete within ${timeout}ms`);
      }

      const { session } = await this.getSession(sessionId);

      if (onProgress) {
        onProgress(session);
      }

      if (session.status === SessionStatus.COMPLETED) {
        return session;
      }

      if (session.status === SessionStatus.FAILED) {
        throw new Error(`Session failed: ${session.error}`);
      }

      if (session.status === SessionStatus.CANCELLED) {
        throw new Error('Session was cancelled');
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  async *getAllSessions(pageSize: number = 100): AsyncGenerator<Session> {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await this.listSessions(page, pageSize);

      for (const session of result.sessions) {
        yield session;
      }

      hasMore = result.pagination.hasNext;
      page++;
    }
  }
}

// WebSocket Client
export type WebSocketMessage =
  | { type: 'progress'; sessionId: string; progress: number; currentPhase?: Phase }
  | { type: 'phase_complete'; sessionId: string; phase: Phase }
  | { type: 'status_change'; sessionId: string; status: SessionStatus }
  | { type: 'error'; sessionId: string; error: string };

export class AgentBuilderWebSocket {
  private ws?: WebSocket;
  private listeners: Map<string, Set<(message: WebSocketMessage) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(
    private url: string = 'wss://api.agent-builder.com',
    private token: string
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;

        // Authenticate
        this.send({ type: 'auth', token: this.token });

        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        this.handleMessage(message);
      });

      this.ws.on('close', () => {
        console.log('WebSocket disconnected');
        this.reconnect();
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });
    });
  }

  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      console.log(`Reconnecting in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  subscribe(sessionId: string): void {
    this.send({ type: 'subscribe', sessionId });
  }

  unsubscribe(sessionId: string): void {
    this.send({ type: 'unsubscribe', sessionId });
  }

  on(event: WebSocketMessage['type'], callback: (message: WebSocketMessage) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: WebSocketMessage['type'], callback: (message: WebSocketMessage) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private handleMessage(message: WebSocketMessage): void {
    const callbacks = this.listeners.get(message.type);
    if (callbacks) {
      callbacks.forEach((callback) => callback(message));
    }
  }

  private send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
    this.ws?.close();
  }
}

// Example Usage
async function example() {
  // Initialize client
  const client = new AgentBuilderClient('https://api.agent-builder.com', 'your-jwt-token');

  try {
    // Check API key
    const apiKeyStatus = await client.getApiKeyStatus();
    if (!apiKeyStatus.exists) {
      await client.addApiKey('sk-ant-api03-...');
    }

    // Create agent
    const sessionId = await client.createAgent({
      description: 'A web scraper for e-commerce price monitoring',
      outputType: OutputType.MCP,
      language: Language.TYPESCRIPT,
    });

    console.log('Created session:', sessionId);

    // Method 1: Poll for completion
    const session = await client.waitForCompletion(sessionId, {
      pollInterval: 5000,
      timeout: 3600000,
      onProgress: (session) => {
        console.log(`Progress: ${(session.progress * 100).toFixed(0)}%`);
        console.log(`Phase: ${session.currentPhase}`);
      },
    });

    console.log('Session completed!');

    // Download artifacts
    const blob = await client.downloadArtifacts(sessionId);
    // Save blob to file...

  } catch (error) {
    if (error instanceof AgentBuilderError) {
      console.error('API Error:', error.message);
      console.error('Code:', error.code);
      console.error('Details:', error.details);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// WebSocket example
async function websocketExample() {
  const client = new AgentBuilderClient('https://api.agent-builder.com', 'your-jwt-token');

  // Create agent
  const sessionId = await client.createAgent({
    description: 'Price monitoring agent',
    outputType: OutputType.MCP,
    language: Language.TYPESCRIPT,
  });

  // Monitor via WebSocket
  const ws = new AgentBuilderWebSocket('wss://api.agent-builder.com', 'your-jwt-token');

  await ws.connect();

  ws.on('progress', (message) => {
    if ('progress' in message) {
      console.log(`Progress: ${(message.progress * 100).toFixed(0)}%`);
    }
  });

  ws.on('status_change', async (message) => {
    if ('status' in message && message.status === SessionStatus.COMPLETED) {
      console.log('Agent creation completed!');

      // Download artifacts
      const blob = await client.downloadArtifacts(message.sessionId);
      console.log('Downloaded artifacts');

      ws.disconnect();
    }
  });

  ws.subscribe(sessionId);
}
```

## React Hook

```typescript
import { useState, useEffect } from 'react';
import { AgentBuilderClient, Session, SessionStatus } from './agent-builder-client';

export function useAgentBuilder(token: string) {
  const [client] = useState(() => new AgentBuilderClient(
    'https://api.agent-builder.com',
    token
  ));

  return client;
}

export function useSession(sessionId: string, token: string) {
  const client = useAgentBuilder(token);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchSession() {
      try {
        const { session } = await client.getSession(sessionId);
        if (mounted) {
          setSession(session);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchSession();

    return () => {
      mounted = false;
    };
  }, [sessionId, client]);

  return { session, loading, error };
}

export function useSessions(token: string) {
  const client = useAgentBuilder(token);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchSessions() {
      try {
        const { sessions } = await client.listSessions(1, 50);
        if (mounted) {
          setSessions(sessions);
        }
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchSessions();

    return () => {
      mounted = false;
    };
  }, [client]);

  return { sessions, loading };
}
```

## Simple Usage Examples

### Create and Monitor Agent

```typescript
import { AgentBuilderClient, OutputType, Language } from './agent-builder-client';

const client = new AgentBuilderClient('https://api.agent-builder.com', 'your-token');

// Create agent
const sessionId = await client.createAgent({
  description: 'A log parser that extracts error patterns',
  outputType: OutputType.CLI,
  language: Language.PYTHON,
});

// Wait for completion
const session = await client.waitForCompletion(sessionId, {
  onProgress: (session) => {
    console.log(`${session.currentPhase}: ${(session.progress * 100).toFixed(0)}%`);
  },
});

// Download
const blob = await client.downloadArtifacts(sessionId);
```

### Browser Download Helper

```typescript
async function downloadAndSave(sessionId: string, filename: string) {
  const blob = await client.downloadArtifacts(sessionId);

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

await downloadAndSave(sessionId, `${sessionId}.zip`);
```

### Async Iterator for All Sessions

```typescript
// Get all sessions using async generator
for await (const session of client.getAllSessions()) {
  console.log(session.id, session.userRequest);
}
```

### Error Handling with Retry

```typescript
async function createAgentWithRetry(
  request: CreateAgentRequest,
  maxRetries: number = 3
): Promise<string> {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.createAgent(request);
    } catch (error: any) {
      lastError = error;

      if (error.response?.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      // Don't retry on validation errors
      if (error.response?.status === 400) {
        throw error;
      }

      // Exponential backoff for other errors
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }

  throw lastError;
}
```
