import chalk from 'chalk';
import { createLogger } from '../utils/logger';
import { ConfigManager } from './config-manager';
import { InteractiveMode } from './interactive-mode';
import { WorkflowCoordinator } from '../orchestration/workflow-coordinator';
import { AgentFactory } from '../orchestration/agent-factory';
import { createClaudeClient } from '../claude/claude-client';
import { BuildOptions } from '../types/workflow';

const logger = createLogger('CLIController');

interface CreateCommandArgs {
  description?: string;
  output?: string;
  language?: string;
  config?: string;
  interactive?: boolean;
  existingAgentsDir?: string;
}

/**
 * CLI Controller - Handles all CLI commands
 */
export class CLIController {
  private configManager: ConfigManager;
  private interactive: InteractiveMode;

  constructor() {
    this.configManager = new ConfigManager();
    this.interactive = new InteractiveMode();
  }

  /**
   * Handle 'create' command
   */
  async createCommand(args: CreateCommandArgs): Promise<void> {
    try {
      console.log(chalk.bold.blue('\n🤖 Agent Builder\n'));

      // Load configuration
      const config = await this.configManager.loadConfig(args.config);

      // Get user request
      let userRequest = args.description || '';

      if (!userRequest && args.interactive) {
        userRequest = await this.interactive.askUserRequest();
      }

      if (!userRequest) {
        console.error(chalk.red('Error: Agent description is required'));
        process.exit(1);
      }

      // Build options
      const options: BuildOptions = {
        outputType: args.output as any,
        language: args.language as any,
        interactive: args.interactive !== false,
        existingAgentsDir: args.existingAgentsDir,
      };

      console.log(chalk.gray(`\nBuilding agent: ${userRequest}\n`));

      // Create Claude client and workflow coordinator
      const claudeClient = createClaudeClient({
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: config.claude?.model,
        maxTokens: config.claude?.max_tokens,
      });

      const agentFactory = new AgentFactory(claudeClient);
      const coordinator = new WorkflowCoordinator(agentFactory);

      // Build the agent
      const result = await coordinator.buildAgent(userRequest, options);

      // Display results
      console.log(chalk.green.bold('\n✓ Agent created successfully!\n'));
      console.log(chalk.gray(`Session ID: ${result.sessionId}`));
      console.log(chalk.gray(`Output directory: ${result.outputDir}`));
      console.log(chalk.gray(`Total duration: ${result.metrics.totalDuration}ms\n`));

      // Show generated files
      const fileCount = Object.keys(result.artifacts).length;
      console.log(chalk.blue(`Generated ${fileCount} files:`));

      Object.keys(result.artifacts).forEach((file, index) => {
        if (index < 10) {
          // Show first 10 files
          console.log(chalk.gray(`  - ${file}`));
        }
      });

      if (fileCount > 10) {
        console.log(chalk.gray(`  ... and ${fileCount - 10} more`));
      }

      console.log('');
    } catch (error) {
      logger.error('Create command failed', error as Error);
      console.error(chalk.red(`\n✗ Error: ${(error as Error).message}\n`));
      process.exit(1);
    }
  }

  /**
   * Handle 'list' command
   */
  async listCommand(): Promise<void> {
    try {
      console.log(chalk.bold.blue('\n📋 Sessions\n'));

      // TODO: Implement session listing from memory
      console.log(chalk.gray('No sessions found (storage not yet implemented)'));
      console.log('');
    } catch (error) {
      logger.error('List command failed', error as Error);
      console.error(chalk.red(`\n✗ Error: ${(error as Error).message}\n`));
      process.exit(1);
    }
  }

  /**
   * Handle 'show' command
   */
  async showCommand(sessionId: string): Promise<void> {
    try {
      console.log(chalk.bold.blue(`\n📊 Session: ${sessionId}\n`));

      // TODO: Implement session details from memory
      console.log(chalk.gray('Session details not yet implemented'));
      console.log('');
    } catch (error) {
      logger.error('Show command failed', error as Error);
      console.error(chalk.red(`\n✗ Error: ${(error as Error).message}\n`));
      process.exit(1);
    }
  }
}
