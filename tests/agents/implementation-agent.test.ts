import { describe, it, expect, beforeEach } from 'vitest';
import { ImplementationAgent } from '@/agents/implementation-agent';
import { MockClaudeClient } from '../utils/mock-claude-client';
import {
  createTestWorkflowContext,
  createTestRequirements,
  createTestDesign,
} from '../fixtures/workflow-fixtures';
import { AgentConfig } from '@/types/agent';

describe('ImplementationAgent', () => {
  let mockClaudeClient: MockClaudeClient;
  let agent: ImplementationAgent;
  let context: ReturnType<typeof createTestWorkflowContext>;

  beforeEach(() => {
    mockClaudeClient = new MockClaudeClient();
    const claudeClient = mockClaudeClient.createMock();

    const config: AgentConfig = {
      timeout: 60000,
      maxRetries: 3,
    };

    agent = new ImplementationAgent(claudeClient as any, config);
    context = createTestWorkflowContext();
    context.requirements = createTestRequirements();
    context.design = createTestDesign();

    // Set up mock response
    mockClaudeClient.setMockResponse('implement', {
      text: JSON.stringify({
        code: {
          'index.ts': `
import { Calculator } from './calculator';

export function main() {
  const calc = new Calculator();
  console.log(calc.add(2, 3));
}

main();
          `,
          'calculator.ts': `
export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  subtract(a: number, b: number): number {
    return a - b;
  }
}
          `,
        },
      }),
      usage: { inputTokens: 300, outputTokens: 600, totalTokens: 900 },
    });
  });

  describe('execute', () => {
    it('should generate code successfully', async () => {
      const result = await agent.execute(context);

      expect(result.success).toBe(true);
      expect(result.data.code).toBeDefined();
    });

    it('should generate multiple code files', async () => {
      const result = await agent.execute(context);

      expect(result.data.code).toBeInstanceOf(Object);
      expect(Object.keys(result.data.code).length).toBeGreaterThan(0);
    });

    it('should generate files with proper extensions', async () => {
      const result = await agent.execute(context);

      const files = Object.keys(result.data.code);
      files.forEach(file => {
        expect(file).toMatch(/\.(ts|js|py|yaml|json)$/);
      });
    });

    it('should generate valid TypeScript code', async () => {
      const result = await agent.execute(context);

      const code = result.data.code['calculator.ts'];
      expect(code).toBeDefined();
      expect(code).toContain('class Calculator');
      expect(code).toContain('export');
    });
  });

  describe('getName and getPhase', () => {
    it('should return correct name', () => {
      expect(agent.getName()).toBe('ImplementationAgent');
    });

    it('should return implementation phase', () => {
      expect(agent.getPhase()).toBe('implementation');
    });
  });

  describe('context requirements', () => {
    it('should fail if no requirements in context', async () => {
      const contextWithoutReqs = createTestWorkflowContext();
      contextWithoutReqs.requirements = undefined;

      await expect(agent.execute(contextWithoutReqs)).rejects.toThrow();
    });

    it('should fail if no design in context', async () => {
      const contextWithoutDesign = createTestWorkflowContext();
      contextWithoutDesign.requirements = createTestRequirements();
      contextWithoutDesign.design = undefined;

      await expect(agent.execute(contextWithoutDesign)).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle invalid code response', async () => {
      mockClaudeClient.setMockResponse('implement', {
        text: 'Not valid JSON',
        usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
      });

      await expect(agent.execute(context)).rejects.toThrow();
    });

    it('should handle missing code in response', async () => {
      mockClaudeClient.setMockResponse('implement', {
        text: JSON.stringify({ other: 'data' }),
        usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
      });

      await expect(agent.execute(context)).rejects.toThrow();
    });
  });

  describe('language-specific code generation', () => {
    it('should generate TypeScript code for TypeScript projects', async () => {
      context.requirements = createTestRequirements({
        output: { type: 'cli', language: 'typescript' },
      });

      const result = await agent.execute(context);

      const files = Object.keys(result.data.code);
      const tsFiles = files.filter(f => f.endsWith('.ts'));
      expect(tsFiles.length).toBeGreaterThan(0);
    });

    it('should handle Python code generation', async () => {
      context.requirements = createTestRequirements({
        output: { type: 'cli', language: 'python' },
      });

      mockClaudeClient.setMockResponse('implement', {
        text: JSON.stringify({
          code: {
            'main.py': 'def main():\n    print("Hello")\n',
            'calculator.py': 'class Calculator:\n    def add(self, a, b):\n        return a + b\n',
          },
        }),
        usage: { inputTokens: 300, outputTokens: 600, totalTokens: 900 },
      });

      const result = await agent.execute(context);

      const files = Object.keys(result.data.code);
      const pyFiles = files.filter(f => f.endsWith('.py'));
      expect(pyFiles.length).toBeGreaterThan(0);
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
