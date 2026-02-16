# Test Quick Start Guide

Get up and running with the agent-builder test suite in 5 minutes.

## 1. Install Dependencies

```bash
npm install
```

This installs:
- `vitest` - Test framework
- `@vitest/coverage-v8` - Coverage reporting
- `@vitest/ui` - Test UI dashboard

## 2. Run All Tests

```bash
npm test
```

Expected output:
```
✓ tests/agents/base-agent.test.ts (15 tests)
✓ tests/agents/clarification-agent.test.ts (8 tests)
✓ tests/orchestration/workflow-coordinator.test.ts (12 tests)
...

Test Files  15 passed (15)
     Tests  180 passed (180)
```

## 3. Run with Coverage

```bash
npm test -- --coverage
```

Coverage report shows:
```
File                                | % Stmts | % Branch | % Funcs | % Lines
------------------------------------|---------|----------|---------|--------
All files                           |   72.45 |    68.33 |   75.21 |   72.45
 src/agents                         |   78.23 |    72.15 |   80.45 |   78.23
 src/orchestration                  |   75.67 |    70.89 |   78.90 |   75.67
 src/memory                         |   71.34 |    65.78 |   73.21 |   71.34
...
```

## 4. Run Specific Tests

### Single test file
```bash
npm test -- tests/agents/base-agent.test.ts
```

### By pattern
```bash
npm test -- --grep="WorkflowCoordinator"
```

### By category
```bash
# Integration tests only
npm test -- tests/integration

# Performance tests only
npm test -- tests/performance

# Agent tests only
npm test -- tests/agents
```

## 5. Watch Mode (Development)

```bash
npm test -- --watch
```

Tests re-run automatically when files change.

## 6. Interactive UI

```bash
npm run test:ui
```

Opens browser with interactive test dashboard at `http://localhost:51204`

## 7. Debug Tests

### VSCode Debug Configuration

Add to `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["test", "--", "--run"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Command Line Debug
```bash
node --inspect-brk node_modules/.bin/vitest run tests/agents/base-agent.test.ts
```

Then open `chrome://inspect` in Chrome.

## 8. Common Commands

```bash
# Run tests in parallel (default)
npm test

# Run tests serially (for debugging)
npm test -- --no-threads

# Run tests with verbose output
npm test -- --reporter=verbose

# Generate HTML coverage report
npm test -- --coverage --coverage.reporter=html

# Update snapshots (if using)
npm test -- -u

# Run only tests that failed last time
npm test -- --only-failed
```

## 9. Verify Everything Works

Run this comprehensive check:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Build the project
npm run build

# Run all tests with coverage
npm test -- --coverage

# Check coverage thresholds
# Should pass with >70% coverage
```

Expected: All tests pass, coverage above 70%.

## 10. Next Steps

### Write Your First Test

Create `tests/example.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('My Feature', () => {
  it('should work correctly', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run it:
```bash
npm test -- tests/example.test.ts
```

### Common Patterns

**Test an agent:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MyAgent } from '@/agents/my-agent';
import { MockClaudeClient } from '../utils/mock-claude-client';
import { createTestWorkflowContext } from '../fixtures/workflow-fixtures';

describe('MyAgent', () => {
  let mockClient: MockClaudeClient;
  let agent: MyAgent;

  beforeEach(() => {
    mockClient = new MockClaudeClient();
    agent = new MyAgent(mockClient.createMock());
  });

  it('should execute successfully', async () => {
    const context = createTestWorkflowContext();
    const result = await agent.execute(context);
    expect(result.success).toBe(true);
  });
});
```

**Test async operations:**
```typescript
it('should handle async work', async () => {
  const result = await doAsyncWork();
  expect(result).toBeDefined();
});
```

**Test error cases:**
```typescript
it('should throw on invalid input', async () => {
  await expect(doWork(null)).rejects.toThrow('Invalid input');
});
```

## Troubleshooting

### Tests timeout
```bash
# Increase timeout
npm test -- --testTimeout=60000
```

### Coverage not generated
```bash
# Install coverage provider
npm install -D @vitest/coverage-v8
```

### Tests fail with "Cannot find module"
```bash
# Rebuild project
npm run build

# Check TypeScript compilation
npx tsc --noEmit
```

### Port already in use (test UI)
```bash
# Use different port
npm run test:ui -- --port=51205
```

### Mock not working
```typescript
// Ensure mock is set up before test
beforeEach(() => {
  mockClient.reset(); // Reset between tests
  mockClient.setMockResponse('pattern', response);
});
```

## Performance Tips

1. **Run tests in parallel** (default)
2. **Use `--no-coverage`** for faster runs during development
3. **Run specific files** instead of all tests
4. **Use watch mode** for rapid iteration
5. **Skip slow integration tests** during unit test development

```bash
# Fast unit tests only
npm test -- tests/agents --no-coverage

# Skip integration tests
npm test -- --exclude tests/integration
```

## Environment Variables

Tests use these environment variables (set in `tests/setup.ts`):

```bash
NODE_ENV=test
ANTHROPIC_API_KEY=test-api-key
JWT_SECRET=test-jwt-secret-...
ENCRYPTION_KEY=<base64-test-key>
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
```

## Getting Help

1. **Check the test README**: `tests/README.md`
2. **Review test examples**: Look at existing test files
3. **Read Vitest docs**: https://vitest.dev/
4. **Check test summary**: `tests/TEST_SUMMARY.md`

## Success Criteria

You're ready to go when:
- ✅ `npm test` passes
- ✅ Coverage is above 70%
- ✅ All test files execute
- ✅ No timeout errors
- ✅ Build succeeds (`npm run build`)

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm test -- --coverage` | Run with coverage |
| `npm test -- --watch` | Watch mode |
| `npm run test:ui` | Interactive UI |
| `npm test -- tests/agents` | Test specific directory |
| `npm test -- --grep="pattern"` | Filter by name |
| `npm test -- --no-coverage` | Skip coverage |
| `npm test -- --reporter=verbose` | Detailed output |

Happy testing! 🧪
