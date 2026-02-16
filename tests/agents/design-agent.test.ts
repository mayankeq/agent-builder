import { describe, it, expect, beforeEach } from 'vitest';
import { DesignAgent } from '@/agents/design-agent';
import { MockClaudeClient } from '../utils/mock-claude-client';
import { createTestWorkflowContext, createTestRequirements } from '../fixtures/workflow-fixtures';
import { AgentConfig } from '@/types/agent';

describe('DesignAgent', () => {
  let mockClaudeClient: MockClaudeClient;
  let agent: DesignAgent;
  let context: ReturnType<typeof createTestWorkflowContext>;

  beforeEach(() => {
    mockClaudeClient = new MockClaudeClient();
    const claudeClient = mockClaudeClient.createMock();

    const config: AgentConfig = {
      timeout: 60000,
      maxRetries: 3,
    };

    agent = new DesignAgent(claudeClient as any, config);
    context = createTestWorkflowContext();
    context.requirements = createTestRequirements();

    // Set up mock response with thinking
    mockClaudeClient.setMockResponse('design', {
      text: JSON.stringify({
        design: {
          components: [
            {
              name: 'CLI',
              type: 'interface',
              responsibilities: ['Parse arguments', 'Display output'],
              dependencies: ['Parser', 'Formatter'],
            },
            {
              name: 'Parser',
              type: 'logic',
              responsibilities: ['Parse input'],
              dependencies: [],
            },
          ],
          dataFlow: 'CLI -> Parser -> Formatter -> CLI',
          architecture: 'Layered architecture',
          technologies: ['typescript', 'yargs', 'chalk'],
        },
      }),
      thinkingBlocks: [
        'Analyzing requirements...',
        'Considering architecture patterns...',
        'Designing component structure...',
      ],
      usage: { inputTokens: 500, outputTokens: 800, totalTokens: 1300 },
    });
  });

  describe('execute', () => {
    it('should create design successfully', async () => {
      const result = await agent.execute(context);

      expect(result.success).toBe(true);
      expect(result.data.design).toBeDefined();
    });

    it('should define components', async () => {
      const result = await agent.execute(context);

      expect(result.data.design.components).toBeInstanceOf(Array);
      expect(result.data.design.components.length).toBeGreaterThan(0);
      expect(result.data.design.components[0].name).toBeDefined();
      expect(result.data.design.components[0].responsibilities).toBeInstanceOf(Array);
    });

    it('should define architecture', async () => {
      const result = await agent.execute(context);

      expect(result.data.design.architecture).toBeDefined();
      expect(typeof result.data.design.architecture).toBe('string');
    });

    it('should define data flow', async () => {
      const result = await agent.execute(context);

      expect(result.data.design.dataFlow).toBeDefined();
    });

    it('should specify technologies', async () => {
      const result = await agent.execute(context);

      expect(result.data.design.technologies).toBeInstanceOf(Array);
      expect(result.data.design.technologies.length).toBeGreaterThan(0);
    });

    it('should capture thinking trace when extended thinking is used', async () => {
      const result = await agent.execute(context);

      expect(result.data.design.thinkingTrace).toBeDefined();
      expect(result.data.design.thinkingTrace).toBeInstanceOf(Array);
      expect(result.data.design.thinkingTrace!.length).toBeGreaterThan(0);
    });
  });

  describe('getName and getPhase', () => {
    it('should return correct name', () => {
      expect(agent.getName()).toBe('DesignAgent');
    });

    it('should return design phase', () => {
      expect(agent.getPhase()).toBe('design');
    });
  });

  describe('requirements context', () => {
    it('should fail if no requirements in context', async () => {
      const contextWithoutReqs = createTestWorkflowContext();
      contextWithoutReqs.requirements = undefined;

      await expect(agent.execute(contextWithoutReqs)).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle invalid design response', async () => {
      mockClaudeClient.setMockResponse('design', {
        text: 'Not valid JSON',
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
