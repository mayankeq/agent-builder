# Extending Agent-Builder

This guide shows how to extend the agent-builder with new capabilities.

## Adding a New Agent Type

Create a new agent by extending `BaseAgent`:

```typescript
import { BaseAgent } from './base-agent';
import { WorkflowContext, WorkflowPhase } from '../types/workflow';
import { AgentConfig, AgentResult } from '../types/agent';
import { ClaudeClient } from '../claude/claude-client';

export class CustomAgent extends BaseAgent {
  private claudeClient: ClaudeClient;

  constructor(config: AgentConfig, claudeClient: ClaudeClient) {
    super(config);
    this.claudeClient = claudeClient;
  }

  getName(): string {
    return 'CustomAgent';
  }

  getPhase(): WorkflowPhase {
    return 'implementation'; // or your custom phase
  }

  async execute(context: WorkflowContext): Promise<AgentResult> {
    this.validateContext(context);
    this.startExecution();

    try {
      // Your agent logic here
      const result = await this.doWork(context);

      this.endExecution(true);

      return {
        type: 'custom_complete',
        data: result,
        nextPhase: 'packaging',
      };
    } catch (error) {
      this.endExecution(false, error as Error);
      throw error;
    }
  }

  private async doWork(context: WorkflowContext): Promise<any> {
    // Implement your agent's logic
    // Call Claude API, process data, etc.
  }
}
```

Then register it in `AgentFactory`:

```typescript
// src/orchestration/agent-factory.ts
case 'custom':
  return new CustomAgent(agentConfig, this.claudeClient);
```

## Adding a New Output Format

### 1. Create Template Directory

```bash
mkdir -p templates/my-format/typescript
mkdir -p templates/my-format/python
```

### 2. Create Template Files

```handlebars
{{!-- templates/my-format/typescript/main.ts.hbs --}}
// {{name}} - {{description}}

export class {{name}} {
  constructor() {
    console.log('Hello from {{name}}');
  }

  run() {
    // Your code here
  }
}
```

### 3. Update PackagingAgent

```typescript
// src/agents/packaging-agent.ts
case 'my-format':
  return this.packageMyFormat(context);
```

### 4. Add Type Definition

```typescript
// src/types/templates.ts
export type OutputType = 'skill' | 'mcp' | 'cli' | 'library' | 'my-format';
```

## Adding Custom Templates

### Using File-Based Templates

Create `.hbs` files in `templates/` directory:

```handlebars
{{!-- templates/custom/package.json.hbs --}}
{
  "name": "{{name}}",
  "version": "{{version}}",
  "dependencies": {
    {{#each dependencies}}
    "{{name}}": "{{version}}"{{#unless @last}},{{/unless}}
    {{/each}}
  }
}
```

### Using Inline Templates

Add to `TemplateManager.getInlineTemplates()`:

```typescript
if (type === 'custom' && language === 'typescript') {
  return {
    'index.ts': `// {{name}}\nexport function main() {}\n`,
    'README.md': `# {{name}}\n\n{{description}}\n`,
  };
}
```

## Adding New Optimization Strategies

Extend `PerformanceOptimizer`:

```typescript
// src/performance/performance-optimizer.ts

private customOptimizations(): OptimizationMetric[] {
  return [
    {
      type: 'custom',
      strategy: 'your-strategy',
      impact: 'Description of what this does',
      estimatedImprovement: 0.3,
    },
  ];
}

// Then call in optimizeBasedOnPriorities()
if (priorities.customPriority === 'high') {
  optimizations.push(...this.customOptimizations());
}
```

## Adding New Validation Rules

Extend `QualityChecker`:

```typescript
// src/validation/quality-checker.ts

private checkCustomRule(filename: string, content: string): QualityIssue[] {
  const issues: QualityIssue[] = [];

  // Your validation logic
  if (someCondition) {
    issues.push({
      type: 'style',
      severity: 'medium',
      file: filename,
      message: 'Custom validation failed',
    });
  }

  return issues;
}

// Call in checkQuality()
const customIssues = this.checkCustomRule(filename, content);
issues.push(...customIssues);
```

## Adding Custom Languages

### 1. Update Type Definition

```typescript
// src/types/templates.ts
export type Language = 'typescript' | 'python' | 'go' | 'rust';
```

### 2. Create Templates

```bash
mkdir -p templates/skill/go
mkdir -p templates/mcp/go
# etc.
```

### 3. Add Validation

```typescript
// src/validation/code-validator.ts

private validateGo(filename: string, content: string): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  // Go validation logic
}

// Add to validateCode()
else if (language === 'go' && filename.endsWith('.go')) {
  const goResult = this.validateGo(filename, content);
  errors.push(...goResult.errors);
  warnings.push(...goResult.warnings);
}
```

## Adding System Prompts

Add new prompt in `prompt-templates.ts`:

```typescript
// src/claude/prompt-templates.ts

export const CUSTOM_SYSTEM_PROMPT = `
You are an expert in custom agent development.

Your role:
1. Analyze requirements
2. Generate specialized code
3. Follow best practices

Return output as JSON...
`;

// Update getSystemPrompt()
case 'custom':
  return CUSTOM_SYSTEM_PROMPT;
```

## Adding Memory Features

Extend `MemoryManager` with custom storage:

```typescript
// src/memory/memory-manager.ts

async storeCustomData(data: CustomData): Promise<void> {
  const filePath = path.join(
    this.storageDir,
    'custom',
    `${data.id}.json`
  );

  await FileManager.writeJSON(filePath, data);
  this.logger.info('Custom data stored', { id: data.id });
}

async loadCustomData(id: string): Promise<CustomData | null> {
  const filePath = path.join(
    this.storageDir,
    'custom',
    `${id}.json`
  );

  if (await FileManager.exists(filePath)) {
    return await FileManager.readJSON<CustomData>(filePath);
  }

  return null;
}
```

## Adding CLI Commands

Add new command in CLI entry point:

```typescript
// src/index.ts

.command(
  'analyze <sessionId>',
  'Analyze a session',
  (yargs) => {
    return yargs.positional('sessionId', {
      type: 'string',
      describe: 'Session ID to analyze',
      demandOption: true,
    });
  },
  async (argv) => {
    await controller.analyzeCommand(argv.sessionId as string);
  }
)
```

Then implement in `CLIController`:

```typescript
// src/cli/cli-controller.ts

async analyzeCommand(sessionId: string): Promise<void> {
  try {
    console.log(chalk.bold.blue(`\n📊 Analyzing session: ${sessionId}\n`));

    // Your analysis logic

  } catch (error) {
    logger.error('Analyze command failed', error as Error);
    console.error(chalk.red(`\n✗ Error: ${(error as Error).message}\n`));
    process.exit(1);
  }
}
```

## Testing Extensions

Create tests for your extensions:

```typescript
// tests/custom-agent.test.ts

import { describe, it, expect } from 'vitest';
import { CustomAgent } from '../src/agents/custom-agent';

describe('CustomAgent', () => {
  it('should execute successfully', async () => {
    const agent = new CustomAgent({}, mockClaudeClient);
    const result = await agent.execute(mockContext);

    expect(result.type).toBe('custom_complete');
  });
});
```

## Configuration Extensions

Add custom config sections:

```yaml
# config/agent-builder.config.yaml

custom:
  enabled: true
  strategy: 'advanced'
  options:
    feature1: true
    feature2: false
```

Load in ConfigManager:

```typescript
// src/cli/config-manager.ts

export interface BuilderConfig {
  // existing fields...
  custom?: {
    enabled?: boolean;
    strategy?: string;
    options?: Record<string, any>;
  };
}
```

## Contributing Guidelines

1. **Code Style**: Follow existing TypeScript conventions
2. **Testing**: Add tests for new features
3. **Documentation**: Update relevant docs
4. **Types**: Maintain type safety throughout
5. **Logging**: Use structured logging with appropriate levels
6. **Error Handling**: Implement proper error handling and retry logic

## Best Practices

- Extend existing classes rather than modifying them
- Use dependency injection for testability
- Follow the established patterns (BaseAgent, etc.)
- Add comprehensive error handling
- Write clear documentation
- Include usage examples
