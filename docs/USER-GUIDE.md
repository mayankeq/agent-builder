# User Guide: Creating Ultra-Concise Skills with Knowledge Base Separation

## Overview

This guide shows you how to create ultra-concise, production-ready AI agents (max 200 tokens per skill) that reference a separate knowledge base for deep domain expertise. This architecture ensures clarity and maintainability while incorporating your organization's knowledge, existing systems integration, and advanced capabilities like learning and correlation.

## Quick Start

### Basic Usage

```bash
# Generate a customer support agent
node dist/index.js create \
  "Customer support agent for handling billing and technical issues" \
  --output skill
```

This creates multiple specialized agents with:
- ✅ Integration guidance for your systems
- ✅ Advanced capabilities (correlation, learning, prediction)
- ✅ Context-aware behavior (public vs internal responses)
- ✅ Domain-specific best practices

### What You Get

After generation completes (~10 minutes), you receive:

1. **Ultra-Concise Agent Files**: 8-12 specialized markdown agents (max 200 tokens each)
2. **Knowledge Base**: `knowledge-base.md` file with deep domain expertise
3. **System Overview**: `agents.md` file explaining the whole system
4. **Auto-Deployment**: Installed to `~/.claude/skills/`
5. **Downloadable Package**: ZIP file in `output/downloads/`

### Architecture: Skill vs Knowledge Base

**New Two-Tier Architecture:**

```
📁 skill-output/
  ├── billing-specialist-agent.md      # Ultra-concise (< 200 tokens)
  ├── technical-support-agent.md       # Ultra-concise (< 200 tokens)
  ├── escalation-agent.md              # Ultra-concise (< 200 tokens)
  ├── knowledge-base.md                # Deep domain expertise
  └── agents.md                        # System overview
```

**Key Principle:**
- **Skills**: Triggers + Actions only (under 50 lines / 200 tokens)
- **Knowledge Base**: Domain expertise, integration details, best practices
- **Separation Benefits**: Clear, maintainable, easy to update

## Step-by-Step Tutorial

### 1. Identify Your Use Case

Think about what organizational problem you're solving:

**Examples:**
- Customer Support: "Reduce ticket response time while maintaining quality"
- AIOps: "Detect and auto-remediate infrastructure failures"
- Sales: "Qualify leads and optimize outreach timing"
- Data: "Automate ETL pipeline monitoring and quality checks"

### 2. Describe Your Agent

Be specific about:
- **What it does**: Core capabilities
- **Where it integrates**: Existing systems (CRM, ticketing, monitoring)
- **What it learns from**: Historical data sources
- **Context requirements**: Public/private, compliance, SLA

**Example Request:**

```
"Customer support agent for SaaS product that handles:
1. Billing disputes and payment issues
2. Technical troubleshooting for API errors
3. Account management requests

Should integrate with:
- Salesforce CRM for customer data
- Jira for ticket correlation
- PostgreSQL ticket history for learning

Must distinguish between:
- Public customer-facing responses (empathetic, compliant)
- Internal team notes (technical, detailed)"
```

### 3. Run the Generation

```bash
node dist/index.js create "<your-description>" --output skill
```

**What Happens:**
1. **Research** (2min): Analyzes your domain and identifies integrations
2. **Clarification** (10s): May ask follow-up questions
3. **Design** (3min): Creates architecture with 8-12 components
4. **Implementation** (5min): Generates comprehensive agent files
5. **Deployment** (10s): Installs to Claude and creates ZIP

### 4. Review Generated Agents

Navigate to the output directory:

```bash
cd output/<session-id>/
ls -l

# Example output:
billing-specialist-agent.md
technical-troubleshooter-agent.md
account-management-agent.md
escalation-coordinator-agent.md
sentiment-analyzer-agent.md
knowledge-base-builder-agent.md
agents.md
```

Open any agent file to see the **ultra-concise format** (max 200 tokens):

```markdown
# Billing Specialist Agent

## Trigger
- Keywords: billing, invoice, payment, refund, charge
- Customer mentions payment issues or disputes
- Similar past billing tickets detected

## Steps
1. Verify customer identity via Salesforce
2. Check billing history in Stripe
3. Query PostgreSQL for similar past tickets
4. Provide resolution with highest success rate
5. Escalate to #finance if amount > $10K

## Example
User: "I was charged twice this month"
Agent: Checking your billing... Found duplicate charge $99.99. Refund initiated. Ref: BIL-2024-1234

---
> For deep expertise, see: [Knowledge Base](knowledge-base.md#billing-expertise)
```

Open the knowledge-base.md to see **deep domain expertise**:

```markdown
# Knowledge Base: Customer Support Domain

## Billing Expertise

### Integration Points
- **Salesforce**: Query customer tier, payment history, account status
  - API: `GET /services/data/v58.0/sobjects/Account/{id}`
- **Stripe**: Transaction details, payment methods, invoice history
  - API: `GET /v1/charges/{charge_id}`
- **PostgreSQL**: 6 months billing ticket history
  - Query: `SELECT * FROM tickets WHERE category='billing' AND created_at > NOW() - INTERVAL '6 months'`

### Best Practices
- PCI DSS compliance for payment data handling
- EU customers: GDPR Article 17 for data deletion
- Enterprise tier: 30-minute SLA for billing issues
- Chargeback prevention strategies

### Context Awareness
**Public Customer Response:**
- Empathetic tone + legal disclaimers
- Avoid technical jargon
- Include reference number

**Internal Team Notes:**
- Transaction IDs + error codes
- Technical root cause
- Escalation history

[...continues with advanced techniques, anti-patterns, etc.]
```

### 5. Customize if Needed

The generated agents are production-ready but can be customized:

```markdown
<!-- Add company-specific information -->
## Company-Specific Knowledge
- Payment processing: We use Stripe + manual ACH for enterprise
- Refund policy: 30 days, prorated for subscriptions
- Escalation: Billing issues >$10K go directly to Finance team
```

### 6. Deploy and Use

#### Auto-Deployment (Default)

Agents are already installed to:
```
~/.claude/skills/<session-id>/
```

You can use them immediately in Claude Code with slash commands:
```
/billing-specialist What's the refund policy for annual subscriptions?
/technical-troubleshooter API returning 403 errors
```

#### Manual Deployment

Or use the downloadable ZIP:

```bash
# Download location
ls output/downloads/<session-id>-skill.zip

# Extract to desired location
unzip output/downloads/<session-id>-skill.zip -d ~/my-agents/

# Install to Claude
cp -r ~/my-agents/ ~/.claude/skills/my-custom-name/
```

## Learning from Existing Agents

### Use Existing Agents as Patterns

If you have existing agent files, you can provide them as examples for the system to learn from:

```bash
node dist/index.js create \
  "Customer support agent for SaaS product" \
  --output skill \
  --existing-agents-dir ~/my-company/existing-agents/
```

**What gets learned:**
- Agent structure patterns (sections, formatting)
- Naming conventions and style
- Integration patterns you already use
- Domain-specific terminology

**Example existing agent directory structure:**
```
~/my-company/existing-agents/
├── agents.md                    # Analyzed for structure
├── billing-agent.md             # Analyzed for patterns
├── technical-agent.md           # Analyzed for patterns
├── CLAUDE.md                    # Optional: guidelines
└── .cursorrules                 # Optional: rules
```

The system will:
1. Read all `.md` files in the directory
2. Extract common sections and structure patterns
3. Analyze style (heading case, bullet format, emoji usage)
4. Apply learned patterns to newly generated agents

### Pattern Learning Benefits

✅ **Consistency**: New agents match your existing style
✅ **Integration**: Reuse your organization's integration patterns
✅ **Terminology**: Use your company's specific terms and acronyms
✅ **Structure**: Follow your established agent organization

## Advanced Usage

### Domain-Specific Generation

#### AIOps Agents

```bash
node dist/index.js create \
  "AIOps agent for Kubernetes cluster monitoring with:
  - Integration with Prometheus for metrics
  - PagerDuty for alerting
  - Datadog for log correlation
  - Auto-remediation via kubectl
  - Learning from incident history in PostgreSQL
  - Runbook automation for common failures" \
  --output skill
```

**Generated Agents:**
- Health Monitor
- Anomaly Detector
- Auto-Remediator
- Incident Correlator
- Runbook Executor
- Alert Router
- Postmortem Generator
- Capacity Planner

#### Sales Agents

```bash
node dist/index.js create \
  "Sales agent for B2B SaaS lead qualification with:
  - Integration with Salesforce for lead data
  - HubSpot for email engagement tracking
  - Call recording system for conversation analysis
  - Learning from won/lost deal patterns
  - BANT qualification framework
  - Optimal outreach timing based on engagement data" \
  --output skill
```

**Generated Agents:**
- Lead Qualifier
- Outreach Optimizer
- Engagement Tracker
- Deal Stage Advisor
- Objection Handler
- Pricing Strategy Agent
- Competitive Intelligence
- Win/Loss Analyzer

### Integration Specification

Be explicit about integrations:

```bash
node dist/index.js create \
  "Support agent that:

  INTEGRATIONS:
  - Tribal Knowledge: Slack #support-wins, Confluence runbook wiki
  - Ticketing: Jira Service Desk API for correlation
  - CRM: Salesforce for customer tier and SLA
  - Database: PostgreSQL support_tickets table (6 months history)
  - Monitoring: Datadog for system health context

  ADVANCED CAPABILITIES:
  - Correlate current issue to past tickets by error pattern
  - Learn which resolution methods have highest success rates
  - Predict escalation likelihood based on sentiment
  - Build knowledge base from resolution patterns

  CONTEXT:
  - Public customer: Empathetic, compliant, no technical jargon
  - Internal team: Technical details, root cause, system logs
  - SLA varies: Enterprise 30min, Professional 2hr, Basic 24hr" \
  --output skill
```

### Quality Control

#### Review Before Deployment

```bash
# Generate but don't auto-deploy
node dist/index.js create "..." \
  --output skill \
  --auto-deploy false

# Review generated files
cd output/<session-id>/
cat agents.md  # System overview

# If satisfied, deploy manually
cp -r . ~/.claude/skills/my-agent/
```

#### Validate Integration Guidance

Check that generated agents reference your actual systems:

```bash
# Search for integration references
grep -r "Salesforce\|Jira\|Slack" output/<session-id>/

# Should see specific guidance like:
# "Query Salesforce CRM API endpoint..."
# "Check Jira for related tickets using..."
# "Reference #support-wins Slack channel for..."
```

## Use Cases by Domain

### Customer Support

**Common Scenarios:**
- Multi-tier support (L1, L2, L3 escalation)
- Knowledge base building from tickets
- SLA management by customer tier
- Sentiment-based escalation
- Compliance (GDPR, data handling)

**Sample Request:**
```
"Customer support system for SaaS with billing, technical, and account issues.
Integrates with Zendesk, Salesforce, and Stripe. Must handle public responses
with GDPR compliance and internal technical notes. SLA: 30min Enterprise,
2hr Standard."
```

### AIOps

**Common Scenarios:**
- Infrastructure monitoring and alerting
- Auto-remediation of common failures
- Incident correlation and root cause
- Capacity planning from historical patterns
- Runbook automation

**Sample Request:**
```
"Kubernetes monitoring agent with Prometheus metrics, PagerDuty alerting,
Datadog logs. Auto-restart failed pods, correlate to past incidents,
learn from remediation success rates. Integrate with runbook repository."
```

### Sales Automation

**Common Scenarios:**
- Lead qualification and scoring
- Outreach timing optimization
- Deal stage progression
- Competitive intelligence
- Win/loss analysis

**Sample Request:**
```
"B2B sales agent for lead qualification using BANT framework. Integrates
with Salesforce CRM, HubSpot email tracking, Gong call recordings. Learn
optimal outreach timing from engagement patterns. Predict deal likelihood."
```

### Data Operations

**Common Scenarios:**
- ETL pipeline monitoring
- Data quality validation
- Anomaly detection in metrics
- Cost optimization alerts
- Compliance checking

**Sample Request:**
```
"Data pipeline monitoring agent for Airflow DAGs. Integrate with PostgreSQL
for data quality checks, Datadog for performance metrics, Slack for alerts.
Detect anomalies in data patterns, predict pipeline failures, optimize costs."
```

## Troubleshooting

### "Agents are too verbose"

**Problem:** Generated agents exceed 200 tokens

**Solution:** The system automatically enforces 200-token limit for skills. Deep content goes to knowledge-base.md. If you see verbose agents, this may be an older version - ensure you're using the latest build.

### "Agents are too generic"

**Problem:** Generated agents lack specific integration details

**Solution:** Be more explicit in your request, or provide existing agents as examples:
```bash
# Too vague
"Create a support agent"

# Better - explicit integrations
"Create a support agent that queries Salesforce CRM via API,
correlates issues to Jira tickets, and learns from PostgreSQL
ticket_history table"

# Best - learn from existing patterns
"Create a support agent" \
  --existing-agents-dir ~/my-company/support-agents/
```

### "Missing advanced features"

**Problem:** Agents don't show correlation or learning

**Solution:** Mention these explicitly:
```bash
node dist/index.js create \
  "Support agent that correlates current issues to past tickets,
  learns from resolution success rates, and predicts escalation
  likelihood based on sentiment analysis" \
  --output skill
```

### "Wrong context handling"

**Problem:** Agents don't distinguish public vs internal responses

**Solution:** Specify context requirements:
```bash
"...must provide different responses for:
- Public customer (empathetic, GDPR-compliant, no jargon)
- Internal team (technical, with logs and error codes)
- Management reports (high-level, with metrics)"
```

### "Generation taking too long"

**Problem:** Generation exceeds 15 minutes

**Cause:** Large number of components with extended thinking

**Solutions:**
1. **Simplify scope**: Reduce capabilities in request
2. **Use simple tier**: `--quality-tier simple` (faster, less comprehensive)
3. **Increase timeout**: Modify `agentConfig.timeout` in code

## Best Practices

### 1. Start Specific, Then Expand

```bash
# Start with core use case
"Billing support agent with Stripe integration"

# Then expand with learnings
"Billing support agent with Stripe + Salesforce integration,
learning from ticket history, GDPR-compliant"
```

### 2. Reference Actual Systems

Use real system names in your organization:

```bash
# Generic (less useful)
"Integrate with CRM and ticketing system"

# Specific (better)
"Integrate with Salesforce CRM and Jira Service Desk"
```

### 3. Include Compliance Requirements

```bash
"...must comply with GDPR Article 17 for data deletion,
PCI DSS for payment data, SOC2 for audit logging"
```

### 4. Specify Learning Sources

```bash
"...learn from:
- PostgreSQL support_tickets table (1 year history)
- Zendesk CSAT scores
- Resolution time metrics by issue type
- Escalation patterns by customer tier"
```

### 5. Test with Real Scenarios

After generation, test with actual examples:

```markdown
<!-- Test billing dispute -->
User: "I was charged twice this month!"

<!-- Expected: -->
- Checks Salesforce for customer tier
- Queries Stripe for recent transactions
- Correlates to past double-charge tickets
- Provides resolution that worked in 95% of similar cases
- Includes empathetic language + legal disclaimer
```

## Next Steps

### 1. Generate Your First Agent

```bash
# Fill in your use case
node dist/index.js create "<your-specific-use-case>" --output skill
```

### 2. Review Generated Agents

Open `agents.md` to understand the system, then review individual agent files.

### 3. Customize if Needed

Add company-specific knowledge, policies, or integration details.

### 4. Deploy and Test

Use slash commands in Claude Code to test agents with real scenarios.

### 5. Iterate

Regenerate with refined requirements based on testing:

```bash
# Save what worked
echo "Original request + what to add/change" > refined-request.txt

# Regenerate
node dist/index.js create "$(cat refined-request.txt)" --output skill
```

## Getting Help

### Documentation
- [Comprehensive Skills Architecture](./COMPREHENSIVE-SKILLS.md)
- [API Reference](./API-REFERENCE.md)
- [Examples](../output/)

### Common Questions

**Q: How many agents should I create?**
A: The system generates 8-12 agents automatically based on your domain. Each represents a specialized capability.

**Q: Can I combine multiple domains?**
A: Yes! Describe your needs clearly: "Support + Sales agent that handles customer issues and identifies upsell opportunities"

**Q: How do I update an agent?**
A: Regenerate with refined requirements. The system learns from your feedback.

**Q: What about Python vs TypeScript?**
A: Skills (prompt-based) are language-agnostic. Plugins/MCP/CLI can be TypeScript or Python.

**Q: Can I use this for production?**
A: Yes! The comprehensive agents are designed for production use with real integrations.

## Examples

See the `output/` directory for real examples:
- Customer Support System (12 agents)
- AIOps Monitoring (10 agents)
- Sales Automation (9 agents)

Each includes full integration guidance, advanced capabilities, and context-aware behavior.
