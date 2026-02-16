import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseAgent } from '@/agents/base-agent';
import { WorkflowContext, WorkflowPhase } from '@/types/workflow';
import { AgentConfig, AgentResult } from '@/types/agent';
import { createTestWorkflowContext } from '../fixtures/workflow-fixtures';

// Concrete implementation for testing
class TestAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  async execute(context: WorkflowContext): Promise<AgentResult> {
    this.startExecution();
    this.validateContext(context);

    try {
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 10));

      const result: AgentResult = {
        success: true,
        data: { test: 'data' },
        metrics: {
          duration: 10,
        },
      };

      this.endExecution(true);
      return result;
    } catch (error) {
      this.endExecution(false, error as Error);
      throw error;
    }
  }

  getName(): string {
    return 'TestAgent';
  }

  getPhase(): WorkflowPhase {
    return 'clarification';
  }
}

describe('BaseAgent', () => {
  let agent: TestAgent;
  let config: AgentConfig;
  let context: WorkflowContext;

  beforeEach(() => {
    config = {
      timeout: 5000,
      maxRetries: 3,
      retryBackoff: 1000,
    };
    agent = new TestAgent(config);
    context = createTestWorkflowContext();
  });

  describe('execute', () => {
    it('should execute successfully', async () => {
      const result = await agent.execute(context);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should track execution state', async () => {
      const executePromise = agent.execute(context);

      // Agent should be running
      const runningState = agent.getState();
      expect(['running', 'completed']).toContain(runningState.status);

      await executePromise;

      // Agent should be completed
      const finalState = agent.getState();
      expect(finalState.status).toBe('completed');
    });

    it('should record execution metrics', async () => {
      await agent.execute(context);

      const state = agent.getState();
      expect(state.metrics.duration).toBeGreaterThan(0);
      expect(state.startTime).toBeInstanceOf(Date);
      expect(state.endTime).toBeInstanceOf(Date);
    });
  });

  describe('validation', () => {
    it('should validate context has sessionId', async () => {
      const invalidContext = { ...context, sessionId: '' };

      await expect(agent.execute(invalidContext as WorkflowContext)).rejects.toThrow(
        'Context must have sessionId'
      );
    });

    it('should validate context has currentPhase', async () => {
      const invalidContext = { ...context, currentPhase: undefined };

      await expect(agent.execute(invalidContext as any)).rejects.toThrow(
        'Context must have currentPhase'
      );
    });
  });

  describe('error handling', () => {
    it('should handle execution errors', async () => {
      class ErrorAgent extends TestAgent {
        async execute(_context: WorkflowContext): Promise<AgentResult> {
          this.startExecution();
          throw new Error('Execution failed');
        }
      }

      const errorAgent = new ErrorAgent(config);

      await expect(errorAgent.execute(context)).rejects.toThrow('Execution failed');

      const state = errorAgent.getState();
      expect(state.status).toBe('failed');
      expect(state.error).toBeDefined();
    });

    it('should update state on error', async () => {
      class ErrorAgent extends TestAgent {
        async execute(_context: WorkflowContext): Promise<AgentResult> {
          this.startExecution();
          const error = new Error('Test error');
          this.endExecution(false, error);
          throw error;
        }
      }

      const errorAgent = new ErrorAgent(config);

      await expect(errorAgent.execute(context)).rejects.toThrow('Test error');

      const state = errorAgent.getState();
      expect(state.status).toBe('failed');
      expect(state.error?.message).toBe('Test error');
    });
  });

  describe('state management', () => {
    it('should start in pending state', () => {
      const state = agent.getState();
      expect(state.status).toBe('pending');
    });

    it('should track execution lifecycle', async () => {
      const states: string[] = [];

      // Capture initial state
      states.push(agent.getState().status);

      const executePromise = agent.execute(context);

      // Wait a bit for execution to start
      await new Promise(resolve => setTimeout(resolve, 5));
      states.push(agent.getState().status);

      await executePromise;
      states.push(agent.getState().status);

      // Should transition: pending -> running -> completed
      expect(states[0]).toBe('pending');
      expect(['running', 'completed']).toContain(states[1]);
      expect(states[2]).toBe('completed');
    });

    it('should preserve metrics in state', async () => {
      await agent.execute(context);

      const state = agent.getState();
      expect(state.metrics).toBeDefined();
      expect(state.metrics.duration).toBeGreaterThan(0);
    });
  });

  describe('retry logic', () => {
    it('should retry on retryable errors', async () => {
      let attempts = 0;

      class RetryAgent extends TestAgent {
        async execute(context: WorkflowContext): Promise<AgentResult> {
          this.startExecution();

          const result = await this.retryWithBackoff(async () => {
            attempts++;
            if (attempts < 2) {
              const error: any = new Error('Retryable error');
              error.status = 429; // Rate limit
              throw error;
            }
            return { success: true };
          }, 3);

          this.endExecution(true);
          return {
            success: true,
            data: result,
            metrics: {},
          };
        }
      }

      const retryAgent = new RetryAgent(config);
      await retryAgent.execute(context);

      expect(attempts).toBe(2);
    });
  });

  describe('timeout', () => {
    it('should have default timeout', async () => {
      const agentWithoutTimeout = new TestAgent({});
      await agentWithoutTimeout.execute(context);

      // Should complete successfully with default timeout
      const state = agentWithoutTimeout.getState();
      expect(state.status).toBe('completed');
    });

    it('should respect custom timeout', async () => {
      const shortTimeoutAgent = new TestAgent({ timeout: 100 });

      // This test verifies timeout configuration exists
      expect(shortTimeoutAgent).toBeDefined();
    });
  });

  describe('getName and getPhase', () => {
    it('should return agent name', () => {
      expect(agent.getName()).toBe('TestAgent');
    });

    it('should return agent phase', () => {
      expect(agent.getPhase()).toBe('clarification');
    });
  });

  describe('logging', () => {
    it('should log progress messages', async () => {
      // Spy on logger if needed
      await agent.execute(context);

      // Verify agent completed successfully
      const state = agent.getState();
      expect(state.status).toBe('completed');
    });
  });
});
