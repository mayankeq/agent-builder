# Contributing to Agent-Builder

Thank you for your interest in contributing to Agent-Builder! We welcome contributions from the community and are excited to work with you.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Getting Help](#getting-help)

## Code of Conduct

This project adheres to the Contributor Covenant [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [maintainer-email@example.com].

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- An Anthropic API key (for testing agent generation)

### Finding Issues to Work On

- Look for issues labeled [`good first issue`](https://github.com/YOUR_USERNAME/agent-builder/labels/good%20first%20issue) - these are great for newcomers
- Check [`help wanted`](https://github.com/YOUR_USERNAME/agent-builder/labels/help%20wanted) for issues where we'd appreciate contributions
- See [GOOD_FIRST_ISSUES.md](GOOD_FIRST_ISSUES.md) for a curated list of beginner-friendly tasks

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/agent-builder.git
cd agent-builder

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/agent-builder.git
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment

```bash
# Create a .env file (optional, for testing)
echo "ANTHROPIC_API_KEY=your-key-here" > .env
```

### 4. Build the Project

```bash
npm run build
```

### 5. Run Tests

```bash
npm test
```

### 6. Verify Setup

```bash
# Run the CLI locally
node dist/index.js --help
```

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/YOUR_USERNAME/agent-builder/issues)
2. Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml)
3. Include:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Version information
   - Logs/error messages

### Suggesting Features

1. Check if the feature has been requested in [Issues](https://github.com/YOUR_USERNAME/agent-builder/issues)
2. Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.yml)
3. Describe:
   - The problem you're solving
   - Your proposed solution
   - Alternative approaches considered
   - Use cases and examples

### Improving Documentation

1. Use the [Documentation template](.github/ISSUE_TEMPLATE/documentation.yml)
2. Documentation improvements are always welcome:
   - Fixing typos or errors
   - Clarifying confusing sections
   - Adding examples
   - Improving code comments
   - Adding tutorials

### Contributing Code

1. **Find or create an issue** - Discuss your proposed changes first
2. **Create a branch** - Use a descriptive name:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
3. **Make your changes** - Follow our coding standards
4. **Write tests** - Add tests for new functionality
5. **Update documentation** - Keep docs in sync with code
6. **Commit your changes** - Follow commit message conventions
7. **Push and create PR** - Use our PR template

## Coding Standards

### TypeScript Style

We use TypeScript strict mode and follow these conventions:

```typescript
// Use explicit types for function parameters and return values
function processAgent(config: AgentConfig): AgentResult {
  // Implementation
}

// Use interfaces for object shapes
interface AgentConfig {
  name: string;
  outputFormat: OutputFormat;
  language: Language;
}

// Use enums or union types for fixed sets of values
type OutputFormat = 'skill' | 'mcp' | 'cli' | 'library';

// Use async/await for asynchronous code
async function buildAgent(config: AgentConfig): Promise<AgentResult> {
  const result = await generateCode(config);
  return result;
}

// Use descriptive variable names
const clarificationQuestions = await agent.generateQuestions();

// Add JSDoc comments for public APIs
/**
 * Builds an agent with the specified configuration.
 * @param config - The agent configuration
 * @returns Promise resolving to the build result
 */
export async function buildAgent(config: AgentConfig): Promise<AgentResult> {
  // Implementation
}
```

### File Organization

```
src/
├── agents/          # Agent implementations
├── claude/          # Claude API integration
├── cli/             # CLI interface
├── memory/          # Learning system
├── orchestration/   # Workflow coordination
├── performance/     # Performance optimization
├── templates/       # Template system
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── validation/      # Quality checks
```

### Naming Conventions

- **Files**: kebab-case (`workflow-coordinator.ts`)
- **Classes**: PascalCase (`WorkflowCoordinator`)
- **Functions**: camelCase (`generateQuestions`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Interfaces**: PascalCase (`AgentConfig`)
- **Types**: PascalCase (`OutputFormat`)

### Code Quality

- Run ESLint before committing: `npm run lint`
- Fix auto-fixable issues: `npm run lint -- --fix`
- Ensure TypeScript compiles: `npm run build`
- No `any` types unless absolutely necessary (use generics or unknown)
- Handle errors appropriately (don't swallow exceptions)
- Remove unused imports and variables
- Keep functions small and focused (single responsibility)

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools
- `ci`: CI/CD changes

### Examples

```bash
# Good commit messages
git commit -m "feat(agents): add retry logic to base agent"
git commit -m "fix(cli): handle missing API key gracefully"
git commit -m "docs(readme): add installation instructions"
git commit -m "test(memory): add vector search tests"

# Multi-line commit
git commit -m "feat(templates): add Python CLI templates

- Add click-based CLI template for Python
- Include argparse alternative
- Add example usage in documentation

Closes #123"
```

### Commit Guidelines

- Use the imperative mood ("add feature" not "added feature")
- Keep the first line under 72 characters
- Reference issues and PRs in the footer
- Explain *what* and *why*, not *how* (code shows how)

## Pull Request Process

### Before Submitting

1. **Sync with upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**:
   ```bash
   npm run build
   npm test
   npm run lint
   ```

3. **Update documentation**:
   - README.md if adding features
   - JSDoc comments for new functions
   - Architecture docs if changing design

4. **Add tests**:
   - Unit tests for new functions
   - Integration tests for new features
   - Ensure coverage doesn't decrease

### Submitting

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**:
   - Use the PR template
   - Fill out all sections completely
   - Link related issues
   - Add screenshots/videos if relevant

3. **Respond to reviews**:
   - Address all feedback
   - Push new commits (don't force-push during review)
   - Re-request review when ready

### PR Requirements

- [ ] All tests pass
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] PR description is complete
- [ ] No merge conflicts
- [ ] Approved by at least one maintainer

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run specific test file
npm test src/agents/base-agent.test.ts
```

### Writing Tests

We use [Vitest](https://vitest.dev/) for testing:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { BaseAgent } from './base-agent';

describe('BaseAgent', () => {
  let agent: BaseAgent;

  beforeEach(() => {
    agent = new BaseAgent({
      name: 'test-agent',
      timeout: 5000
    });
  });

  it('should initialize with correct name', () => {
    expect(agent.name).toBe('test-agent');
  });

  it('should handle timeout correctly', async () => {
    const longRunningTask = async () => {
      await new Promise(resolve => setTimeout(resolve, 10000));
    };

    await expect(agent.execute(longRunningTask))
      .rejects
      .toThrow('timeout');
  });
});
```

### Test Guidelines

- Test behavior, not implementation
- Use descriptive test names
- Test edge cases and error conditions
- Mock external dependencies (API calls, file system)
- Keep tests fast and isolated
- Aim for high coverage, but prioritize critical paths

## Documentation

### Types of Documentation

1. **Code Comments**:
   - JSDoc for public APIs
   - Inline comments for complex logic
   - TODO/FIXME for known issues

2. **README.md**:
   - Overview and features
   - Installation instructions
   - Quick start guide
   - Basic usage examples

3. **Technical Docs** (`docs/`):
   - Architecture documentation
   - API reference
   - Extension guides
   - Development guide

4. **Examples** (`examples/`):
   - Working code examples
   - Common use cases
   - Integration patterns

### Documentation Style

- Write in clear, simple language
- Use code examples liberally
- Include both TypeScript and Python examples where applicable
- Keep examples up to date with code changes
- Use proper markdown formatting

## Adding New Features

### Adding a New Agent Type

1. Create a new agent class extending `BaseAgent`
2. Implement the `execute()` method
3. Register in `AgentFactory`
4. Add system prompt in `prompt-templates.ts`
5. Update types if needed
6. Add tests
7. Document in extending.md

### Adding a New Output Format

1. Create template directory: `templates/new-format/{typescript,python}/`
2. Add template files (.hbs)
3. Update `PackagingAgent` with new case
4. Add to `OutputType` in types/templates.ts
5. Test generation
6. Document in README.md

### Adding a New Language

1. Create template directories for all formats
2. Add to `Language` type
3. Implement validation in `CodeValidator`
4. Add test runner support
5. Update documentation

## Getting Help

### Questions

- Open a [Question issue](.github/ISSUE_TEMPLATE/question.yml)
- Join our [Discord community](https://discord.gg/your-link)
- Start a [GitHub Discussion](https://github.com/YOUR_USERNAME/agent-builder/discussions)

### Mentorship

- Look for issues with `good first issue` label
- Mention you're new in the issue or PR
- Ask for guidance from maintainers
- Don't hesitate to ask "simple" questions

### Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Anthropic Claude API Docs](https://docs.anthropic.com/)
- [Project Architecture](docs/architecture.md)
- [Development Guide](docs/DEVELOPMENT.md)

## Recognition

Contributors are recognized in several ways:

- Listed in [Contributors](https://github.com/YOUR_USERNAME/agent-builder/graphs/contributors)
- Mentioned in release notes for significant contributions
- Featured in README for major features
- Invited to join the core team for sustained contributions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Agent-Builder!** Your efforts help make this project better for everyone.
