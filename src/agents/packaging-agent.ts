import { BaseAgent } from './base-agent';
import { WorkflowContext, WorkflowPhase, Design, Implementation } from '../types/workflow';
import { AgentConfig, AgentResult } from '../types/agent';
import { ClaudeClient } from '../claude/claude-client';
import { getSystemPrompt } from '../claude/prompt-templates';
import { parsePackageConfig } from '../claude/response-parser';

/**
 * Packaging Agent - Creates distributable artifacts
 * Packages based on output type (skill, MCP server, CLI, library)
 */
export class PackagingAgent extends BaseAgent {
  private claudeClient: ClaudeClient;

  constructor(config: AgentConfig, claudeClient: ClaudeClient) {
    super(config);
    this.claudeClient = claudeClient;
  }

  getName(): string {
    return 'PackagingAgent';
  }

  getPhase(): WorkflowPhase {
    return 'packaging';
  }

  async execute(context: WorkflowContext): Promise<AgentResult> {
    this.validateContext(context);
    this.startExecution();

    try {
      if (!context.design || !context.implementation) {
        throw new Error('Design and implementation must be available for packaging');
      }

      const outputType = context.requirements?.output?.type || 'skill';

      this.logProgress(`Packaging as ${outputType}`);

      const packageConfig = await this.createPackage(
        outputType,
        context.design,
        context.implementation,
        context
      );

      this.logProgress('Packaging completed', {
        configFileCount: Object.keys(packageConfig).length,
      });

      this.endExecution(true);

      return {
        type: 'packaging_complete',
        data: { packageConfig },
        nextPhase: 'learning',
      };
    } catch (error) {
      this.endExecution(false, error as Error);
      throw error;
    }
  }

  /**
   * Create package configuration
   */
  private async createPackage(
    outputType: string,
    design: Design,
    implementation: Implementation,
    context: WorkflowContext
  ): Promise<Record<string, string>> {
    const prompt = this.buildPackagingPrompt(outputType, design, implementation, context);

    this.logProgress('Requesting package configuration from Claude');

    const response = await this.claudeClient.complete({
      prompt,
      systemPrompt: getSystemPrompt('packaging'),
      model: this.config.model,
      maxTokens: this.config.maxTokens || 8000,
    });

    const packageConfig = parsePackageConfig(response.text);

    return packageConfig;
  }

  /**
   * Build packaging prompt
   */
  private buildPackagingPrompt(
    outputType: string,
    design: Design,
    implementation: Implementation,
    context: WorkflowContext
  ): string {
    const requirements = context.requirements!;
    const language = requirements.output.language || 'typescript';

    return `
# Packaging Task

## Output Type
${outputType}

## Language
${language}

## Design
${JSON.stringify(design, null, 2)}

## Implementation Files
${Object.keys(implementation.code).join('\n')}

## Dependencies
${design.techStack.map(t => `- ${t.name}@${t.version || 'latest'}`).join('\n')}

## Packaging Instructions

${this.getPackagingInstructions(outputType, language)}

Return package configuration files as a JSON object mapping file paths to contents:
${this.getRequiredFiles(outputType, language)}

Ensure:
- Dependencies are correctly specified
- Entry points are properly configured
- Scripts for build/test/start are included
- README has installation instructions
- Version and metadata are set
`;
  }

  private getPackagingInstructions(outputType: string, _language: string): string {
    switch (outputType) {
      case 'skill':
        return `
Create a Claude Code skill with:
1. skill.yaml manifest with name, description, invocation pattern
2. Proper skill structure following Claude Code conventions
3. Entry point script
4. Dependencies listed
5. README with installation and usage
`;

      case 'mcp':
        return `
Create an MCP server with:
1. Follow @modelcontextprotocol/sdk patterns
2. Stdio transport setup
3. Proper bin entry in package.json (for TypeScript) or setup.py (for Python)
4. Shebang in entry file (#!/usr/bin/env node or #!/usr/bin/env python3)
5. README with MCP server registration instructions
`;

      case 'cli':
        return `
Create a standalone CLI with:
1. Command-line interface using yargs (TypeScript) or click (Python)
2. Help text and usage information
3. Proper argument parsing
4. bin entry for global installation
5. Installation and usage instructions in README
`;

      case 'library':
        return `
Create a library/package with:
1. Proper module exports
2. TypeScript declarations (if TypeScript)
3. Version and metadata
4. Peer dependencies if applicable
5. Usage examples in README
6. API documentation
`;

      default:
        return 'Create appropriate package configuration';
    }
  }

  private getRequiredFiles(outputType: string, language: string): string {
    const isTypeScript = language === 'typescript';

    const base = isTypeScript
      ? '{\n  "package.json": "...",\n  "tsconfig.json": "...",\n  "README.md": "..."\n}'
      : '{\n  "setup.py": "...",\n  "requirements.txt": "...",\n  "README.md": "..."\n}';

    if (outputType === 'skill') {
      return base.replace('}', ',\n  "skill.yaml": "..."\n}');
    }

    return base;
  }
}
