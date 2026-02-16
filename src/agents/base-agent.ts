import { WorkflowContext, WorkflowPhase } from '../types/workflow';
import { AgentConfig, AgentResult, AgentState, IAgent } from '../types/agent';
import { createLogger, Logger } from '../utils/logger';
import { withTimeout } from '../utils/error-handler';
import { retryWithBackoff, isRetryableError } from '../utils/error-handler';

/**
 * Abstract base class for all agents
 * Provides common functionality like lifecycle management, timeout, and retry logic
 */
export abstract class BaseAgent implements IAgent {
  protected config: AgentConfig;
  protected logger: Logger;
  protected state: AgentState;

  constructor(config: AgentConfig) {
    this.config = config;
    this.logger = createLogger(this.getName());
    this.state = {
      status: 'pending',
      metrics: {},
    };
  }

  /**
   * Main execution method - must be implemented by subclasses
   */
  abstract execute(context: WorkflowContext): Promise<AgentResult>;

  /**
   * Get agent name for logging and identification
   */
  abstract getName(): string;

  /**
   * Get the workflow phase this agent operates in
   */
  abstract getPhase(): WorkflowPhase;

  /**
   * Execute with timeout wrapper
   */
  async executeWithTimeout(): Promise<AgentResult> {
    const timeout = this.config.timeout || 300000; // 5 minutes default

    this.logger.info(`Executing with timeout of ${timeout}ms`);

    try {
      return await withTimeout(
        () => this.execute({} as WorkflowContext), // This will be called with proper context
        timeout
      );
    } catch (error) {
      this.logger.error('Execution failed', error as Error);
      throw error;
    }
  }

  /**
   * Retry with exponential backoff
   */
  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3
  ): Promise<T> {
    return retryWithBackoff(fn, {
      maxAttempts,
      initialBackoff: this.config.retryBackoff || 2000,
      maxBackoff: 30000,
      exponentialBase: 2,
      shouldRetry: isRetryableError,
    });
  }

  /**
   * Update agent state
   */
  protected updateState(updates: Partial<AgentState>): void {
    this.state = { ...this.state, ...updates };
  }

  /**
   * Start execution tracking
   */
  protected startExecution(): void {
    this.updateState({
      status: 'running',
      startTime: new Date(),
    });
    this.logger.info('Execution started');
  }

  /**
   * End execution tracking
   */
  protected endExecution(success: boolean, error?: Error): void {
    const endTime = new Date();
    const duration = this.state.startTime
      ? endTime.getTime() - this.state.startTime.getTime()
      : 0;

    this.updateState({
      status: success ? 'completed' : 'failed',
      endTime,
      metrics: {
        ...this.state.metrics,
        duration,
      },
      error,
    });

    if (success) {
      this.logger.info('Execution completed', { duration });
    } else {
      this.logger.error('Execution failed', error);
    }
  }

  /**
   * Get current agent state
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Validate context before execution
   */
  protected validateContext(context: WorkflowContext): void {
    if (!context.sessionId) {
      throw new Error('Context must have sessionId');
    }
    if (!context.currentPhase) {
      throw new Error('Context must have currentPhase');
    }
  }

  /**
   * Log progress during execution
   */
  protected logProgress(message: string, metadata?: Record<string, any>): void {
    this.logger.info(message, metadata);
  }
}
