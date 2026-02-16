# API Reference - Ultra-Concise Skill Generation with Knowledge Base

## Overview

The agent-builder system generates **ultra-concise skills** (max 200 tokens per skill) with a separate **knowledge-base.md** file for deep domain expertise. This architecture ensures clarity, maintainability, and production-readiness.

## Key Architecture Principles

1. **200-Token Constraint**: Each skill file is limited to ~50 lines / 200 tokens
2. **Knowledge Base Separation**: Deep domain knowledge, integration details, and best practices live in knowledge-base.md
3. **Pattern Learning**: System can learn from existing agent files in your organization
4. **Ultra-Concise Format**: Skills contain only triggers and actions

## Research Interface

Enhanced research interface for capturing production-ready agent requirements.

### Type Definition

```typescript
export interface Research {
  // Core Domain Analysis
  domain: AgentDomain;
  userIntent: string;
  capabilities: string[];
  recommendedApproach: string;
  relevantPatterns: string[];
  potentialChallenges: string[];
  successCriteria: string[];
  researchSummary: string;
  thinkingTrace?: string[];

  // Integration Analysis (NEW)
  integrationPoints?: IntegrationPoints;

  // Advanced Capabilities (NEW)
  advancedCapabilities?: string[];

  // Contextual Analysis (NEW)
  contextualFactors?: string[];

  // Domain Expertise (NEW)
  domainSpecificDepth?: DomainDepth;
}
```

### IntegrationPoints

```typescript
interface IntegrationPoints {
  // Institutional knowledge sources
  tribalKnowledge?: string[];
  // Examples: ["Slack #support-wins channel", "Confluence runbooks", "Team wiki"]

  // Existing system integrations
  existingSystems?: string[];
  // Examples: ["Salesforce CRM", "Jira ticketing", "Datadog monitoring", "PostgreSQL DB"]

  // Historical data sources
  dataSources?: string[];
  // Examples: ["6 months of ticket history", "Support interaction logs", "CSAT scores"]
}
```

### DomainDepth

```typescript
interface DomainDepth {
  // Industry best practices
  bestPractices?: string[];
  // Examples: ["ITIL incident management", "MEDDIC sales qualification", "SRE error budgets"]

  // Common mistakes to avoid
  antiPatterns?: string[];
  // Examples: ["Over-automating emotional interactions", "Alert fatigue from noisy monitors"]

  // Relevant standards and compliance
  industryStandards?: string[];
  // Examples: ["GDPR Article 17", "ISO 20000", "SOC2 Type II"]
}
```

## ExistingAgentPattern Interface

Used for learning from existing agent files in your organization.

### Type Definition

```typescript
export interface ExistingAgentPattern {
  // Main agent index file
  agentsIndex?: string;

  // Map of agent filename to content
  agentFiles: Map<string, string>;

  // Optional CLAUDE.md guidelines
  claudeMd?: string;

  // Optional .cursorrules file
  cursorRules?: string;
}
```

### Usage

```typescript
import { readExistingAgents } from './utils/existing-agent-reader';

// Read existing agents from directory
const pattern = await readExistingAgents('~/my-company/agents/');

// pattern.agentFiles contains all .md files
// pattern.agentsIndex contains agents.md if present
// pattern.claudeMd contains CLAUDE.md if present

// Analyze patterns
const analysis = analyzeExistingAgentPattern(pattern);
// Returns: { commonSections, structurePatterns, styleNotes }

// Format for Claude
const formatted = formatExistingAgentPattern(pattern);
// Returns formatted string for inclusion in prompts
```

### Methods

#### readExistingAgents()

Reads agent files from a directory to extract patterns.

**Signature:**
```typescript
async function readExistingAgents(directory: string): Promise<ExistingAgentPattern>
```

**Parameters:**
- `directory` (string): Path to directory containing existing agent files

**Returns:**
- Promise<ExistingAgentPattern>: Structure with all discovered agent files

**Example:**
```typescript
const pattern = await readExistingAgents('/path/to/agents/');
console.log(`Found ${pattern.agentFiles.size} agent files`);
```

#### analyzeExistingAgentPattern()

Extracts structural patterns and style elements from existing agents.

**Signature:**
```typescript
function analyzeExistingAgentPattern(pattern: ExistingAgentPattern): {
  commonSections: string[];
  structurePatterns: string[];
  styleNotes: string[];
}
```

**Returns:**
- `commonSections`: Common section headings (e.g., "Purpose", "When to Activate")
- `structurePatterns`: Organizational patterns (e.g., "Multiple specialized agents")
- `styleNotes`: Style observations (e.g., "Uses title case for headings")

#### formatExistingAgentPattern()

Formats existing agent patterns into a readable summary for Claude.

**Signature:**
```typescript
function formatExistingAgentPattern(pattern: ExistingAgentPattern): string
```

**Returns:**
- Formatted string with up to 3 full agent examples + list of remaining files

## ResearchAgent Methods

### buildResearchPrompt()

Generates comprehensive research prompt with advanced capabilities.

**Signature:**
```typescript
private buildResearchPrompt(userRequest: string): string
```

**Parameters:**
- `userRequest` (string): User's natural language description of desired agent

**Returns:**
- (string): Formatted prompt for Claude with:
  - Domain detection guidance
  - Integration point identification
  - Advanced capability analysis
  - Contextual factor assessment
  - Domain-specific depth exploration

**Example:**
```typescript
const prompt = this.buildResearchPrompt(
  "Customer support agent for SaaS billing issues"
);

// Generates prompt that asks Claude to identify:
// - Domain: support
// - Integrations: Stripe, Salesforce, Zendesk, billing database
// - Advanced capabilities: Invoice correlation, payment pattern analysis
// - Contextual factors: Public billing responses, GDPR compliance, PCI DSS
// - Best practices: Payment dispute handling, escalation to finance team
```

### parseResearchResponse()

Parses Claude's response including new advanced fields.

**Signature:**
```typescript
private parseResearchResponse(response: string): Research
```

**Parameters:**
- `response` (string): JSON response from Claude

**Returns:**
- Research object with all fields populated

**Error Handling:**
- Throws `Error` if JSON parsing fails
- Falls back to empty arrays for optional fields
- Validates domain against AgentDomain type

## SkillAgent Methods

### buildSkillPrompt()

Generates prompt for ultra-concise skill generation (max 200 tokens per skill) using research data.

**Signature:**
```typescript
private buildSkillPrompt(
  design: Design,
  context: WorkflowContext
): string
```

**Parameters:**
- `design` (Design): System design with components
- `context` (WorkflowContext): Full workflow context including research

**Returns:**
- (string): Ultra-concise skill generation prompt that includes:
  - Integration points from research
  - Advanced capabilities to incorporate
  - Contextual factors to consider
  - Domain-specific best practices
  - Quality bar for production-ready agents

**Example:**
```typescript
const prompt = this.buildSkillPrompt(design, context);

// Generated prompt includes:
// ## Integration Points Available
// **Tribal Knowledge Sources**: Slack #support-wins, Team runbook repo
// **Existing Systems**: Salesforce CRM, Jira ticketing, PostgreSQL DB
// **Data Sources**: 6 months ticket history, CSAT scores
//
// ## Advanced Capabilities to Incorporate
// - Correlate current issue to similar past tickets
// - Learn from resolution success rates
// - Predict escalation likelihood based on sentiment
// - Build knowledge base from ticket patterns
//
// ## Contextual Factors to Consider
// - Distinguish public customer vs internal team responses
// - SLA requirements vary by customer tier
// - GDPR compliance for EU customers
//
// ## Domain-Specific Best Practices
// **Best Practices**: ITIL incident management, <2min response time
// **Anti-Patterns to Avoid**: Over-automation of emotional situations
```

### generateAgents()

Generates multiple ultra-concise agent markdown files (max 200 tokens each).

**Architecture:**
- Skills: Triggers + Actions only (< 50 lines / 200 tokens)
- Knowledge Base: Separate knowledge-base.md with deep expertise
- No embedded knowledge sections in skill files

**Signature:**
```typescript
private async generateAgents(
  design: Design,
  context: WorkflowContext
): Promise<Record<string, string>>
```

**Parameters:**
- `design` (Design): Component design
- `context` (WorkflowContext): Workflow context with research

**Returns:**
- Promise<Record<string, string>>: Map of filename to markdown content

**Example Output:**
```typescript
{
  'billing-specialist-agent.md': '# Billing Specialist\n\n## Trigger\n- Keywords: billing...\n\n## Steps\n1. Verify...',
  'technical-support-agent.md': '# Technical Support\n\n## Trigger\n- Keywords: error...',
  'escalation-coordinator-agent.md': '# Escalation Coordinator\n\n## Trigger\n- Sentiment < -0.7...',
  'knowledge-base.md': '# Knowledge Base\n\n## Billing Expertise\n### Integration Points...',
  'agents.md': '# Agent System: Customer Support\n\n## Overview...'
}
```

**Key Differences from Old Architecture:**
- Skills are ultra-concise (< 200 tokens each)
- No "Key Knowledge" or "Integration Points" sections in skill files
- All deep knowledge moved to knowledge-base.md
- Skills reference knowledge base via link at bottom

### generateKnowledgeBase()

Generates the separate knowledge-base.md file with deep domain expertise.

**Signature:**
```typescript
private async generateKnowledgeBase(
  design: Design,
  context: WorkflowContext
): Promise<string>
```

**Parameters:**
- `design` (Design): Component design
- `context` (WorkflowContext): Workflow context with research

**Returns:**
- Promise<string>: Markdown content for knowledge-base.md

**Generated Content Includes:**
- Domain-specific best practices
- Integration points and API details
- Contextual intelligence guidelines
- Anti-patterns to avoid
- Industry standards and compliance
- Advanced techniques (correlation, learning, prediction)

**Example:**
```typescript
const knowledgeBase = await this.generateKnowledgeBase(design, context);

// knowledgeBase contains:
// # Knowledge Base: Customer Support Domain
//
// ## Billing Expertise
// ### Integration Points
// - Salesforce API: GET /services/data/...
// - Stripe API: GET /v1/charges/...
// ### Best Practices
// - PCI DSS compliance...
```

### parseAgentFiles()

Parses Claude response into individual agent files.

**Signature:**
```typescript
private parseAgentFiles(response: string): Record<string, string>
```

**Parameters:**
- `response` (string): Claude's response with FILE: markers

**Returns:**
- Record<string, string>: Map of filename to content

**File Format Expected:**
```markdown
FILE: agent-name.md
```markdown
# Agent content here
\```

FILE: another-agent.md
```markdown
# More content
\```
```

## CLI Interface

### create command

Generates comprehensive agents with enhanced research.

**Usage:**
```bash
node dist/index.js create <description> [options]
```

**Arguments:**
- `description` (string): Natural language description of agent

**Options:**
- `--output, -o` (string): Output format ['skill', 'plugin', 'mcp', 'cli', 'library']
- `--language, -l` (string): Programming language ['typescript', 'python']
- `--interactive, -i` (boolean): Interactive mode (default: true)
- `--config, -c` (string): Path to config file
- `--existing-agents-dir` (string): Path to directory with existing agent files to learn from

**Examples:**

```bash
# Generate ultra-concise support agent
node dist/index.js create \
  "Customer support agent for SaaS product handling billing and technical issues" \
  --output skill \
  --interactive false

# Generate AIOps monitoring agent
node dist/index.js create \
  "Monitor Kubernetes cluster with auto-remediation" \
  --output skill

# Generate with existing agent patterns
node dist/index.js create \
  "Customer support agent" \
  --output skill \
  --existing-agents-dir ~/my-company/support-agents/

# Generate with custom config
node dist/index.js create \
  "Sales lead qualification agent" \
  --output skill \
  --config ./custom-config.yaml
```

**Output:**
- Session ID
- Output directory path
- Generated file count
- Deployment location (if auto-deploy enabled)
- Download ZIP path

**Example Output:**
```
✓ Agent created successfully!

Session ID: f6cd711e-07d8-4bb1-9d68-fc0d590fd921
Output directory: ./output/f6cd711e-07d8-4bb1-9d68-fc0d590fd921
Total duration: 517343ms

Generated 13 files (ultra-concise architecture):
  - billing-specialist-agent.md         (< 200 tokens)
  - technical-troubleshooter-agent.md   (< 200 tokens)
  - account-management-agent.md         (< 200 tokens)
  - escalation-coordinator-agent.md     (< 200 tokens)
  - sentiment-analyzer-agent.md         (< 200 tokens)
  - knowledge-base-builder-agent.md     (< 200 tokens)
  - sla-monitor-agent.md                (< 200 tokens)
  - compliance-guardian-agent.md        (< 200 tokens)
  - first-response-agent.md             (< 200 tokens)
  - resolution-tracker-agent.md         (< 200 tokens)
  - feedback-collector-agent.md         (< 200 tokens)
  - knowledge-base.md                   (deep domain expertise)
  - agents.md                           (system overview)

Architecture: Skills (triggers + actions) + Knowledge Base (deep expertise)
```

## Configuration Options

### BuildOptions

```typescript
export interface BuildOptions {
  // Output format
  outputType?: 'skill' | 'plugin' | 'mcp' | 'cli' | 'library';

  // Programming language (for plugins/mcp/cli/library)
  language?: 'typescript' | 'python';

  // Interactive mode
  interactive?: boolean;

  // Quality tier
  qualityTier?: 'simple' | 'advanced';  // Default: 'simple'

  // Auto-deployment
  autoDeploy?: boolean;  // Default: true

  // Path to existing agents directory (for pattern learning)
  existingAgentsDir?: string;

  // Performance priorities
  performance?: {
    speed?: 'low' | 'medium' | 'high';
    quality?: 'low' | 'medium' | 'high';
    trust?: 'low' | 'medium' | 'high';
    parallelization?: 'none' | 'auto' | 'aggressive';
    budget?: 'low' | 'medium' | 'high';
  };
}
```

### Configuration File Format

```yaml
# agent-builder.config.yaml

# Claude API configuration
claude:
  model: "claude-sonnet-4-5-20250929"
  max_tokens: 16000
  thinking_budget: 10000  # For extended thinking

# Output configuration
output:
  directory: "./output"
  auto_deploy: true
  create_zip: true

# Quality settings
quality:
  tier: "advanced"  # or "simple"
  include_tests: true
  include_docs: true
  validate_syntax: true

# Performance optimization
performance:
  speed: "medium"
  quality: "high"
  trust: "medium"
  parallelization: "auto"

# Memory and learning
memory:
  enable_learning: true
  session_retention_days: 90
  pattern_extraction_interval: 10  # Extract patterns every N sessions
```

## Environment Variables

Required and optional environment variables:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...  # Claude API key

# Optional
NODE_ENV=production            # Environment (development/production)
LOG_LEVEL=info                 # Logging level (debug/info/warn/error)
OUTPUT_DIR=./output            # Custom output directory
AUTO_DEPLOY=true               # Enable auto-deployment
```

## Error Handling

### Common Errors

#### Invalid Domain

```typescript
// Error when domain doesn't match AgentDomain type
Error: Invalid domain 'invalid'. Must be one of: aiops, sales, automation, code, data, support, general
```

**Solution:** Rephrase request to match a valid domain.

#### Missing API Key

```typescript
Error: ANTHROPIC_API_KEY environment variable is required
```

**Solution:**
```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

#### Research Parsing Error

```typescript
Error: Failed to parse research response: No JSON block found
```

**Solution:** This indicates Claude's response wasn't properly formatted. The system will retry automatically.

#### Skill Generation Timeout

```typescript
Error: Skill generation timed out after 300000ms
```

**Solution:** Increase timeout in agent config or reduce number of components.

### Error Recovery

The system includes automatic error recovery:

1. **Retry Logic**: Failed API calls retry 3 times with exponential backoff
2. **Graceful Degradation**: Optional phases (tests, docs) continue on failure
3. **Fallback Values**: Missing optional fields use sensible defaults
4. **Context Preservation**: Errors preserve workflow context for debugging

## TypeScript Types

### Complete Type Definitions

```typescript
// Domain categories
export type AgentDomain =
  | 'aiops'        // Monitoring, alerts, remediation
  | 'sales'        // Lead qualification, CRM, outreach
  | 'automation'   // Workflows, data processing, integration
  | 'code'         // Code analysis, generation, review
  | 'data'         // ETL, analysis, reporting
  | 'support'      // Ticketing, knowledge base, response
  | 'general';     // General-purpose agents

// Workflow phases
export type WorkflowPhase =
  | 'research'
  | 'clarification'
  | 'design'
  | 'implementation'
  | 'packaging'
  | 'learning'
  | 'completed';

// Agent result types
export type AgentResultType =
  | 'research_complete'
  | 'clarification_questions'
  | 'clarification_complete'
  | 'design_complete'
  | 'implementation_complete'
  | 'packaging_complete'
  | 'deployment_complete'
  | 'learning_complete';

// Output types
export type OutputType =
  | 'skill'    // Prompt-based markdown agents
  | 'plugin'   // Executable code (formerly 'skill')
  | 'mcp'      // MCP servers
  | 'cli'      // CLI tools
  | 'library'; // Libraries

// Programming languages
export type Language = 'typescript' | 'python';
```

## Rate Limits and Quotas

### Claude API Limits

- **Requests per minute**: 50 (Opus tier)
- **Tokens per minute**: 40,000 input + 20,000 output
- **Extended thinking budget**: 10,000 tokens max per request

### System Limits

- **Max components per design**: 20
- **Max agent files**: 25
- **Max file size**: 100 KB per agent
- **Session retention**: 90 days
- **Pattern extraction**: Every 10 sessions

## Performance Metrics

### Typical Generation Times

| Phase | Simple | Advanced |
|-------|--------|----------|
| Research | 30-60s | 2-3min |
| Clarification | 5-10s | 10-20s |
| Design | 1-2min | 3-5min |
| Implementation | 2-3min | 5-8min |
| Packaging | 10-20s | 10-20s |
| Learning | 5-10s | 5-10s |
| **Total** | **5-8min** | **10-15min** |

### Token Usage

| Phase | Tokens (Input) | Tokens (Output) |
|-------|---------------|-----------------|
| Research | 1,800-2,000 | 2,000-6,000 |
| Design | 1,500-2,000 | 8,000-12,000 |
| Implementation | 800-1,200 | 4,000-8,000 |
| **Total** | **4,000-5,000** | **14,000-26,000** |

## Best Practices

### 1. Ultra-Concise Skill Philosophy

The system enforces a **200-token maximum** per skill to ensure clarity and maintainability:

**Skills should contain:**
- ✅ Triggers (when to activate)
- ✅ Steps (what actions to take)
- ✅ Brief example
- ✅ Link to knowledge base

**Skills should NOT contain:**
- ❌ Deep domain expertise
- ❌ Integration details
- ❌ Best practices sections
- ❌ Long examples

**Rationale:**
- Easier to scan and understand
- Faster to update individual skills
- Clear separation of concerns
- Knowledge base is shared across all skills

### 2. Knowledge Base Usage

All deep content goes in `knowledge-base.md`:
- Integration points (APIs, databases, systems)
- Domain-specific best practices
- Contextual intelligence guidelines
- Anti-patterns to avoid
- Industry standards

Skills reference the knowledge base: `> For deep expertise, see: [Knowledge Base](knowledge-base.md#section)`

### 3. Request Formulation

✅ **Good:**
```
"Customer support agent for SaaS product that handles billing disputes,
technical troubleshooting, and account management. Should integrate with
Salesforce and Jira, learn from past ticket resolutions, and distinguish
between public customer responses and internal notes."
```

✅ **Better (with existing patterns):**
```bash
node dist/index.js create "Customer support agent" \
  --existing-agents-dir ~/my-company/support-agents/
```

❌ **Too Vague:**
```
"Make a support agent"
```

### 2. Domain Hints

Include domain-specific keywords to improve research:

```bash
# AIOps
"monitor", "alert", "remediate", "incident", "runbook"

# Sales
"qualify", "outreach", "CRM", "pipeline", "conversion"

# Support
"ticket", "escalate", "SLA", "resolution", "knowledge base"
```

### 3. Integration Specification

Be specific about integrations you need:

```
"...should query Salesforce for customer tier, check Jira for related
tickets, and learn from PostgreSQL ticket history database"
```

### 4. Context Requirements

Mention contextual factors explicitly:

```
"...must handle both public customer responses (with legal disclaimers)
and internal team notes (with technical details). SLA varies by
customer tier (Enterprise: 30min, Standard: 4hr)."
```

## Migration Guide

### From Basic to Comprehensive

Existing basic skills can be regenerated:

```bash
# Step 1: Save your original request
echo "Customer support for billing issues" > request.txt

# Step 2: Regenerate with enhanced system
node dist/index.js create "$(cat request.txt)" --output skill

# Step 3: Compare outputs
diff -r output/old-session/ output/new-session/

# Result: New version includes:
# - Integration guidance (Slack, Salesforce, Jira)
# - Advanced capabilities (correlation, learning)
# - Contextual intelligence (public/private responses)
# - Domain best practices (ITIL, GDPR compliance)
```

### Updating Existing Deployments

```bash
# Backup existing deployment
cp -r ~/.claude/skills/old-agent ~/.claude/skills/old-agent.backup

# Deploy new comprehensive version
node dist/index.js create "..." --output skill

# Test new version
# If issues, restore backup
cp -r ~/.claude/skills/old-agent.backup ~/.claude/skills/old-agent
```

## Support and Troubleshooting

### Debug Logging

Enable debug logging for detailed output:

```bash
LOG_LEVEL=debug node dist/index.js create "..."
```

### Session Inspection

View session details:

```bash
# List all sessions
node dist/index.js list

# Show specific session
node dist/index.js show <session-id>

# View session log file
cat ~/.synthient/sessions/<session-id>.jsonl
```

### Common Issues

**Issue**: "Generated agents lack integration details"
**Cause**: Research phase didn't capture integration points
**Solution**: Be more specific in request about systems to integrate with

**Issue**: "Skills are too generic"
**Cause**: Using 'simple' quality tier
**Solution**: Use 'advanced' tier or be more specific in domain description

**Issue**: "Generation taking too long"
**Cause**: Extended thinking for large designs
**Solution**: Reduce scope or use 'simple' quality tier

## API Versioning

Current version: `v1.0.0`

Breaking changes policy:
- Major version: Breaking API changes
- Minor version: New features, backwards compatible
- Patch version: Bug fixes

## Changelog

### v1.0.0 (2026-02-12)

**Added:**
- Enhanced Research interface with integration points
- Advanced capabilities identification
- Contextual factor analysis
- Domain-specific depth (best practices, anti-patterns, standards)
- Comprehensive SkillAgent with production-ready output
- Multi-agent generation (8-12 agents vs 4)

**Changed:**
- Research prompt includes integration and advanced capability analysis
- Skill generation incorporates research data for comprehensive agents
- Default quality tier to 'advanced' for production readiness

**Fixed:**
- CLI options now properly pass through workflow
- OutputType correctly routes to SkillAgent for skills
