import { BaseAgent } from './base-agent';
import { WorkflowContext, WorkflowPhase, Design, Implementation } from '../types/workflow';
import { AgentConfig, AgentResult } from '../types/agent';
import { ClaudeClient } from '../claude/claude-client';
import { getSystemPrompt } from '../claude/prompt-templates';
import { parseTests } from '../claude/response-parser';

/**
 * Testing Agent - Generates comprehensive tests
 * Creates unit and integration tests for the implementation
 */
export class TestingAgent extends BaseAgent {
  private claudeClient: ClaudeClient;

  constructor(config: AgentConfig, claudeClient: ClaudeClient) {
    super(config);
    this.claudeClient = claudeClient;
  }

  getName(): string {
    return 'TestingAgent';
  }

  getPhase(): WorkflowPhase {
    return 'implementation'; // Runs during implementation phase
  }

  async execute(context: WorkflowContext): Promise<AgentResult> {
    this.validateContext(context);
    this.startExecution();

    try {
      if (!context.design || !context.implementation) {
        throw new Error('Design and implementation must be available for testing');
      }

      this.logProgress('Starting test generation');

      const tests = await this.generateTests(
        context.design,
        context.implementation,
        context
      );

      this.logProgress('Test generation completed', {
        testFileCount: Object.keys(tests).length,
      });

      this.endExecution(true);

      return {
        type: 'testing_complete',
        data: { tests },
        nextPhase: 'implementation',
      };
    } catch (error) {
      this.endExecution(false, error as Error);
      throw error;
    }
  }

  /**
   * Generate tests from design and implementation
   */
  private async generateTests(
    design: Design,
    implementation: Implementation,
    context: WorkflowContext
  ): Promise<Record<string, string>> {
    const prompt = this.buildTestingPrompt(design, implementation, context);

    this.logProgress('Requesting tests from Claude');

    const response = await this.claudeClient.complete({
      prompt,
      systemPrompt: getSystemPrompt('testing'),
      model: this.config.model,
      maxTokens: this.config.maxTokens || 12000,
    });

    const tests = parseTests(response.text);

    return tests;
  }

  /**
   * Build testing prompt
   */
  private buildTestingPrompt(
    design: Design,
    implementation: Implementation,
    context: WorkflowContext
  ): string {
    const requirements = context.requirements!;
    const language = requirements.output.language || 'typescript';
    const testFramework = language === 'typescript' ? 'vitest' : 'pytest';

    return `
# Test Generation Task

## Design
${JSON.stringify(design, null, 2)}

## Code Implementation
${Object.entries(implementation.code).map(([path, content]) => `
### ${path}
\`\`\`${language}
${content.substring(0, 500)}${content.length > 500 ? '...' : ''}
\`\`\`
`).join('\n')}

## Testing Requirements
- Language: ${language}
- Framework: ${testFramework}
- Trust Priority: ${requirements.performance.trust || 'medium'}

## Test Coverage Goals
${this.getTestCoverageGoals(requirements.performance.trust)}

## Components to Test
${design.components.map(c => `
### ${c.name}
- Type: ${c.type}
- Responsibilities: ${c.responsibilities.join(', ')}
- Test focus: ${this.getTestFocus(c)}
`).join('\n')}

## Test Generation Guidelines

1. **Generate comprehensive tests** covering happy paths and edge cases
2. **Use ${testFramework}** testing framework
3. **Test behavior, not implementation**
4. **Clear test names** that describe what is being tested
5. **Mock external dependencies** appropriately
6. **Include both unit and integration tests**

Return tests as a JSON object mapping test file paths to contents:
{
  "tests/unit/component.test.${language === 'typescript' ? 'ts' : 'py'}": "...",
  "tests/integration/workflow.test.${language === 'typescript' ? 'ts' : 'py'}": "..."
}

Test categories:
- Unit tests: Test individual functions/classes in isolation
- Integration tests: Test component interactions
- Error tests: Test error handling and edge cases
`;
  }

  private getTestCoverageGoals(trust?: string): string {
    switch (trust) {
      case 'high':
        return '- Aim for >80% code coverage\n- Include edge cases and error paths\n- Test all public APIs\n- Integration tests for workflows';
      case 'medium':
        return '- Aim for >60% code coverage\n- Test main functionality\n- Basic error handling tests';
      case 'low':
        return '- Basic test coverage\n- Test critical paths only';
      default:
        return '- Standard test coverage\n- Test main functionality and error cases';
    }
  }

  private getTestFocus(component: any): string {
    if (component.type === 'class') {
      return 'Test all public methods, constructor, and state management';
    } else if (component.type === 'function') {
      return 'Test input validation, output correctness, and error cases';
    } else if (component.type === 'module') {
      return 'Test exported functionality and module integration';
    }
    return 'Test component behavior and integration';
  }
}
