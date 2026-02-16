# Development Guide

This guide covers the development workflow, project structure, and technical details for contributing to Agent-Builder.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Core Components](#core-components)
- [Development Workflow](#development-workflow)
- [Testing Strategy](#testing-strategy)
- [Debugging](#debugging)
- [Common Development Tasks](#common-development-tasks)
- [Performance Considerations](#performance-considerations)
- [Security Guidelines](#security-guidelines)

## Development Environment Setup

### Prerequisites

```bash
# Required
Node.js >= 18.0.0
npm >= 9.0.0
Git >= 2.30.0

# Optional (for full feature testing)
PostgreSQL >= 14.0
Docker (for containerized testing)
```

### Initial Setup

```bash
# Clone and setup
git clone https://github.com/YOUR_USERNAME/agent-builder.git
cd agent-builder

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Start development server (if working on web UI)
cd web && npm install && npm run dev
```

### Environment Variables

Create a `.env` file in the project root:

```bash
# Required for agent generation
ANTHROPIC_API_KEY=your-anthropic-api-key

# Optional - Database (for web app)
DATABASE_URL=postgresql://user:password@localhost:5432/agent_builder
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agent_builder
DB_USER=postgres
DB_PASSWORD=your-password

# Optional - Authentication (for web app)
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
AZURE_TENANT_ID=your-azure-tenant-id

# Optional - Storage (for web app)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name

# Optional - Development
NODE_ENV=development
LOG_LEVEL=debug
```

### Database Setup (for web app development)

```bash
# Create database
createdb agent_builder

# Run migrations
npm run migrate:up

# Rollback migrations (if needed)
npm run migrate:down
```

## Project Structure

```
agent-builder/
├── src/                        # TypeScript source code
│   ├── index.ts               # CLI entry point
│   ├── agents/                # Agent implementations
│   │   ├── base-agent.ts     # Abstract base agent class
│   │   ├── clarification-agent.ts
│   │   ├── design-agent.ts
│   │   ├── implementation-agent.ts
│   │   ├── documentation-agent.ts
│   │   ├── packaging-agent.ts
│   │   └── testing-agent.ts
│   ├── claude/                # Claude API integration
│   │   ├── claude-client.ts  # Main API client
│   │   └── prompt-templates.ts
│   ├── cli/                   # CLI interface
│   │   ├── cli.ts            # Command definitions
│   │   └── interactive.ts    # Interactive prompts
│   ├── memory/                # Learning and memory system
│   │   ├── memory-manager.ts # Session storage
│   │   ├── pattern-matcher.ts # Pattern recognition
│   │   └── vector-store.ts   # LanceDB integration
│   ├── orchestration/         # Workflow coordination
│   │   ├── workflow-coordinator.ts
│   │   └── semaphore.ts      # Concurrency control
│   ├── performance/           # Performance optimization
│   │   └── performance-optimizer.ts
│   ├── server/                # Web server (Express)
│   │   ├── index.ts          # Server entry point
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Express middleware
│   │   └── services/         # Business logic
│   ├── templates/             # Template system
│   │   └── template-manager.ts
│   ├── types/                 # TypeScript type definitions
│   │   ├── agent.ts
│   │   ├── config.ts
│   │   └── workflow.ts
│   ├── utils/                 # Utility functions
│   │   ├── config-loader.ts
│   │   ├── file-utils.ts
│   │   └── logger.ts
│   └── validation/            # Code validation
│       ├── code-validator.ts
│       └── quality-checker.ts
├── templates/                 # Code generation templates
│   ├── skill/                # Claude Code skills
│   │   ├── typescript/
│   │   └── python/
│   ├── mcp/                  # MCP servers
│   │   ├── typescript/
│   │   └── python/
│   ├── cli/                  # Standalone CLIs
│   │   ├── typescript/
│   │   └── python/
│   └── library/              # Reusable libraries
│       ├── typescript/
│       └── python/
├── web/                       # React web application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── config/                    # Configuration files
│   └── agent-builder.config.yaml
├── docs/                      # Documentation
├── examples/                  # Usage examples
├── data/                      # Runtime data
│   └── memory/               # Learning storage
├── scripts/                   # Build and utility scripts
│   └── migrate.js            # Database migrations
├── tests/                     # Test files
├── .github/                   # GitHub templates and workflows
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Architecture Overview

### Core Design Patterns

1. **Coordinator Pattern**: `WorkflowCoordinator` orchestrates the five-phase workflow
2. **Factory Pattern**: `AgentFactory` creates specialized agents
3. **Strategy Pattern**: `PerformanceOptimizer` applies different optimization strategies
4. **Template Method**: `BaseAgent` defines agent lifecycle hooks
5. **Observer Pattern**: Event-driven communication between components

### Five-Phase Workflow

```typescript
// Phase 1: Clarification
ClarificationAgent.execute() -> Requirements

// Phase 2: Design (with Extended Thinking)
DesignAgent.execute(requirements) -> Architecture

// Phase 3: Implementation (parallel execution)
Promise.all([
  ImplementationAgent.execute(architecture),
  TestingAgent.execute(architecture),
  DocumentationAgent.execute(architecture)
]) -> Code, Tests, Docs

// Phase 4: Packaging
PackagingAgent.execute(code, tests, docs) -> Artifact

// Phase 5: Learning
MemoryManager.storeSession(session) -> Patterns
```

### Data Flow

```
User Input
    ↓
CLI Interface (yargs)
    ↓
Workflow Coordinator
    ↓
Agent Factory → BaseAgent → Claude Client
    ↓                           ↓
Performance Optimizer    Extended Thinking API
    ↓                           ↓
Template Manager ← Code Generation
    ↓
Code Validator
    ↓
Memory System (JSONL + LanceDB)
    ↓
Output Artifact
```

## Core Components

### BaseAgent

Abstract base class for all agents with lifecycle management:

```typescript
abstract class BaseAgent {
  // Lifecycle hooks
  async beforeExecute(): Promise<void>
  abstract execute(context: WorkflowContext): Promise<any>
  async afterExecute(result: any): Promise<void>

  // Retry logic with exponential backoff
  protected async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T>

  // Timeout handling
  protected async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T>
}
```

### WorkflowCoordinator

Orchestrates the multi-phase workflow:

```typescript
class WorkflowCoordinator {
  async execute(requirements: Requirements): Promise<Artifact> {
    // Phase transitions with validation
    const phase1 = await this.runClarification(requirements)
    const phase2 = await this.runDesign(phase1)
    const phase3 = await this.runImplementation(phase2)
    const phase4 = await this.runPackaging(phase3)
    await this.runLearning(phase4)

    return phase4.artifact
  }

  // Parallel execution with semaphore control
  private async runParallel<T>(
    tasks: Array<() => Promise<T>>,
    concurrency: number = 3
  ): Promise<T[]>
}
```

### ClaudeClient

Handles Claude API communication:

```typescript
class ClaudeClient {
  // Standard completion
  async complete(
    prompt: string,
    options?: CompletionOptions
  ): Promise<string>

  // Extended thinking (design phase)
  async completeWithThinking(
    prompt: string,
    budgetTokens: number = 10000
  ): Promise<{ response: string; thinking: string }>

  // Streaming for long responses
  async stream(
    prompt: string,
    onChunk: (chunk: string) => void
  ): Promise<void>
}
```

### MemoryManager

Manages learning and pattern recognition:

```typescript
class MemoryManager {
  // Store session data
  async storeSession(session: Session): Promise<void>

  // Find similar patterns using vector search
  async findSimilarPatterns(
    requirements: Requirements,
    threshold: number = 0.7
  ): Promise<Pattern[]>

  // Extract patterns from successful sessions
  async extractPatterns(
    sessions: Session[]
  ): Promise<Pattern[]>
}
```

### TemplateManager

Handles code generation templates:

```typescript
class TemplateManager {
  // Render template with data
  async render(
    templatePath: string,
    data: TemplateData
  ): Promise<string>

  // Get template for specific format/language
  getTemplate(
    format: OutputFormat,
    language: Language
  ): Template

  // Fallback to inline templates if file missing
  private getFallbackTemplate(
    format: OutputFormat,
    language: Language
  ): string
}
```

## Development Workflow

### Branch Strategy

```bash
# Feature development
git checkout -b feature/add-new-agent-type

# Bug fixes
git checkout -b fix/clarification-timeout

# Documentation
git checkout -b docs/improve-api-reference

# Performance improvements
git checkout -b perf/optimize-vector-search
```

### Development Cycle

1. **Make changes** in TypeScript files
2. **Compile**: `npm run build` (or `npm run dev` for watch mode)
3. **Test**: `npm test` (or `npm run test:watch`)
4. **Lint**: `npm run lint` (or `npm run lint -- --fix`)
5. **Verify**: Run CLI manually to test changes
6. **Commit**: Follow conventional commit format

### Watch Mode Development

```bash
# Terminal 1: Watch TypeScript compilation
npm run dev

# Terminal 2: Watch tests
npm run test:watch

# Terminal 3: Test CLI changes
node dist/index.js create "test agent"
```

### Web App Development

```bash
# Terminal 1: Start backend server
npm run dev:server

# Terminal 2: Start frontend dev server
cd web && npm run dev

# Terminal 3: Watch database migrations (if needed)
npm run migrate:watch
```

## Testing Strategy

### Test Structure

```
tests/
├── unit/                 # Unit tests
│   ├── agents/
│   ├── claude/
│   └── utils/
├── integration/          # Integration tests
│   ├── workflow/
│   └── api/
├── e2e/                  # End-to-end tests
└── fixtures/             # Test data
```

### Writing Tests

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BaseAgent } from '../src/agents/base-agent'

describe('BaseAgent', () => {
  let agent: BaseAgent

  beforeEach(() => {
    agent = new ConcreteAgent({
      name: 'test-agent',
      timeout: 5000
    })
  })

  describe('execute', () => {
    it('should execute successfully with valid input', async () => {
      const result = await agent.execute(mockContext)
      expect(result).toBeDefined()
      expect(result.status).toBe('success')
    })

    it('should retry on transient failures', async () => {
      const executeFn = vi.fn()
        .mockRejectedValueOnce(new Error('transient'))
        .mockResolvedValueOnce({ status: 'success' })

      const result = await agent.retry(executeFn)
      expect(executeFn).toHaveBeenCalledTimes(2)
      expect(result.status).toBe('success')
    })

    it('should timeout after specified duration', async () => {
      const slowTask = () => new Promise(r => setTimeout(r, 10000))

      await expect(
        agent.withTimeout(slowTask(), 100)
      ).rejects.toThrow('timeout')
    })
  })
})
```

### Test Coverage

```bash
# Run tests with coverage
npm test -- --coverage

# View coverage report
open coverage/index.html

# Set coverage thresholds in vitest.config.ts
export default {
  test: {
    coverage: {
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80
    }
  }
}
```

### Mocking External Dependencies

```typescript
// Mock Claude API
vi.mock('../src/claude/claude-client', () => ({
  ClaudeClient: vi.fn().mockImplementation(() => ({
    complete: vi.fn().mockResolvedValue('mocked response'),
    completeWithThinking: vi.fn().mockResolvedValue({
      response: 'mocked response',
      thinking: 'mocked thinking'
    })
  }))
}))

// Mock file system
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('file contents'),
  writeFile: vi.fn().mockResolvedValue(undefined)
}))
```

## Debugging

### CLI Debugging

```bash
# Enable debug logging
export LOG_LEVEL=debug
node dist/index.js create "test agent"

# Use Node debugger
node --inspect-brk dist/index.js create "test agent"

# Chrome DevTools: chrome://inspect
```

### VSCode Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug CLI",
      "program": "${workspaceFolder}/dist/index.js",
      "args": ["create", "test agent"],
      "preLaunchTask": "npm: build",
      "env": {
        "ANTHROPIC_API_KEY": "your-key-here",
        "LOG_LEVEL": "debug"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--no-coverage"],
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "program": "${workspaceFolder}/dist/server/index.js",
      "preLaunchTask": "npm: build",
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://localhost/agent_builder"
      }
    }
  ]
}
```

### Logging

```typescript
import { logger } from './utils/logger'

// Different log levels
logger.debug('Detailed debug information')
logger.info('General information')
logger.warn('Warning message')
logger.error('Error occurred', { error })

// Structured logging
logger.info('Agent execution completed', {
  agentName: 'clarification',
  duration: 1234,
  status: 'success'
})
```

## Common Development Tasks

### Adding a New Agent

```typescript
// 1. Create agent file: src/agents/my-new-agent.ts
import { BaseAgent } from './base-agent'
import { WorkflowContext } from '../types/workflow'

export class MyNewAgent extends BaseAgent {
  async execute(context: WorkflowContext): Promise<MyResult> {
    // Implementation
    const result = await this.claudeClient.complete(prompt)
    return this.parseResult(result)
  }

  private parseResult(response: string): MyResult {
    // Parse Claude's response
  }
}

// 2. Register in src/agents/agent-factory.ts
export class AgentFactory {
  createAgent(type: AgentType): BaseAgent {
    switch (type) {
      case 'my-new-agent':
        return new MyNewAgent(this.config)
      // ... other cases
    }
  }
}

// 3. Add to workflow: src/orchestration/workflow-coordinator.ts
async runMyNewPhase(context: WorkflowContext): Promise<void> {
  const agent = this.factory.createAgent('my-new-agent')
  context.myNewResult = await agent.execute(context)
}

// 4. Add tests: tests/unit/agents/my-new-agent.test.ts

// 5. Update types: src/types/agent.ts
export type AgentType =
  | 'clarification'
  | 'design'
  | 'my-new-agent'  // Add here
```

### Adding a New Template

```bash
# 1. Create template directory
mkdir -p templates/mynewformat/typescript
mkdir -p templates/mynewformat/python

# 2. Create template files (Handlebars)
# templates/mynewformat/typescript/index.ts.hbs
{{#if includeComments}}
// {{description}}
{{/if}}

export class {{className}} {
  constructor() {
    // Initialize
  }

  {{#each methods}}
  {{this.name}}({{this.params}}): {{this.returnType}} {
    // Implementation
  }
  {{/each}}
}

# 3. Update template manager: src/templates/template-manager.ts
async renderTemplate(
  format: OutputFormat,
  language: Language,
  data: any
): Promise<string> {
  const templatePath = path.join(
    this.templatesDir,
    format,
    language,
    'index.ts.hbs'
  )

  const template = await fs.readFile(templatePath, 'utf-8')
  const compiled = Handlebars.compile(template)
  return compiled(data)
}

# 4. Add to PackagingAgent: src/agents/packaging-agent.ts
```

### Adding Configuration Options

```yaml
# config/agent-builder.config.yaml
version: "1.0"

# Add new section
myNewFeature:
  enabled: true
  option1: "value"
  option2: 42
```

```typescript
// src/types/config.ts
export interface Config {
  // ... existing
  myNewFeature?: {
    enabled: boolean
    option1: string
    option2: number
  }
}

// src/utils/config-loader.ts
export async function loadConfig(path?: string): Promise<Config> {
  const raw = await fs.readFile(path, 'utf-8')
  const config = yaml.parse(raw)

  // Validate with Zod
  return ConfigSchema.parse(config)
}
```

## Performance Considerations

### Token Usage Optimization

```typescript
// Cache Claude responses
const cache = new Map<string, string>()

async function getCachedCompletion(prompt: string): Promise<string> {
  const cacheKey = hashPrompt(prompt)
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!
  }

  const result = await claudeClient.complete(prompt)
  cache.set(cacheKey, result)
  return result
}
```

### Parallel Execution

```typescript
// Use semaphore for controlled concurrency
import { Semaphore } from './orchestration/semaphore'

const semaphore = new Semaphore(3) // Max 3 concurrent

async function processBatch<T>(
  items: T[],
  processor: (item: T) => Promise<void>
): Promise<void> {
  await Promise.all(
    items.map(item =>
      semaphore.acquire()
        .then(() => processor(item))
        .finally(() => semaphore.release())
    )
  )
}
```

### Memory Management

```typescript
// Stream large files instead of loading into memory
import { createReadStream, createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'

async function processLargeFile(input: string, output: string): Promise<void> {
  await pipeline(
    createReadStream(input),
    transformStream,
    createWriteStream(output)
  )
}
```

## Security Guidelines

### API Key Handling

```typescript
// ✅ Good: Use environment variables
const apiKey = process.env.ANTHROPIC_API_KEY

// ❌ Bad: Hardcode keys
const apiKey = 'sk-ant-...'

// ✅ Good: Validate before use
if (!apiKey) {
  throw new Error('ANTHROPIC_API_KEY not set')
}
```

### Input Validation

```typescript
// Always validate user input with Zod
import { z } from 'zod'

const UserInputSchema = z.object({
  description: z.string().min(10).max(1000),
  outputFormat: z.enum(['skill', 'mcp', 'cli', 'library']),
  language: z.enum(['typescript', 'python'])
})

export function validateInput(input: unknown): UserInput {
  return UserInputSchema.parse(input)
}
```

### File System Access

```typescript
// ✅ Good: Validate paths
import path from 'path'

function safePath(userPath: string, baseDir: string): string {
  const resolved = path.resolve(baseDir, userPath)
  if (!resolved.startsWith(baseDir)) {
    throw new Error('Path traversal attempt detected')
  }
  return resolved
}

// ❌ Bad: Use user input directly
await fs.readFile(userProvidedPath)
```

### SQL Injection Prevention

```typescript
// ✅ Good: Use parameterized queries
await db.query(
  'SELECT * FROM agents WHERE id = $1',
  [userId]
)

// ❌ Bad: String concatenation
await db.query(
  `SELECT * FROM agents WHERE id = '${userId}'`
)
```

---

## Additional Resources

- [Architecture Documentation](./architecture.md)
- [API Reference](./API.md)
- [Extension Guide](./extending.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Anthropic Claude API](https://docs.anthropic.com/)

## Getting Help

- Open a [GitHub Issue](https://github.com/YOUR_USERNAME/agent-builder/issues)
- Join our [Discord Community](https://discord.gg/your-link)
- Check [GitHub Discussions](https://github.com/YOUR_USERNAME/agent-builder/discussions)
- Review [Existing Documentation](./README.md)

---

**Happy Coding!** If you have questions or suggestions for improving this guide, please open an issue or PR.
