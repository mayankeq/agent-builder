import { WorkflowContext, WorkflowPhase } from './workflow';

/**
 * Agent configuration
 */
export interface AgentConfig {
  timeout?: number;
  maxRetries?: number;
  retryBackoff?: number;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Agent state during execution
 */
export interface AgentState {
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  metrics: {
    duration?: number;
    tokenUsage?: number;
    retries?: number;
  };
  error?: Error;
}

/**
 * Result returned by agent execution
 */
export interface AgentResult {
  type: string;
  data: any;
  nextPhase?: WorkflowPhase;
  metadata?: Record<string, any>;
}

/**
 * Base agent interface
 */
export interface IAgent {
  execute(context: WorkflowContext): Promise<AgentResult>;
  executeWithTimeout(): Promise<AgentResult>;
  getName(): string;
  getPhase(): WorkflowPhase;
}

/**
 * Question asked during clarification
 */
export interface Question {
  id: string;
  category: 'functional' | 'technical' | 'architectural' | 'performance' | 'output';
  text: string;
  required: boolean;
  options?: string[];
}

/**
 * Answer to a clarification question
 */
export interface Answer {
  questionId: string;
  value: string | string[];
}
