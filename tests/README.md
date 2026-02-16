# Agent-Builder Test Suite

Comprehensive test suite for the agent-builder project, targeting 70%+ code coverage.

## Structure

```
tests/
├── setup.ts                      # Global test setup and teardown
├── fixtures/                     # Test data and fixtures
│   └── workflow-fixtures.ts      # Workflow-related test fixtures
├── utils/                        # Test utilities
│   └── mock-claude-client.ts     # Mock Claude API client
├── agents/                       # Agent unit tests
│   ├── base-agent.test.ts
│   ├── clarification-agent.test.ts
│   ├── design-agent.test.ts
│   ├── implementation-agent.test.ts
│   ├── testing-agent.test.ts
│   ├── documentation-agent.test.ts
│   └── packaging-agent.test.ts
├── orchestration/                # Workflow orchestration tests
│   └── workflow-coordinator.test.ts
├── memory/                       # Memory system tests
│   ├── memory-manager.test.ts
│   └── session-store.test.ts
├── server/                       # Server component tests
│   ├── auth/
│   │   └── jwt.test.ts
│   ├── security/
│   │   └── encryption.test.ts
│   ├── storage/
│   │   ├── database.test.ts
│   │   ├── session-store.test.ts
│   │   └── user-store.test.ts
│   ├── middleware/
│   │   ├── auth.test.ts
│   │   └── error-handler.test.ts
│   └── routes/
│       ├── agents.test.ts
│       ├── sessions.test.ts
│       └── auth.test.ts
├── integration/                  # Integration tests
│   ├── e2e-workflow.test.ts
│   ├── output-formats.test.ts
│   ├── api-endpoints.test.ts
│   └── websocket.test.ts
└── performance/                  # Performance tests
    ├── benchmark.test.ts
    ├── memory-usage.test.ts
    └── concurrent-sessions.test.ts
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with UI
```bash
npm run test:ui
```

### Run Specific Test File
```bash
npm test -- tests/agents/base-agent.test.ts
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Tests for Specific Pattern
```bash
npm test -- --grep="WorkflowCoordinator"
```

## Test Categories

### Unit Tests (70% of tests)
Located in: `agents/`, `memory/`, `server/`

Test individual components in isolation with mocked dependencies:
- **Agent Tests**: Test each agent's execution, validation, and error handling
- **Memory Tests**: Test pattern matching, session storage, and learning
- **Server Tests**: Test authentication, encryption, database operations
- **Orchestration Tests**: Test workflow coordination and phase management

### Integration Tests (20% of tests)
Located in: `integration/`

Test complete workflows with multiple components:
- **E2E Workflow**: Full agent creation from request to artifacts
- **Output Formats**: Test all 4 output types (CLI, MCP, library, skill)
- **API Endpoints**: Test REST API with all routes
- **WebSocket**: Test real-time communication

### Performance Tests (10% of tests)
Located in: `performance/`

Measure and benchmark performance:
- **Benchmarks**: Phase durations, throughput, scalability
- **Memory Usage**: Memory leaks, heap usage over time
- **Concurrent Sessions**: Parallel execution performance

## Mocking Strategy

### Claude API Client
We mock the Anthropic Claude API to ensure:
- Deterministic test results
- Fast test execution
- No API costs during testing
- Offline testing capability

```typescript
import { MockClaudeClient } from '../utils/mock-claude-client';

const mockClient = new MockClaudeClient();
mockClient.setMockResponse('clarify', {
  text: JSON.stringify({ requirements: { ... } }),
  usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
});
```

### Database Operations
For database tests, we use:
- In-memory SQLite for fast tests (or)
- Test database with auto-cleanup (preferred for integration)

### External Services
- **S3Store**: Mocked to avoid AWS calls
- **OAuth Providers**: Mocked authentication flows
- **WebSocket**: Local test server

## Fixtures

Reusable test data in `fixtures/`:

```typescript
import { createTestWorkflowContext, createTestRequirements } from '../fixtures/workflow-fixtures';

const context = createTestWorkflowContext({
  userRequest: 'Create a calculator',
});

const requirements = createTestRequirements({
  output: { type: 'cli', language: 'typescript' },
});
```

## Coverage Thresholds

Configured in `vitest.config.ts`:
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

## Test Environment

Environment variables set in `setup.ts`:
- `NODE_ENV=test`
- `ANTHROPIC_API_KEY=test-api-key`
- `JWT_SECRET=test-jwt-secret-...`
- `ENCRYPTION_KEY=<test-key>`
- `DATABASE_URL=postgresql://...`

## Writing New Tests

### 1. Unit Test Template
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { YourComponent } from '@/path/to/component';

describe('YourComponent', () => {
  let component: YourComponent;

  beforeEach(() => {
    component = new YourComponent();
  });

  describe('method', () => {
    it('should do something', () => {
      const result = component.method();
      expect(result).toBeDefined();
    });
  });
});
```

### 2. Integration Test Template
```typescript
import { describe, it, expect } from 'vitest';
import { MockClaudeClient } from '../utils/mock-claude-client';

describe('Feature Integration', () => {
  it('should work end-to-end', async () => {
    // Setup
    const mockClient = new MockClaudeClient();

    // Execute
    const result = await doSomething();

    // Assert
    expect(result).toBeDefined();
  });
});
```

### 3. Performance Test Template
```typescript
import { describe, it, expect } from 'vitest';

describe('Performance', () => {
  it('should complete within time budget', async () => {
    const startTime = Date.now();

    await doWork();

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000);
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach` and `afterEach` for setup/teardown
3. **Descriptive Names**: Use clear, descriptive test names
4. **Arrange-Act-Assert**: Follow AAA pattern
5. **Mock External Deps**: Always mock external services
6. **Test Edge Cases**: Include error cases and boundary conditions
7. **Fast Tests**: Keep unit tests under 100ms
8. **Avoid Timeouts**: Don't use arbitrary waits, use proper async handling

## Debugging Tests

### Run Single Test
```bash
npm test -- -t "should create design successfully"
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/vitest run tests/agents/base-agent.test.ts
```

### Verbose Output
```bash
npm test -- --reporter=verbose
```

### Show Console Logs
```bash
npm test -- --reporter=verbose --no-silent
```

## CI/CD Integration

Tests run automatically on:
- Every commit (via pre-commit hook if configured)
- Pull requests
- Merge to main branch

Required checks:
- All tests passing
- Coverage thresholds met
- No test failures or skipped tests

## Troubleshooting

### Tests Timing Out
- Increase timeout in test: `it('test', async () => { ... }, 60000)`
- Check for unresolved promises
- Verify mocks are properly configured

### Coverage Not Meeting Threshold
- Run `npm test -- --coverage` to see uncovered lines
- Add tests for uncovered code paths
- Check if files are properly excluded in config

### Flaky Tests
- Remove timing dependencies
- Ensure proper cleanup in `afterEach`
- Check for shared state between tests
- Use deterministic test data

### Mock Issues
- Verify mock setup in `beforeEach`
- Check mock response format matches expected
- Reset mocks between tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vitest API Reference](https://vitest.dev/api/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Contributing

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure coverage remains above 70%
3. Add integration tests for new workflows
4. Update this README if adding new test categories

## Contact

For questions about tests, see the main project README or open an issue.
