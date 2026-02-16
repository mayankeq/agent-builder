## Description

<!-- Provide a brief description of your changes -->

## Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring
- [ ] Test improvements
- [ ] CI/CD changes

## Related Issues

<!-- Link related issues here -->

Fixes #(issue number)
Related to #(issue number)

## Changes Made

<!-- List the specific changes you made -->

- Change 1
- Change 2
- Change 3

## Testing

<!-- Describe the tests you ran and how to reproduce them -->

### Test Configuration

- Node.js version:
- Operating System:
- Agent-Builder version:

### Tests Performed

- [ ] Unit tests pass (`npm test`)
- [ ] Integration tests pass
- [ ] Manual testing performed
- [ ] Tested with TypeScript output
- [ ] Tested with Python output
- [ ] Tested all output formats (skill/mcp/cli/library)

### Test Commands

```bash
# Commands you used to test your changes
npm test
npm run build
agent-builder create "test agent"
```

## Checklist

<!-- Mark completed items with an "x" -->

### Code Quality

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings or errors
- [ ] I have removed any console.log statements or debug code
- [ ] I have handled errors appropriately

### Testing

- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have tested edge cases and error conditions

### Documentation

- [ ] I have updated the README if needed
- [ ] I have updated relevant documentation in /docs
- [ ] I have added/updated code comments
- [ ] I have updated the CHANGELOG (if applicable)
- [ ] I have added JSDoc comments for new functions/classes

### Dependencies

- [ ] I have not added unnecessary dependencies
- [ ] If I added dependencies, I have justified them in this PR description
- [ ] I have updated package.json and package-lock.json properly

### Breaking Changes

- [ ] This PR does not introduce breaking changes
- [ ] OR: I have documented all breaking changes below

<!-- If you have breaking changes, describe them and the migration path -->

#### Breaking Changes Description

```
Describe breaking changes here
```

#### Migration Guide

```
Provide step-by-step migration instructions
```

## Screenshots/Videos

<!-- If applicable, add screenshots or videos to help explain your changes -->

## Performance Impact

<!-- Describe any performance implications of your changes -->

- [ ] No significant performance impact
- [ ] Performance improved (describe how)
- [ ] Performance may be impacted (describe why and mitigation)

## Security Considerations

<!-- Describe any security implications -->

- [ ] No security implications
- [ ] Security improved (describe how)
- [ ] Security considerations addressed (describe)

## Additional Notes

<!-- Any additional information reviewers should know -->

## Reviewer Checklist

<!-- For reviewers -->

- [ ] Code follows project conventions
- [ ] Tests are adequate and pass
- [ ] Documentation is updated
- [ ] No security concerns
- [ ] Performance is acceptable
- [ ] Breaking changes are properly documented
