import { vi } from 'vitest';
import { CompletionRequest, CompletionResponse, ClaudeClient } from '@/claude/claude-client';

/**
 * Mock Claude Client for deterministic testing
 */
export class MockClaudeClient {
  private responses: Map<string, CompletionResponse> = new Map();
  private callCount: Map<string, number> = new Map();

  /**
   * Set mock response for a specific prompt pattern
   */
  setMockResponse(promptPattern: string, response: CompletionResponse): void {
    this.responses.set(promptPattern, response);
  }

  /**
   * Get call count for a prompt pattern
   */
  getCallCount(promptPattern: string): number {
    return this.callCount.get(promptPattern) || 0;
  }

  /**
   * Reset all mocks
   */
  reset(): void {
    this.responses.clear();
    this.callCount.clear();
  }

  /**
   * Create a mocked ClaudeClient instance
   */
  createMock(): ClaudeClient {
    const mockClient = {
      complete: vi.fn(async (request: CompletionRequest): Promise<CompletionResponse> => {
        return this.handleRequest(request, false);
      }),

      completeWithExtendedThinking: vi.fn(async (request: CompletionRequest): Promise<CompletionResponse> => {
        return this.handleRequest(request, true);
      }),

      testConnection: vi.fn(async (): Promise<boolean> => {
        return true;
      }),

      parseThinkingBlocks: vi.fn((response: CompletionResponse): string[] => {
        return response.thinkingBlocks || [];
      }),
    } as unknown as ClaudeClient;

    return mockClient;
  }

  private handleRequest(request: CompletionRequest, withThinking: boolean): CompletionResponse {
    // Find matching response
    for (const [pattern, response] of this.responses.entries()) {
      if (request.prompt.includes(pattern)) {
        const count = this.callCount.get(pattern) || 0;
        this.callCount.set(pattern, count + 1);
        return response;
      }
    }

    // Default response
    const defaultResponse: CompletionResponse = {
      text: 'Mock response',
      thinkingBlocks: withThinking ? ['Mock thinking process'] : undefined,
      usage: {
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
      },
    };

    return defaultResponse;
  }
}

/**
 * Create standard mock responses for common scenarios
 */
export function createMockResponses() {
  return {
    clarification: {
      text: JSON.stringify({
        requirements: {
          functional: ['Feature 1', 'Feature 2'],
          technical: { language: 'typescript', framework: 'none' },
          architectural: { patterns: ['MVC'] },
          output: { type: 'cli', language: 'typescript' },
        },
      }),
      usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
    },

    design: {
      text: JSON.stringify({
        design: {
          components: [
            { name: 'Main', responsibilities: ['Entry point'] },
            { name: 'Handler', responsibilities: ['Process logic'] },
          ],
          architecture: 'Layered',
          technologies: ['typescript', 'node'],
        },
      }),
      thinkingBlocks: ['Analyzing requirements...', 'Designing architecture...'],
      usage: { inputTokens: 200, outputTokens: 400, totalTokens: 600 },
    },

    implementation: {
      text: JSON.stringify({
        code: {
          'index.ts': 'console.log("Hello");',
          'handler.ts': 'export function handle() {}',
        },
      }),
      usage: { inputTokens: 300, outputTokens: 600, totalTokens: 900 },
    },

    testing: {
      text: JSON.stringify({
        tests: {
          'index.test.ts': 'describe("test", () => { it("works", () => {}) });',
        },
      }),
      usage: { inputTokens: 150, outputTokens: 300, totalTokens: 450 },
    },

    documentation: {
      text: JSON.stringify({
        docs: {
          'README.md': '# Project\n\nDescription',
        },
      }),
      usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
    },

    packaging: {
      text: JSON.stringify({
        packageConfig: {
          'package.json': '{"name": "test-package"}',
        },
      }),
      usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
    },
  };
}
