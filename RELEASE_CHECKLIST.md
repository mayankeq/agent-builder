# Release Checklist

## Pre-Release Checklist

### Code Quality
- [x] All TypeScript files compile without errors
- [x] ESLint passes with no errors
- [ ] All tests pass (run `npm test`)
- [x] README.md is complete and accurate
- [x] Documentation is up to date (docs/architecture.md, docs/extending.md)
- [x] CHANGELOG.md is updated (create if needed)

### Package Configuration
- [x] LICENSE file exists (MIT License)
- [x] package.json metadata is complete
  - [x] name (currently `@agent-builder/cli`)
  - [x] version (currently `0.1.0`)
  - [x] description
  - [x] keywords
  - [ ] author (update with your name)
  - [ ] repository URL (update with your GitHub URL)
  - [ ] homepage URL
  - [ ] bugs URL
- [x] .npmignore configured
- [x] `files` array in package.json includes only necessary files

### Security
- [x] No API keys or credentials in code
- [x] .gitignore covers sensitive files
- [ ] Security audit passed (`npm audit`)
- [x] Dependencies are up to date

### Documentation
- [x] Installation instructions
- [x] Usage examples
- [x] Configuration guide
- [x] Contributing guidelines (CONTRIBUTING.md)
- [x] Publishing guide (PUBLISHING.md)
- [ ] CHANGELOG.md with version history

### GitHub Setup
- [x] .github/workflows/ci.yml (continuous integration)
- [x] .github/workflows/publish.yml (npm publishing)
- [ ] Repository created on GitHub
- [ ] Code pushed to GitHub
- [ ] NPM_TOKEN secret added to GitHub repository

## Release Steps

### 1. Prepare Repository

```bash
# Ensure you're on main branch
git checkout main
git pull origin main

# Run full build and tests
npm run clean
npm install
npm run build
npm test
npm run lint

# Check for vulnerabilities
npm audit
```

### 2. Update Version

```bash
# For first release (0.1.0)
# Version is already set in package.json

# For subsequent releases, use:
# npm version patch  # 0.1.0 -> 0.1.1
# npm version minor  # 0.1.0 -> 0.2.0
# npm version major  # 0.1.0 -> 1.0.0
```

### 3. Update CHANGELOG.md

Create or update CHANGELOG.md:

```markdown
# Changelog

## [0.1.0] - 2026-02-05

### Added
- Five-phase workflow (Clarification → Design → Implementation → Packaging → Learning)
- Extended thinking support with 10K token budget
- Multi-format output (Skills, MCP servers, CLIs, libraries)
- Multi-language support (TypeScript, Python)
- Vector database integration for fast pattern matching (LanceDB)
- Interactive CLI with guided workflows
- Self-improving pattern recognition system
- Performance optimization strategies
- Comprehensive validation and quality checks
- Memory system with JSONL storage

### Features
- 6 specialized agents (Clarification, Design, Implementation, Testing, Documentation, Packaging)
- Configurable performance priorities (speed/quality/trust/budget)
- Template system with Handlebars
- GitHub Actions CI/CD workflows
```

### 4. Update package.json URLs

Edit package.json and replace placeholders:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_GITHUB_USERNAME/agent-builder.git"
  },
  "homepage": "https://github.com/YOUR_GITHUB_USERNAME/agent-builder#readme",
  "bugs": {
    "url": "https://github.com/YOUR_GITHUB_USERNAME/agent-builder/issues"
  },
  "author": "Your Name <your.email@example.com>"
}
```

### 5. Test Package Locally

```bash
# Create a tarball
npm pack

# Test installation from tarball
mkdir test-install && cd test-install
npm install -g ../agent-builder-cli-0.1.0.tgz

# Test the CLI
agent-builder --help
agent-builder create --help

# Cleanup
cd ..
rm -rf test-install
npm uninstall -g @agent-builder/cli
```

### 6. Commit and Tag

```bash
# Commit all changes
git add .
git commit -m "chore: prepare for v0.1.0 release"

# Create tag
git tag -a v0.1.0 -m "Release v0.1.0"

# Push to GitHub
git push origin main
git push origin v0.1.0
```

### 7. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `agent-builder`
3. Description: "A comprehensive CLI tool for building LLM-based agents with extended thinking"
4. Public repository
5. Don't initialize with README (we have one)
6. Create repository

```bash
# Add remote and push (if not already done)
git remote add origin https://github.com/YOUR_USERNAME/agent-builder.git
git branch -M main
git push -u origin main
git push origin --tags
```

### 8. Configure npm Publishing

```bash
# Login to npm
npm login

# Check package name availability
npm search @agent-builder/cli

# If taken, update package.json name to something unique:
# @your-username/agent-builder
# or: ai-agent-builder-cli
```

### 9. Add GitHub Secrets

1. Go to repository on GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Your npm automation token
   - Get from https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Create "Automation" token

### 10. Publish to npm

#### Option A: Manual Publish

```bash
# Publish to npm
npm publish --access public

# If you get errors:
# - Package name taken: Update name in package.json
# - Not logged in: Run npm login
# - Need public access: Add --access public flag
```

#### Option B: GitHub Release (Automated)

1. Go to your repository on GitHub
2. Click "Releases" → "Draft a new release"
3. Click "Choose a tag" → Select `v0.1.0`
4. Release title: `v0.1.0 - Initial Release`
5. Description: Copy content from CHANGELOG.md
6. Click "Publish release"
7. GitHub Actions will automatically publish to npm

### 11. Verify Publication

```bash
# Check npm registry
npm view @agent-builder/cli

# Install from npm
npm install -g @agent-builder/cli

# Test it works
agent-builder --version
agent-builder --help

# Try creating an agent
export ANTHROPIC_API_KEY=your-key
agent-builder create "A simple calculator"
```

### 12. Post-Release

- [ ] Announce on Twitter/LinkedIn
- [ ] Share in relevant communities
- [ ] Update project homepage (if any)
- [ ] Monitor for issues
- [ ] Respond to feedback

## Maintenance Checklist

### Regular Updates

```bash
# Check for outdated dependencies
npm outdated

# Update dependencies
npm update

# Check security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### Version Bumps

For bug fixes (0.1.0 → 0.1.1):
```bash
npm version patch
npm run build
npm publish --access public
git push origin main --tags
```

For new features (0.1.0 → 0.2.0):
```bash
npm version minor
npm run build
npm publish --access public
git push origin main --tags
```

For breaking changes (0.1.0 → 1.0.0):
```bash
npm version major
npm run build
npm publish --access public
git push origin main --tags
```

## Troubleshooting

### "Package name already exists"
- Choose a different name
- Use scoped package: `@your-username/agent-builder`
- Check availability: `npm search package-name`

### "You must be logged in"
- Run `npm login`
- Verify with `npm whoami`

### "402 Payment Required"
- Use `--access public` flag
- Or use unscoped package name

### GitHub Actions failing
- Check NPM_TOKEN secret is set correctly
- Verify token has publish permissions
- Check workflow logs for details

## Support

For issues or questions:
- GitHub Issues: https://github.com/YOUR_USERNAME/agent-builder/issues
- Documentation: See docs/ directory
- Examples: See examples/ directory
