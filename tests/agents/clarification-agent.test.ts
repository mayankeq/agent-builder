import { describe, it, expect, beforeEach } from 'vitest';
import { ClarificationAgent } from '@/agents/clarification-agent';
import { MockClaudeClient } from '../utils/mock-claude-client';
import { createTestWorkflowContext } from '../fixtures/workflow-fixtures';
import { AgentConfig } from '@/types/agent';

describe('ClarificationAgent', () => {
  let mockClaudeClient: MockClaudeClient;
  let agent: ClarificationAgent;
  let context: ReturnType<typeof createTestWorkflowContext>;

  beforeEach(() => {
    mockClaudeClient = new MockClaudeClient();
    const claudeClient = mockClaudeClient.createMock();

    const config: AgentConfig = {
      timeout: 30000,
      maxRetries: 3,
    };

    agent = new ClarificationAgent(claudeClient as any, config);
    context = createTestWorkflowContext();

    // Set up mock response
    mockClaudeClient.setMockResponse('clarify', {
      text: JSON.stringify({
        requirements: {
          functional: ['Parse input', 'Generate output', 'Handle errors'],
          technical: {
            language: 'typescript',
            framework: 'none',
            dependencies: ['chalk'],
          },
          architectural: {
            patterns: ['Command pattern'],
            constraints: ['Single file'],
          },
          output: {
            type: 'cli',
            language: 'typescript',
          },
        },
      }),
      usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
    });
  });

  describe('execute', () => {
    it('should gather requirements successfully', async () => {
      const result = await agent.execute(context);

      expect(result.success).toBe(true);
      expect(result.data.requirements).toBeDefined();
      expect(result.data.requirements.functional).toBeInstanceOf(Array);
      expect(result.data.requirements.functional.length).toBeGreaterThan(0);
    });

    it('should extract functional requirements', async () => {
      const result = await agent.execute(context);

      expect(result.data.requirements.functional).toContain('Parse input');
      expect(result.data.requirements.functional).toContain('Generate output');
    });

    it('should extract technical requirements', async () => {
      const result = await agent.execute(context);

      expect(result.data.requirements.technical).toBeDefined();
      expect(result.data.requirements.technical.language).toBe('typescript');
    });

    it('should extract output configuration', async () => {
      const result = await agent.execute(context);

      expect(result.data.requirements.output).toBeDefined();
      expect(result.data.requirements.output.type).toBe('cli');
      expect(result.data.requirements.output.language).toBe('typescript');
    });
  });

  describe('getName and getPhase', () => {
    it('should return correct name', () => {
      expect(agent.getName()).toBe('ClarificationAgent');
    });

    it('should return clarification phase', () => {
      expect(agent.getPhase()).toBe('clarification');
    });
  });

  describe('error handling', () => {
    it('should handle invalid JSON response', async () => {
      mockClaudeClient.setMockResponse('clarify', {
        text: 'Invalid JSON',
        usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
      });

      await expect(agent.execute(context)).rejects.toThrow();
    });

    it('should handle missing requirements in response', async () => {
      mockClaudeClient.setMockResponse('clarify', {
        text: JSON.stringify({ other: 'data' }),
        usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
      });

      await expect(agent.execute(context)).rejects.toThrow();
    });
  });

  describe('metrics', () => {
    it('should track execution metrics', async () => {
      const result = await agent.execute(context);

      expect(result.metrics).toBeDefined();
      expect(result.metrics.duration).toBeGreaterThan(0);
    });
  });
});
