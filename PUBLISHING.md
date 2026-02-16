# Publishing Guide

This guide covers how to publish agent-builder to npm and GitHub.

## Prerequisites

1. **npm account**: Create an account at https://www.npmjs.com
2. **GitHub repository**: Push code to GitHub
3. **npm token**: Generate an automation token from npm
4. **GitHub secrets**: Add NPM_TOKEN to repository secrets

## Initial Setup

### 1. Update Package Metadata

Edit `package.json` and update:
- `repository.url`: Your GitHub repository URL
- `homepage`: Your GitHub repository homepage
- `bugs.url`: Your GitHub issues URL
- `author`: Your name/organization

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/agent-builder.git"
  },
  "homepage": "https://github.com/YOUR_USERNAME/agent-builder#readme",
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/agent-builder/issues"
  }
}
```

### 2. Choose Package Name

The package name `@agent-builder/cli` may already be taken. Options:
- Use a scoped package: `@your-org/agent-builder`
- Use a unique name: `ai-agent-builder-cli`
- Check availability: `npm search @agent-builder/cli`

Update `name` field in package.json accordingly.

### 3. Set Up npm Authentication

```bash
# Login to npm
npm login

# Verify login
npm whoami

# Generate automation token (for CI/CD)
# Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
# Create a new "Automation" token
# Add it to GitHub repository secrets as NPM_TOKEN
```

## Publishing Manually

### First Release (v0.1.0)

```bash
# Ensure everything is committed
git status

# Build the project
npm run build

# Test the package locally
npm pack
# This creates a .tgz file you can test with:
# npm install -g ./agent-builder-cli-0.1.0.tgz

# Publish to npm (first time)
npm publish --access public

# Tag the release in git
git tag v0.1.0
git push origin v0.1.0
```

### Subsequent Releases

```bash
# Update version (choose one)
npm version patch  # 0.1.0 -> 0.1.1 (bug fixes)
npm version minor  # 0.1.0 -> 0.2.0 (new features)
npm version major  # 0.1.0 -> 1.0.0 (breaking changes)

# This automatically:
# - Updates package.json version
# - Creates a git commit
# - Creates a git tag

# Build
npm run build

# Publish
npm publish --access public

# Push to GitHub
git push origin main --tags
```

## Publishing via GitHub Actions

### Setup

1. **Add NPM Token to GitHub Secrets**
   - Go to your repository on GitHub
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your npm automation token

2. **Create a GitHub Release**
   - Go to your repository → Releases
   - Click "Draft a new release"
   - Choose a tag: `v0.1.0` (or create new)
   - Release title: `v0.1.0`
   - Description: Changelog for this release
   - Click "Publish release"

3. **Automated Publishing**
   - The `.github/workflows/publish.yml` workflow triggers automatically
   - It builds and publishes to npm
   - Check Actions tab for progress

## Installation for Users

After publishing, users can install with:

```bash
# Install globally
npm install -g @agent-builder/cli

# Or with your chosen package name
npm install -g ai-agent-builder-cli

# Use the CLI
agent-builder create "my new agent"
```

## Package Testing

Before publishing, test the package:

```bash
# Create a test directory
mkdir test-install
cd test-install

# Install from local tarball
npm pack ../agent-builder
npm install -g ./agent-builder-cli-0.1.0.tgz

# Test the CLI
agent-builder --help
agent-builder create --help

# Cleanup
npm uninstall -g @agent-builder/cli
cd ..
rm -rf test-install
```

## Version Strategy

Follow [Semantic Versioning](https://semver.org/):

- **Patch** (0.1.x): Bug fixes, no API changes
- **Minor** (0.x.0): New features, backward compatible
- **Major** (x.0.0): Breaking changes

For pre-1.0 versions:
- 0.1.x: Initial development
- 0.2.x: Feature additions
- 1.0.0: First stable release

## Checklist Before Publishing

- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] README.md is up to date
- [ ] CHANGELOG.md updated
- [ ] Version number updated
- [ ] No sensitive data in code (API keys, credentials)
- [ ] .npmignore configured correctly
- [ ] Package.json metadata complete
- [ ] LICENSE file present

## Unpublishing (Emergency Only)

If you need to unpublish a version (avoid if possible):

```bash
# Unpublish a specific version (within 72 hours)
npm unpublish @agent-builder/cli@0.1.0

# Deprecate instead (preferred)
npm deprecate @agent-builder/cli@0.1.0 "Please use version 0.1.1"
```

**Note**: Unpublishing is discouraged. Use deprecation instead.

## Troubleshooting

### "Package name taken"

```bash
# Check if name is available
npm search @agent-builder/cli

# Use a scoped package with your username
npm login
# Then update package.json name to @your-username/agent-builder
```

### "You must be logged in"

```bash
npm login
# Follow prompts to enter credentials
```

### "402 Payment Required"

- Scoped packages (@scope/name) require a paid npm account for public publishing
- Solution: Use unscoped name or add `--access public` flag

### "403 Forbidden"

- You don't have permission to publish this package
- Check if package name is already taken
- Verify you're logged into correct npm account

## Post-Publishing

1. **Test Installation**
   ```bash
   npm install -g @agent-builder/cli
   agent-builder --help
   ```

2. **Update Documentation**
   - Update README.md with npm install instructions
   - Create release notes on GitHub
   - Update project website (if any)

3. **Announce**
   - Tweet about the release
   - Post on relevant forums/communities
   - Update any related documentation

## Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions for npm](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages)
