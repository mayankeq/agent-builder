# Learning from Existing Agents

The agent-builder can learn from your existing agent files and replicate their style, structure, and quality. This ensures consistency when generating new agents for your team or project.

## Overview

When you provide a directory of existing agent markdown files, the agent-builder will:

1. **Read** all `.md` files from the directory
2. **Analyze** their structure, sections, and style patterns
3. **Extract** key conventions (headings, formatting, tone)
4. **Apply** these patterns to newly generated agents

This ensures your new agents match your established standards.

## Usage

### Basic Usage

```bash
node dist/index.js create "Your agent description" \
  --existing-agents-dir /path/to/agents \
  --output skill
```

### Example

```bash
# Learn from your team's existing agents
node dist/index.js create "Database optimization assistant" \
  --existing-agents-dir ./my-team-agents \
  --output skill \
  --language typescript
```

## What Files Are Recognized

The reader looks for these special files:

| File | Purpose |
|------|---------|
| `agents.md` | Index file listing all agents (if present) |
| `*.md` | Individual agent files |
| `CLAUDE.md` | Claude-specific guidelines (optional) |
| `.cursorrules` | Cursor editor rules (optional) |

All regular `.md` files (except `agents.md`) are treated as agent files.

## Example Directory Structure

```
my-agents/
├── agents.md                    # Index file (optional but recommended)
├── code-review-agent.md         # Individual agent
├── deployment-helper-agent.md   # Individual agent
├── troubleshooting-agent.md     # Individual agent
├── CLAUDE.md                    # Optional guidelines
└── .cursorrules                 # Optional rules
```

## What Gets Analyzed

### 1. Common Sections

The analyzer identifies sections that appear across multiple agents:

- Purpose
- When to Activate
- How to Help
- Key Knowledge
- Examples
- Best Practices
- Integration Points
- etc.

### 2. Structure Patterns

- Use of index files (`agents.md`)
- Slash command syntax (`/agent-name`)
- Multiple specialized agents vs. single general agent
- File naming conventions

### 3. Style Notes

- Heading capitalization (title case vs. sentence case)
- Bullet style (dashes, asterisks, numbers)
- Code block usage and frequency
- Emoji usage
- Tone and voice (formal vs. casual)

## How It Works

### 1. Pattern Extraction

When you provide `--existing-agents-dir`, the workflow:

```typescript
// In workflow-coordinator.ts
if (options.existingAgentsDir) {
  const existingAgents = await readExistingAgents(options.existingAgentsDir);
  context.existingAgents = existingAgents;
}
```

### 2. Prompt Enhancement

During agent generation, the prompt is enhanced with examples:

```typescript
// In skill-agent.ts
if (context.existingAgents && context.existingAgents.agentFiles.size > 0) {
  const analysis = analyzeExistingAgentPattern(context.existingAgents);
  const formattedPattern = formatExistingAgentPattern(context.existingAgents);

  // Adds section with existing agent examples and style guidance
}
```

### 3. Claude Generation

Claude receives:
- **Pattern Analysis**: Common sections, structure, style notes
- **Full Examples**: Up to 3 complete agent files as reference
- **Explicit Instructions**: "Match the style and structure of these examples"

## Best Practices

### For Best Results

1. **Provide Multiple Examples** (3-5 agents minimum)
   - More examples = better pattern recognition
   - Diverse examples show consistent patterns

2. **Ensure Consistency** in Existing Agents
   - Use similar section headings
   - Follow the same structure
   - Maintain consistent tone

3. **Include `agents.md`** Index File
   - Shows how agents are organized
   - Demonstrates naming conventions
   - Provides overview context

4. **Quality Over Quantity**
   - Well-written examples are crucial
   - The new agent will emulate the quality of your examples

### Example Agents to Include

**Good**:
```
my-agents/
├── agents.md
├── incident-response-agent.md      # Complete, well-structured
├── deployment-helper-agent.md      # Complete, well-structured
└── monitoring-alert-agent.md       # Complete, well-structured
```

**Avoid**:
```
my-agents/
├── draft-agent.md                  # Incomplete
├── old-version.md                  # Outdated
└── test.md                         # Test/placeholder
```

## Advanced Usage

### Combining with Other Options

```bash
# Learn from existing agents + specify quality tier
node dist/index.js create "Security audit assistant" \
  --existing-agents-dir ./security-agents \
  --output skill \
  --quality-tier advanced

# Learn from existing agents + custom config
node dist/index.js create "Performance optimizer" \
  --existing-agents-dir ./perf-agents \
  --config ./custom-config.yaml \
  --output mcp \
  --language typescript
```

### Programmatic Usage

```typescript
import { WorkflowCoordinator } from './orchestration/workflow-coordinator';
import { readExistingAgents } from './utils/existing-agent-reader';

// Read existing agents
const existingAgents = await readExistingAgents('./my-agents');

// Analyze patterns
const analysis = analyzeExistingAgentPattern(existingAgents);
console.log('Common sections:', analysis.commonSections);
console.log('Style notes:', analysis.styleNotes);

// Build new agent with learned patterns
const result = await coordinator.buildAgent(
  "New specialized agent",
  {
    existingAgentsDir: './my-agents',
    outputType: 'skill'
  }
);
```

## Pattern Analysis Details

### Section Detection

The analyzer uses regex patterns to identify common sections:

```typescript
const sectionPatterns = [
  { pattern: /##\s*Purpose/i, name: 'Purpose' },
  { pattern: /##\s*When to Activate/i, name: 'When to Activate' },
  { pattern: /##\s*How to Help/i, name: 'How to Help' },
  { pattern: /##\s*Key Knowledge/i, name: 'Key Knowledge' },
  // ... etc
];
```

### Structure Recognition

Identifies organizational patterns:
- Agent count and specialization
- Index file presence and format
- Command syntax (slash commands, etc.)

### Style Analysis

Extracts style conventions:
- Heading patterns (title case, capitalization)
- Bullet points and list formatting
- Code block frequency
- Emoji usage

## Troubleshooting

### Issue: "Failed to read existing agents"

**Cause**: Directory doesn't exist or isn't accessible

**Solution**:
- Verify the path is correct
- Check directory permissions
- Use absolute path if relative path fails

```bash
# Use absolute path
node dist/index.js create "Agent" \
  --existing-agents-dir /full/path/to/agents
```

### Issue: Generated agents don't match existing style

**Cause**: Not enough examples or inconsistent examples

**Solution**:
- Provide at least 3-5 example agents
- Ensure examples are consistent in structure
- Include `agents.md` index file for context

### Issue: Warning "continuing without existing agents"

**Cause**: Non-fatal error reading agents (will continue without learning)

**Solution**:
- Check the logs for specific error details
- Verify all `.md` files are valid markdown
- Ensure no corrupted or binary files in directory

## API Reference

### `readExistingAgents(directory: string)`

Reads all agent files from a directory.

**Parameters**:
- `directory`: Path to directory containing agent files

**Returns**: `Promise<ExistingAgentPattern>`

**Throws**: Error if directory doesn't exist or isn't readable

---

### `analyzeExistingAgentPattern(pattern: ExistingAgentPattern)`

Analyzes pattern to extract common sections, structure, and style.

**Parameters**:
- `pattern`: Pattern from `readExistingAgents()`

**Returns**: Object with `commonSections`, `structurePatterns`, `styleNotes`

---

### `formatExistingAgentPattern(pattern: ExistingAgentPattern)`

Formats pattern into a string suitable for Claude prompts.

**Parameters**:
- `pattern`: Pattern from `readExistingAgents()`

**Returns**: Formatted markdown string with examples

---

## Examples

### Example 1: Team Agent Library

```bash
# Learn from your team's established agent library
node dist/index.js create "Customer support ticket classifier" \
  --existing-agents-dir ~/team-agents/support \
  --output skill
```

### Example 2: Project-Specific Agents

```bash
# Generate project agents matching existing style
node dist/index.js create "API documentation generator" \
  --existing-agents-dir ./docs/agents \
  --output mcp \
  --language typescript
```

### Example 3: Multi-Domain Agents

```bash
# Learn from domain-specific agent patterns
node dist/index.js create "Database migration helper" \
  --existing-agents-dir ./agents/database \
  --output cli \
  --language python
```

## See Also

- [Agent Design Guide](./agent-design-guide.md) - How to design quality agents
- [Configuration Guide](./configuration.md) - Configuration options
- [API Documentation](./api.md) - Full API reference
