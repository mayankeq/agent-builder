export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  domain: string;
}

export interface AuthConfig {
  allowed_domains: string[];
  google_oauth_enabled: boolean;
}

export interface AgentCreateRequest {
  description: string;
  output_format: 'mcp' | 'skill' | 'cli' | 'library';
  language: 'typescript' | 'python';
  options?: {
    include_tests?: boolean;
    include_docs?: boolean;
    optimize_for?: 'speed' | 'quality' | 'trust' | 'budget';
  };
}

export interface AgentLog {
  type: 'stdout' | 'stderr';
  message: string;
  timestamp: string;
}

export interface AgentSession {
  id: string;
  user_id: string;
  description: string;
  output_format: string;
  language: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  logs?: AgentLog[];
  result?: {
    output_path: string;
    files: string[];
    tests_passed?: number;
    tests_total?: number;
  };
  error?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface AgentListResponse {
  agents: AgentSession[];
  total: number;
}
