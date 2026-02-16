# Existing Agents Feature - Quick Reference

## One-Line Summary
Learn from your existing agent files to generate new agents that match your team's style and structure.

## Basic Usage

```bash
node dist/index.js create "Your agent description" \
  --existing-agents-dir /path/to/agents \
  --output skill
```

## Directory Structure

```
my-agents/
├── agents.md          # Index file (optional but recommended)
├── agent-1.md         # Individual agent files
├── agent-2.md
└── agent-3.md
```

## What Gets Learned

✅ Section structure (Purpose, When to Activate, etc.)
✅ Writing style (formal/casual, technical/friendly)
✅ Formatting (bullets, headings, code blocks)
✅ Organization (single vs multiple agents, index files)
✅ Tone and voice

## Quick Test

```bash
# 1. Create test directory
mkdir test-agents

# 2. Add some agent .md files

# 3. Test reading
npx ts-node test-existing-agents.ts

# 4. Use with agent builder
node dist/index.js create "Test agent" \
  --existing-agents-dir ./test-agents \
  --output skill
```

## Common Patterns

### Pattern 1: Team Standard Agents
```bash
# Learn from your team's agent library
--existing-agents-dir ~/team-agents/support
```

### Pattern 2: Project-Specific Style
```bash
# Match project documentation style
--existing-agents-dir ./docs/agents
```

### Pattern 3: Domain Experts
```bash
# Learn from domain-specific patterns
--existing-agents-dir ./agents/security
```

## Files Recognized

| File | Type | Purpose |
|------|------|---------|
| `agents.md` | Index | Overall organization |
| `*.md` | Agent | Individual agent files |
| `CLAUDE.md` | Guidelines | Claude-specific rules |
| `.cursorrules` | Rules | Editor rules |

## API Quick Reference

```typescript
// Read agents
const pattern = await readExistingAgents('./agents');

// Analyze structure
const analysis = analyzeExistingAgentPattern(pattern);
console.log(analysis.commonSections);
console.log(analysis.styleNotes);

// Format for prompt
const formatted = formatExistingAgentPattern(pattern);
```

## Tips

✨ **3-5 agents minimum** - Better pattern recognition
✨ **Keep examples consistent** - Clearer patterns
✨ **Include agents.md** - Shows organization
✨ **Quality matters** - New agents emulate examples
✨ **Test first** - Use test script to validate directory

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Directory not found | Use absolute path: `/full/path/to/agents` |
| Agents don't match style | Need 3+ consistent examples |
| Warning in logs | Check file permissions and paths |

## Examples

### Example 1: Support Team
```bash
node dist/index.js create "Ticket priority classifier" \
  --existing-agents-dir ~/agents/support \
  --output skill
```

### Example 2: Engineering
```bash
node dist/index.js create "Code review assistant" \
  --existing-agents-dir ./engineering/agents \
  --output mcp \
  --language typescript
```

### Example 3: Sales
```bash
node dist/index.js create "Lead qualification helper" \
  --existing-agents-dir ~/sales-agents \
  --output cli \
  --language python
```

## Full Documentation

📚 Complete guide: [docs/existing-agents-guide.md](./existing-agents-guide.md)

## CLI Flag

```
-e, --existing-agents-dir <path>
    Path to directory with existing agent files to learn from
```

## When to Use

✅ Building agents for an established team
✅ Need consistency across agent library
✅ Want to preserve institutional knowledge
✅ Onboarding new agents to existing collection

❌ First agent ever (no examples to learn from)
❌ Exploring different styles
❌ Examples are low quality or inconsistent
