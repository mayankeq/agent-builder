import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { logger } from '../monitoring/logger';

export type LLMProvider = 'claude' | 'openai' | 'azure-openai' | 'gemini';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMResponse {
  content: string;
  thinking?: string; // For extended thinking (Claude only)
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Abstract LLM client interface
 */
export abstract class LLMClient {
  protected config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  abstract sendMessage(
    messages: LLMMessage[],
    options?: {
      extendedThinking?: boolean;
      thinkingBudget?: 'low' | 'medium' | 'high';
    }
  ): Promise<LLMResponse>;

  abstract isAvailable(): boolean;
}

/**
 * Claude (Anthropic) client
 */
export class ClaudeClient extends LLMClient {
  private client: Anthropic;

  constructor(config: LLMConfig) {
    super(config);
    this.client = new Anthropic({ apiKey: config.apiKey });
  }

  async sendMessage(
    messages: LLMMessage[],
    options?: {
      extendedThinking?: boolean;
      thinkingBudget?: 'low' | 'medium' | 'high';
    }
  ): Promise<LLMResponse> {
    try {
      const params: any = {
        model: this.config.model || 'claude-sonnet-4-5-20250929',
        max_tokens: this.config.maxTokens || 16000,
        temperature: this.config.temperature || 1.0,
        messages: messages.map(m => ({
          role: m.role === 'system' ? 'user' : m.role,
          content: m.content,
        })),
      };

      // Add extended thinking if requested
      if (options?.extendedThinking) {
        const budgetTokens = {
          low: 2000,
          medium: 5000,
          high: 10000,
        }[options.thinkingBudget || 'medium'];

        (params as any).thinking = {
          type: 'enabled',
          budget_tokens: budgetTokens,
        };
      }

      const response = await this.client.messages.create(params);

      // Extract thinking if present
      let thinking: string | undefined;
      let content = '';

      for (const block of response.content) {
        if (block.type === 'thinking') {
          thinking = (block as any).thinking;
        } else if (block.type === 'text') {
          content += block.text;
        }
      }

      return {
        content,
        thinking,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      logger.error('Claude API error', { error });
      throw error;
    }
  }

  isAvailable(): boolean {
    return !!this.config.apiKey;
  }
}

/**
 * OpenAI (ChatGPT) client
 */
export class OpenAIClient extends LLMClient {
  private client: OpenAI;

  constructor(config: LLMConfig) {
    super(config);
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  async sendMessage(
    messages: LLMMessage[],
    options?: {
      extendedThinking?: boolean;
      thinkingBudget?: 'low' | 'medium' | 'high';
    }
  ): Promise<LLMResponse> {
    try {
      // OpenAI doesn't support extended thinking like Claude
      // But we can use system prompts to encourage reasoning
      let systemPrompt = '';
      if (options?.extendedThinking) {
        systemPrompt = 'Think step by step and reason through your approach before providing the final answer.';
      }

      const openaiMessages = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      if (systemPrompt) {
        openaiMessages.unshift({
          role: 'system',
          content: systemPrompt,
        });
      }

      const response = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4-turbo-preview',
        messages: openaiMessages as any,
        max_tokens: this.config.maxTokens || 16000,
        temperature: this.config.temperature || 1.0,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        content,
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
        },
      };
    } catch (error) {
      logger.error('OpenAI API error', { error });
      throw error;
    }
  }

  isAvailable(): boolean {
    return !!this.config.apiKey;
  }
}

/**
 * Azure OpenAI client
 */
export class AzureOpenAIClient extends LLMClient {
  private client: OpenAI;

  constructor(config: LLMConfig & { endpoint?: string; deployment?: string }) {
    super(config);

    const endpoint = (config as any).endpoint || process.env.AZURE_OPENAI_ENDPOINT;
    const deployment = (config as any).deployment || process.env.AZURE_OPENAI_DEPLOYMENT;

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: `${endpoint}/openai/deployments/${deployment}`,
      defaultQuery: { 'api-version': '2024-02-15-preview' },
      defaultHeaders: { 'api-key': config.apiKey },
    });
  }

  async sendMessage(
    messages: LLMMessage[],
    options?: {
      extendedThinking?: boolean;
      thinkingBudget?: 'low' | 'medium' | 'high';
    }
  ): Promise<LLMResponse> {
    // Same as OpenAI
    const openaiClient = new OpenAIClient(this.config);
    return openaiClient.sendMessage(messages, options);
  }

  isAvailable(): boolean {
    return !!this.config.apiKey && !!process.env.AZURE_OPENAI_ENDPOINT;
  }
}

/**
 * Google Gemini client (placeholder)
 */
export class GeminiClient extends LLMClient {
  constructor(config: LLMConfig) {
    super(config);
  }

  async sendMessage(
    messages: LLMMessage[],
    options?: {
      extendedThinking?: boolean;
      thinkingBudget?: 'low' | 'medium' | 'high';
    }
  ): Promise<LLMResponse> {
    // TODO: Implement Gemini API integration
    throw new Error('Gemini support not yet implemented');
  }

  isAvailable(): boolean {
    return false;
  }
}

/**
 * LLM Factory - Create appropriate client based on provider
 */
export class LLMFactory {
  static createClient(config: LLMConfig): LLMClient {
    switch (config.provider) {
      case 'claude':
        return new ClaudeClient(config);

      case 'openai':
        return new OpenAIClient(config);

      case 'azure-openai':
        return new AzureOpenAIClient(config);

      case 'gemini':
        return new GeminiClient(config);

      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }

  /**
   * Get all available providers for a user
   */
  static getAvailableProviders(apiKeys: Record<LLMProvider, string | undefined>): LLMProvider[] {
    const available: LLMProvider[] = [];

    if (apiKeys.claude) available.push('claude');
    if (apiKeys.openai) available.push('openai');
    if (apiKeys['azure-openai']) available.push('azure-openai');
    if (apiKeys.gemini) available.push('gemini');

    return available;
  }

  /**
   * Get recommended model for each provider
   */
  static getRecommendedModel(provider: LLMProvider): string {
    const models = {
      claude: 'claude-sonnet-4-5-20250929',
      openai: 'gpt-4-turbo-preview',
      'azure-openai': 'gpt-4',
      gemini: 'gemini-pro',
    };

    return models[provider];
  }

  /**
   * Estimate cost per agent for each provider
   */
  static estimateCost(provider: LLMProvider, tokens: number = 40000): number {
    // Approximate costs (input + output average)
    const costPer1MTokens = {
      claude: 6.00, // $3 input + $15 output (blended)
      openai: 30.00, // GPT-4 Turbo
      'azure-openai': 30.00,
      gemini: 2.00, // Gemini Pro
    };

    return (tokens / 1_000_000) * costPer1MTokens[provider];
  }
}
