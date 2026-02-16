import { BaseAgent } from './base-agent';
import { WorkflowContext, WorkflowPhase, Design, Implementation } from '../types/workflow';
import { AgentConfig, AgentResult } from '../types/agent';
import { ClaudeClient } from '../claude/claude-client';
import { getSystemPrompt } from '../claude/prompt-templates';
import { parseDocs } from '../claude/response-parser';

/**
 * Documentation Agent - Generates comprehensive documentation
 * Creates README, API docs, and usage examples
 */
export class DocumentationAgent extends BaseAgent {
  private claudeClient: ClaudeClient;

  constructor(config: AgentConfig, claudeClient: ClaudeClient) {
    super(config);
    this.claudeClient = claudeClient;
  }

  getName(): string {
    return 'DocumentationAgent';
  }

  getPhase(): WorkflowPhase {
    return 'implementation'; // Runs during implementation phase
  }

  async execute(context: WorkflowContext): Promise<AgentResult> {
    this.validateContext(context);
    this.startExecution();

    try {
      if (!context.design || !context.implementation) {
        throw new Error('Design and implementation must be available for documentation');
      }

      this.logProgress('Starting documentation generation');

      const docs = await this.generateDocumentation(
        context.design,
        context.implementation,
        context
      );

      this.logProgress('Documentation generation completed', {
        docFileCount: Object.keys(docs).length,
      });

      this.endExecution(true);

      return {
        type: 'documentation_complete',
        data: { docs },
        nextPhase: 'implementation',
      };
    } catch (error) {
      this.endExecution(false, error as Error);
      throw error;
    }
  }

  /**
   * Generate documentation
   */
  private async generateDocumentation(
    design: Design,
    implementation: Implementation,
    context: WorkflowContext
  ): Promise<Record<string, string>> {
    const prompt = this.buildDocumentationPrompt(design, implementation, context);

    this.logProgress('Requesting documentation from Claude');

    const response = await this.claudeClient.complete({
      prompt,
      systemPrompt: getSystemPrompt('documentation'),
      model: this.config.model,
      maxTokens: this.config.maxTokens || 12000,
    });

    const docs = parseDocs(response.text);

    return docs;
  }

  /**
   * Build documentation prompt
   */
  private buildDocumentationPrompt(
    design: Design,
    implementation: Implementation,
    context: WorkflowContext
  ): string {
    const requirements = context.requirements!;
    const language = requirements.output.language || 'typescript';

    return `
# Documentation Generation Task

## Project Overview
User Request: ${context.userRequest}
Language: ${language}
Output Type: ${requirements.output.type}

## Design
${JSON.stringify(design, null, 2)}

## Implementation Files
${Object.keys(implementation.code).join(', ')}

## Components
${design.components.map(c => `
### ${c.name} (${c.type})
${c.description}
`).join('\n')}

## Documentation Requirements

Generate comprehensive documentation including:

### 1. README.md
- Project title and description
- Key features (based on functional requirements)
- Installation instructions
- Quick start guide with code examples
- Configuration options
- Usage examples
- Troubleshooting section
- Links to additional docs

### 2. API.md (if applicable)
- Function/class signatures
- Parameter descriptions with types
- Return values
- Usage examples for each API
- Error cases and handling

### 3. EXAMPLES.md
- Real-world usage scenarios
- Code snippets that work
- Expected outputs
- Common patterns

Return documentation as a JSON object:
{
  "README.md": "...",
  "docs/API.md": "...",
  "docs/EXAMPLES.md": "..."
}

Documentation style:
- Clear, concise language
- Code examples that actually work
- Progressive disclosure (simple first, advanced later)
- Explain the "why" not just the "what"
- Use Markdown formatting
- Include table of contents for longer docs
`;
  }
}
