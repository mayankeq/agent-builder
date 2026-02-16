import { parse as parseYaml } from 'yaml';
import { FileManager } from '../utils/file-manager';
import { createLogger } from '../utils/logger';
import * as path from 'path';

const logger = createLogger('ConfigManager');

export interface BuilderConfig {
  version?: string;
  claude?: {
    model?: string;
    max_tokens?: number;
    temperature?: number;
    extended_thinking?: {
      enabled?: boolean;
      budget?: string;
    };
  };
  workflow?: any;
  parallelism?: any;
  retry?: any;
  memory?: any;
  performance?: any;
  templates?: any;
  validation?: any;
  logging?: any;
}

/**
 * Config Manager - Handles configuration loading and merging
 */
export class ConfigManager {
  // Default config path available for future use
  // private defaultConfigPath = './config/agent-builder.config.yaml';

  /**
   * Load configuration from file or use defaults
   */
  async loadConfig(userProvidedPath?: string): Promise<BuilderConfig> {
    try {
      // Discover config file
      const configPath = userProvidedPath || this.discoverConfig();

      if (!configPath) {
        logger.info('Using default configuration');
        return this.getDefaultConfig();
      }

      logger.info(`Loading config from: ${configPath}`);

      const configContent = await FileManager.readFile(configPath);
      const config = parseYaml(configContent) as BuilderConfig;

      // Merge with defaults
      return this.mergeWithDefaults(config);
    } catch (error) {
      logger.warning('Failed to load config, using defaults', {
        error: (error as Error).message,
      });
      return this.getDefaultConfig();
    }
  }

  /**
   * Auto-discover config file
   */
  private discoverConfig(): string | null {
    const candidates = [
      '.agent-builder.yaml',
      '.agent-builder.yml',
      'agent-builder.config.yaml',
      'agent-builder.config.yml',
    ];

    for (const candidate of candidates) {
      const fullPath = path.join(process.cwd(), candidate);

      try {
        // Synchronous check for simplicity
        if (require('fs').existsSync(fullPath)) {
          return fullPath;
        }
      } catch {
        // Continue checking
      }
    }

    return null;
  }

  /**
   * Merge user config with defaults
   */
  private mergeWithDefaults(config: BuilderConfig): BuilderConfig {
    const defaults = this.getDefaultConfig();

    return {
      ...defaults,
      ...config,
      claude: { ...defaults.claude, ...config.claude },
      workflow: { ...defaults.workflow, ...config.workflow },
      parallelism: { ...defaults.parallelism, ...config.parallelism },
    };
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): BuilderConfig {
    return {
      version: '1.0',
      claude: {
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 16000,
        temperature: 1.0,
        extended_thinking: {
          enabled: true,
          budget: 'high',
        },
      },
      workflow: {
        clarification: {
          max_rounds: 3,
          timeout: 300000,
        },
        design: {
          timeout: 600000,
          enable_extended_thinking: true,
        },
        implementation: {
          timeout: 900000,
          parallelization: true,
        },
      },
      parallelism: {
        max_agents_parallel: 3,
      },
      performance: {
        speed: 'medium',
        quality: 'high',
        trust: 'high',
        budget: 'medium',
      },
    };
  }
}
