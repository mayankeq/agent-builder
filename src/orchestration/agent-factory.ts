import { AgentConfig, IAgent } from '../types/agent';
import { ClaudeClient } from '../claude/claude-client';
import { createLogger } from '../utils/logger';
import {
  ResearchAgent,
  ClarificationAgent,
  DesignAgent,
  ImplementationAgent,
  TestingAgent,
  DocumentationAgent,
  PackagingAgent,
  DeployAgent,
} from '../agents';

const logger = createLogger('AgentFactory');

/**
 * Agent Factory - Creates and configures agent instances
 * Provides dependency injection for agents
 */
export class AgentFactory {
  private claudeClient: ClaudeClient;
  private defaultConfig: AgentConfig;

  constructor(claudeClient: ClaudeClient, defaultConfig?: AgentConfig) {
    this.claudeClient = claudeClient;
    this.defaultConfig = defaultConfig || {
      timeout: 300000, // 5 minutes
      maxRetries: 3,
      retryBackoff: 2000,
    };

    logger.info('Agent factory initialized');
  }

  /**
   * Create agent by type
   */
  create(type: string, config?: AgentConfig): IAgent {
    const agentConfig = { ...this.defaultConfig, ...config };

    logger.debug(`Creating agent: ${type}`, agentConfig);

    switch (type) {
      case 'research':
        return new ResearchAgent(agentConfig, this.claudeClient);

      case 'clarification':
        return new ClarificationAgent(agentConfig, this.claudeClient);

      case 'design':
        return new DesignAgent(agentConfig, this.claudeClient);

      case 'implementation':
        return new ImplementationAgent(agentConfig, this.claudeClient);

      case 'testing':
        return new TestingAgent(agentConfig, this.claudeClient);

      case 'documentation':
        return new DocumentationAgent(agentConfig, this.claudeClient);

      case 'packaging':
        return new PackagingAgent(agentConfig, this.claudeClient);

      case 'deploy':
        return new DeployAgent(agentConfig);

      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }

  /**
   * Create multiple agents
   */
  createMany(types: string[], config?: AgentConfig): IAgent[] {
    return types.map(type => this.create(type, config));
  }

  /**
   * Update default configuration
   */
  setDefaultConfig(config: Partial<AgentConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
    logger.info('Default agent config updated', this.defaultConfig);
  }

  /**
   * Get Claude client (for testing/debugging)
   */
  getClaudeClient(): ClaudeClient {
    return this.claudeClient;
  }
}
