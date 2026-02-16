# Quick Start Guide

## 1. Installation

```bash
# Once published to npm:
npm install -g @agent-builder/cli

# Or from source:
git clone https://github.com/YOUR_USERNAME/agent-builder.git
cd agent-builder
npm install && npm run build && npm link
```

## 2. Set Up API Key

```bash
# Set your Anthropic API key
export ANTHROPIC_API_KEY=your-key-here

# Or add to your shell profile (~/.zshrc or ~/.bashrc):
echo 'export ANTHROPIC_API_KEY=your-key-here' >> ~/.zshrc
source ~/.zshrc
```

## 3. Your First Agent

### Interactive Mode (Recommended)

```bash
agent-builder create
```

This will:
1. Ask you targeted questions about your agent
2. Design the architecture using extended thinking
3. Generate code, tests, and documentation
4. Package it in your chosen format
5. Learn from the session for future builds

### Quick Mode

```bash
# Create with a description
agent-builder create "A web scraper that extracts product prices from e-commerce sites"

# Specify format and language
agent-builder create "API client for GitHub" --output library --language typescript

# With configuration file
agent-builder create "Data processor" --config ./my-config.yaml
```

## 4. Common Commands

```bash
# Get help
agent-builder --help
agent-builder create --help

# List all sessions
agent-builder list

# Show session details
agent-builder show <session-id>

# Check version
agent-builder --version
```

## 5. Output Formats

### Claude Code Skill
```bash
agent-builder create "Code analyzer" --output skill --language typescript
```
Creates a skill that integrates with Claude Code CLI.

### MCP Server
```bash
agent-builder create "GitHub integration" --output mcp --language typescript
```
Creates a Model Context Protocol server with stdio transport.

### Standalone CLI
```bash
agent-builder create "Log parser" --output cli --language python
```
Creates an independent command-line tool.

### Library
```bash
agent-builder create "API wrapper" --output library --language typescript
```
Creates an npm or pip package.

## 6. Configuration

Create `.agent-builder.yaml` in your project:

```yaml
version: "1.0"

claude:
  model: "claude-sonnet-4-5-20250929"
  max_tokens: 16000
  temperature: 1.0
  extended_thinking:
    enabled: true
    budget: "high"  # low (2K), medium (5K), high (10K)

workflow:
  clarification:
    max_rounds: 3
  design:
    enable_extended_thinking: true
  implementation:
    parallelization: true

performance:
  speed: "medium"        # low | medium | high
  quality: "high"        # low | medium | high
  trust: "high"          # low | medium | high
  parallelization: "auto"  # none | auto | aggressive
  budget: "medium"       # low | medium | high

memory:
  enabled: true
  storage_dir: "./data/memory"
  use_vector_search: true
  pattern_matching:
    similarity_threshold: 0.7
```

## 7. Examples

### Example 1: Web Scraper MCP Server

```bash
agent-builder create "A web scraper MCP server that extracts article content" \
  --output mcp \
  --language typescript
```

### Example 2: Data Processing CLI

```bash
agent-builder create "A CLI tool for processing CSV files with filtering and transformation" \
  --output cli \
  --language python
```

### Example 3: API Client Library

```bash
agent-builder create "A TypeScript library for interacting with Stripe API" \
  --output library \
  --language typescript
```

## 8. Understanding the Workflow

### Phase 1: Clarification (2-5 min)
- Agent asks 5-7 targeted questions
- Categories: functional, technical, architectural, performance
- Takes 2-3 rounds to gather complete requirements

### Phase 2: Design (5-10 min)
- Uses Claude's extended thinking (10K tokens)
- Analyzes architecture approaches
- Creates component design
- Documents decisions and trade-offs

### Phase 3: Implementation (10-15 min)
- Generates code in parallel:
  - Core implementation
  - Unit and integration tests
  - Documentation and examples
- All three run concurrently for speed

### Phase 4: Packaging (2-5 min)
- Packages for chosen format
- Adds format-specific configuration
- Creates distributable artifacts

### Phase 5: Learning (instant)
- Captures session patterns
- Updates metrics
- Stores learnings for future builds

**Total Time**: 20-35 minutes per agent

## 9. Tips for Best Results

### Be Specific
```bash
# Good
agent-builder create "A rate-limited HTTP client with retry logic and exponential backoff"

# Less good
agent-builder create "HTTP client"
```

### Choose Priorities
- **Speed**: Faster build, fewer validation checks
- **Quality**: More thorough, comprehensive tests
- **Trust**: Maximum validation, security checks
- **Budget**: Minimize token usage

### Leverage Interactive Mode
- More accurate requirements gathering
- Better architecture decisions
- Higher success rate

### Review and Customize
- Generated code is a starting point
- Review and customize for your needs
- Learn from the patterns it uses

## 10. Troubleshooting

### "ANTHROPIC_API_KEY not found"
```bash
export ANTHROPIC_API_KEY=your-key-here
```

### "Command not found: agent-builder"
```bash
# If installed globally:
npm install -g @agent-builder/cli

# If installed from source:
npm link
```

### Build Takes Too Long
```yaml
# Adjust configuration for speed:
performance:
  speed: "high"
  quality: "medium"
workflow:
  clarification:
    max_rounds: 2
```

### Pattern Matching Slow
```yaml
# Enable vector search:
memory:
  use_vector_search: true
```

## 11. Next Steps

1. **Explore Examples**: Check `examples/` directory
2. **Read Documentation**: See `docs/` for detailed guides
3. **Customize Templates**: Add your own in `templates/`
4. **Extend Agents**: Create custom agents in `src/agents/`
5. **Share Feedback**: Open issues on GitHub

## 12. Resources

- **Documentation**: `docs/architecture.md`, `docs/extending.md`
- **Contributing**: See `CONTRIBUTING.md`
- **Publishing**: See `PUBLISHING.md` for release process
- **GitHub**: https://github.com/YOUR_USERNAME/agent-builder
- **npm**: https://www.npmjs.com/package/@agent-builder/cli

---

**Happy Agent Building! 🚀**
