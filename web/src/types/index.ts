// User types
export interface User {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'azure' | 'okta';
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt: string;
}

// Session types
export type SessionStatus = 'pending' | 'clarifying' | 'designing' | 'implementing' | 'packaging' | 'completed' | 'failed' | 'cancelled';

export type OutputType = 'skill' | 'mcp' | 'cli' | 'library';
export type Language = 'typescript' | 'python';

export interface AgentSession {
  id: string;
  userId: string;
  description: string;
  outputType: OutputType;
  language: Language;
  status: SessionStatus;
  currentPhase?: string;
  progress: number;
  result?: {
    code?: string;
    artifactUrl?: string;
    metadata?: Record<string, unknown>;
  };
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface SessionListResponse {
  sessions: AgentSession[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SessionStats {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
}

// API Key types
export interface ApiKeyStatus {
  hasKey: boolean;
  isValid: boolean;
  lastValidated?: string;
}

// Create agent request
export interface CreateAgentRequest {
  description: string;
  outputType: OutputType;
  language: Language;
  options?: {
    priority?: 'speed' | 'quality' | 'trust' | 'budget';
    testCoverage?: number;
    optimizations?: string[];
  };
}

export interface CreateAgentResponse {
  sessionId: string;
  status: SessionStatus;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'progress' | 'phase' | 'completed' | 'error' | 'cancelled';
  sessionId: string;
  data: {
    phase?: string;
    progress?: number;
    status?: SessionStatus;
    message?: string;
    error?: string;
    result?: AgentSession['result'];
  };
  timestamp: string;
}

// Artifact types
export interface ArtifactFile {
  path: string;
  content: string;
  size: number;
  language?: string;
}

export interface ArtifactMetadata {
  sessionId: string;
  files: {
    path: string;
    size: number;
    contentType: string;
  }[];
  totalSize: number;
  createdAt: string;
}

// Example template types
export interface ExampleTemplate {
  id: string;
  title: string;
  description: string;
  outputType: OutputType;
  language: Language;
  category: string;
  prompt: string;
  tags: string[];
}

// Auth types
export interface SSOProvider {
  name: string;
  displayName: string;
  enabled: boolean;
  authUrl: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: User;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}
