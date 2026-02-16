import Anthropic from '@anthropic-ai/sdk';
import { createLogger } from '../utils/logger';
import { ApiError, retryWithBackoff, isRetryableError } from '../utils/error-handler';

const logger = createLogger('ClaudeClient');

export interface CompletionRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  extendedThinking?: ExtendedThinkingConfig;
}

export interface ExtendedThinkingConfig {
  enabled: boolean;
  budget: 'low' | 'medium' | 'high';
  minThinkingTokens?: number;
}

export interface CompletionResponse {
  text: string;
  thinkingBlocks?: string[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export class ClaudeClient {
  private client: Anthropic;
  private defaultModel: string;
  private defaultMaxTokens: number;
  private defaultTemperature: number;

  constructor(apiKey?: string, config?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });

    this.defaultModel = config?.model || 'claude-opus-4-6';
    this.defaultMaxTokens = config?.maxTokens || 32000;
    this.defaultTemperature = config?.temperature || 1.0;

    logger.info('Claude client initialized', {
      model: this.defaultModel,
    });
  }

  /**
   * Standard completion without extended thinking
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    return this.completeWithRetry(request, false);
  }

  /**
   * Completion with extended thinking enabled
   */
  async completeWithExtendedThinking(
    request: CompletionRequest
  ): Promise<CompletionResponse> {
    if (!request.extendedThinking) {
      throw new Error('Extended thinking config required');
    }
    return this.completeWithRetry(request, true);
  }

  /**
   * Internal method with retry logic
   */
  private async completeWithRetry(
    request: CompletionRequest,
    useExtendedThinking: boolean
  ): Promise<CompletionResponse> {
    return retryWithBackoff(
      () => this.executeCompletion(request, useExtendedThinking),
      {
        maxAttempts: 3,
        initialBackoff: 2000,
        maxBackoff: 30000,
        exponentialBase: 2,
        shouldRetry: isRetryableError,
      }
    );
  }

  /**
   * Execute completion request
   */
  private async executeCompletion(
    request: CompletionRequest,
    useExtendedThinking: boolean
  ): Promise<CompletionResponse> {
    const startTime = Date.now();

    try {
      const messages: Anthropic.MessageParam[] = [
        {
          role: 'user',
          content: request.prompt,
        },
      ];

      const model = request.model || this.defaultModel;
      const maxTokens = request.maxTokens || this.defaultMaxTokens;
      const temperature = request.temperature ?? this.defaultTemperature;

      logger.debug('Sending completion request', {
        model,
        maxTokens,
        temperature,
        extendedThinking: useExtendedThinking,
      });

      const params: Anthropic.MessageCreateParams = {
        model,
        max_tokens: maxTokens,
        temperature,
        messages,
      };

      if (request.systemPrompt) {
        params.system = request.systemPrompt;
      }

      if (useExtendedThinking && request.extendedThinking) {
        // Extended thinking support (casting as it may not be in current types)
        (params as any).thinking = {
          type: 'enabled',
          budget_tokens: this.getThinkingBudget(request.extendedThinking),
        };
      }

      const response = await this.client.messages.create(params);

      const duration = Date.now() - startTime;

      logger.info('Completion successful', {
        duration,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      });

      return this.parseResponse(response);
    } catch (error: any) {
      logger.error('Completion failed', error);

      if (error.status) {
        throw new ApiError(
          `Claude API error: ${error.message}`,
          {
            statusCode: error.status,
            type: error.type,
          }
        );
      }

      throw error;
    }
  }

  /**
   * Parse Claude API response
   */
  private parseResponse(
    response: Anthropic.Message
  ): CompletionResponse {
    const thinkingBlocks: string[] = [];
    const textBlocks: string[] = [];

    for (const block of response.content) {
      // Check for thinking blocks (may not be in current type definitions)
      if ((block as any).type === 'thinking') {
        thinkingBlocks.push((block as any).thinking);
      } else if (block.type === 'text') {
        textBlocks.push(block.text);
      }
    }

    return {
      text: textBlocks.join('\n'),
      thinkingBlocks:
        thinkingBlocks.length > 0 ? thinkingBlocks : undefined,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens:
          response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  /**
   * Get thinking token budget based on configuration
   */
  private getThinkingBudget(config: ExtendedThinkingConfig): number {
    const budgets = {
      low: 2000,
      medium: 5000,
      high: 10000,
    };

    return budgets[config.budget] || budgets.medium;
  }

  /**
   * Extract thinking blocks from response
   */
  parseThinkingBlocks(response: CompletionResponse): string[] {
    return response.thinkingBlocks || [];
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      logger.info('Testing Claude API connection');

      await this.complete({
        prompt: 'Hello',
        maxTokens: 10,
      });

      logger.info('API connection successful');
      return true;
    } catch (error) {
      logger.error('API connection failed', error as Error);
      return false;
    }
  }
}

/**
 * Create Claude client with environment config
 */
export function createClaudeClient(config?: {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): ClaudeClient {
  return new ClaudeClient(config?.apiKey, {
    model: config?.model,
    maxTokens: config?.maxTokens,
    temperature: config?.temperature,
  });
}
