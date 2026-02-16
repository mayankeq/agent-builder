import { BaseAgent } from './base-agent';
import { WorkflowContext, WorkflowPhase, Design } from '../types/workflow';
import { AgentConfig, AgentResult } from '../types/agent';
import { ClaudeClient } from '../claude/claude-client';
import { getSystemPrompt } from '../claude/prompt-templates';
import { formatExistingAgentPattern, analyzeExistingAgentPattern } from '../utils/existing-agent-reader';

/**
 * Skill Agent - Generates prompt-based markdown agents
 * Creates multiple agent .md files + agents.md index
 */
export class SkillAgent extends BaseAgent {
  private claudeClient: ClaudeClient;

  constructor(config: AgentConfig, claudeClient: ClaudeClient) {
    super(config);
    this.claudeClient = claudeClient;
  }

  getName(): string {
    return 'SkillAgent';
  }

  getPhase(): WorkflowPhase {
    return 'implementation';
  }

  async execute(context: WorkflowContext): Promise<AgentResult> {
    this.validateContext(context);
    this.startExecution();

    try {
      if (!context.design) {
        throw new Error('Design must be available for skill generation');
      }

      this.logProgress('Generating prompt-based skill agents');

      const agents = await this.generateAgents(context.design, context);
      const knowledgeBase = await this.generateKnowledgeBase(context.design, context);

      this.logProgress('Skill generation completed', {
        agentCount: Object.keys(agents).length,
      });

      this.endExecution(true);

      return {
        type: 'implementation_complete',
        data: {
          code: {
            ...agents,
            'knowledge-base.md': knowledgeBase
          }
        }, // Return as 'code' for compatibility
        nextPhase: 'implementation',
      };
    } catch (error) {
      this.endExecution(false, error as Error);
      throw error;
    }
  }

  /**
   * Generate multiple agent markdown files + agents.md index
   */
  private async generateAgents(
    design: Design,
    context: WorkflowContext
  ): Promise<Record<string, string>> {
    const prompt = this.buildSkillPrompt(design, context);

    this.logProgress('Requesting skill agents from Claude');

    const response = await this.claudeClient.complete({
      prompt,
      systemPrompt: getSystemPrompt('skill'),
      model: this.config.model,
      maxTokens: this.config.maxTokens || 2000,
    });

    // Parse markdown files from response
    const agents = this.parseAgentFiles(response.text);

    // Ensure we have agents.md
    if (!agents['agents.md']) {
      agents['agents.md'] = this.generateAgentsIndex(design, context);
    }

    return agents;
  }

  /**
   * Build prompt for skill generation - ULTRA-CONCISE FORMAT (200 tokens per skill)
   */
  private buildSkillPrompt(
    design: Design,
    context: WorkflowContext
  ): string {
    const domain = context.research?.domain || 'general';
    const userIntent = context.research?.userIntent || context.userRequest;
    const components = design.components;

    // Include existing agent patterns if available
    let existingAgentSection = '';
    if (context.existingAgents && context.existingAgents.agentFiles.size > 0) {
      const analysis = analyzeExistingAgentPattern(context.existingAgents);
      const formattedPattern = formatExistingAgentPattern(context.existingAgents);

      existingAgentSection = `
# IMPORTANT: Learn from Existing Agent Patterns

You have access to existing agent files that demonstrate the desired style, structure, and quality.
**FOLLOW THE STYLE AND STRUCTURE OF THESE EXISTING AGENTS CLOSELY**.

## Pattern Analysis
**Common Sections Found**: ${analysis.commonSections.join(', ') || 'Various sections'}
**Structure Patterns**: ${analysis.structurePatterns.join('; ') || 'Multiple agent files'}
**Style Notes**: ${analysis.styleNotes.join('; ') || 'Consistent formatting'}

## Existing Agent Examples
${formattedPattern}

**YOUR TASK**: Generate new agents that match the style, tone, structure, and quality of the examples above.
- Use similar section headings and organization
- Match the level of detail and depth shown in examples
- Follow the same formatting conventions (bullets, code blocks, etc.)
- Maintain consistent tone and voice
- Include similar types of examples and guidance
- Respect any conciseness constraints while matching example quality

---

`;
    }

    return `${existingAgentSection}
# Generate Ultra-Concise Skills (MAX 200 tokens each)

## Context
Domain: ${domain}
Intent: ${userIntent}
Components: ${components.length}

## Components to Create
${components.map((c, i) => `${i + 1}. ${c.name} - ${c.description}`).join('\n')}

## ULTRA-CONCISE FORMAT (MANDATORY)

For EACH component, create ONE ultra-concise markdown file:

\`\`\`
FILE: <component-name>-agent.md
\`\`\`markdown
# <Component Name>

## Trigger
- <condition 1>
- <condition 2>

## Steps
1. <action>
2. <action>
3. <action>

## Example
User: <brief question>
Agent: <brief response>

**Note**: Consult knowledge-base.md for detailed domain information.
\`\`\`

Also generate:

\`\`\`
FILE: agents.md
\`\`\`markdown
# ${userIntent}

${components.map((c, i) => `${i + 1}. [${c.name}](./${c.name.toLowerCase().replace(/\s+/g, '-')}-agent.md) - ${c.responsibilities[0] || c.description}`).join('\n')}
\`\`\`

**CRITICAL CONSTRAINTS**:
- Each skill MUST be under 50 lines / 200 tokens
- NO "Key Knowledge", "Integration Points", or "Contextual Intelligence" sections
- Use bullet points, not paragraphs
- Keep examples to 1-2 lines each
- Skills reference knowledge-base.md for domain expertise
- Focus ONLY on triggers and actions
- Total per skill: under 200 tokens
`;
  }

  /**
   * Generate knowledge-base.md with deep domain expertise
   * This separates knowledge from skills to keep skills under 200 tokens
   */
  private async generateKnowledgeBase(
    design: Design,
    context: WorkflowContext
  ): Promise<string> {
    const domain = context.research?.domain || 'general';
    const userIntent = context.research?.userIntent || context.userRequest;
    const research = context.research;

    const prompt = `
# Generate Comprehensive Knowledge Base

## Context
**Domain**: ${domain}
**User Intent**: ${userIntent}
**Components**: ${design.components.map(c => c.name).join(', ')}

## Task
Create a comprehensive knowledge base document (2000-3000 tokens) that serves as the central repository of domain expertise for this agent system.

## Research Findings to Incorporate
${research?.integrationPoints ? `
### Integration Points
${research.integrationPoints.tribalKnowledge ? `**Tribal Knowledge**: ${research.integrationPoints.tribalKnowledge.join(', ')}` : ''}
${research.integrationPoints.existingSystems ? `**Existing Systems**: ${research.integrationPoints.existingSystems.join(', ')}` : ''}
${research.integrationPoints.dataSources ? `**Data Sources**: ${research.integrationPoints.dataSources.join(', ')}` : ''}
` : ''}

${research?.advancedCapabilities ? `
### Advanced Capabilities
${research.advancedCapabilities.map(cap => `- ${cap}`).join('\n')}
` : ''}

${research?.contextualFactors ? `
### Contextual Factors
${research.contextualFactors.map(factor => `- ${factor}`).join('\n')}
` : ''}

${research?.domainSpecificDepth ? `
### Domain-Specific Information
${research.domainSpecificDepth.bestPractices ? `**Best Practices**: ${research.domainSpecificDepth.bestPractices.join('; ')}` : ''}
${research.domainSpecificDepth.antiPatterns ? `**Anti-Patterns**: ${research.domainSpecificDepth.antiPatterns.join('; ')}` : ''}
` : ''}

## Required Structure

\`\`\`markdown
# Knowledge Base: ${userIntent}

## Domain Overview
[Brief domain description - what this system is about, its purpose, and scope]

## Core Concepts
[Key concepts, terminology, and fundamental principles that all agents should understand]

## Integration Points

### Tribal Knowledge Sources
[Detailed information about where to find undocumented expertise, who to consult, common patterns learned from experience]

### Existing Systems
[How to integrate with existing tools, APIs, databases, and workflows. Include authentication, data formats, and common integration patterns]

### Data Sources
[Historical data repositories, logs, metrics, and analytics sources. How to query, interpret, and learn from past patterns]

## Best Practices

### Industry Standards
[Recognized best practices in this domain, frameworks to follow, compliance requirements]

### Operational Excellence
[Day-to-day operational best practices, efficiency tips, quality standards]

### Communication Guidelines
[How to communicate effectively in this domain - tone, terminology, escalation protocols]

## Anti-Patterns

### Common Mistakes
[Frequent errors made by novices, misunderstandings to avoid]

### Technical Pitfalls
[Technical anti-patterns specific to this domain]

### Process Anti-Patterns
[Workflow and process mistakes to avoid]

## Contextual Rules

### Audience Adaptation
[How to adjust responses based on audience: customer vs internal team, executive vs engineer, etc.]

### Urgency Handling
[How to assess and respond to different urgency levels, SLA considerations]

### Escalation Criteria
[Clear criteria for when to escalate to humans, how to prepare context for handoff]

### Context-Aware Behavior
[How agents should adapt based on time of day, system load, user history, etc.]

## Domain-Specific Expertise

### Technical Deep Dive
[In-depth technical knowledge specific to this domain]

### Business Context
[Business rules, policies, and strategic considerations]

### Edge Cases
[Known edge cases and how to handle them]

## Learning and Improvement

### Feedback Loops
[How to learn from outcomes, track success metrics, incorporate feedback]

### Pattern Recognition
[Common patterns to recognize, how to correlate current situations with past examples]

### Continuous Improvement
[How agents should evolve and improve over time]

## Reference Materials
[Links to documentation, wikis, runbooks, and other reference materials]
\`\`\`

**REQUIREMENTS**:
- 2000-3000 tokens of comprehensive content
- Deep domain expertise, not generic advice
- Specific, actionable information
- Reference all research findings provided
- Include real integration details and contextual rules
- Provide concrete examples where applicable
- Make it valuable for production use by agents

Generate the complete knowledge base now.
`;

    this.logProgress('Generating comprehensive knowledge base from research findings');

    const response = await this.claudeClient.complete({
      prompt,
      systemPrompt: getSystemPrompt('implementation'),
      model: this.config.model,
      maxTokens: 4000,
    });

    return response.text.trim();
  }

  /**
   * Parse agent markdown files from Claude response
   * Uses multiple fallback strategies for robustness
   */
  private parseAgentFiles(response: string): Record<string, string> {
    const files: Record<string, string> = {};

    // Strategy 1: FILE: markers with markdown code blocks
    const filePattern = /FILE:\s*([^\n]+\.md)\s*\n```(?:markdown)?\n([\s\S]*?)```/gi;
    let match;
    while ((match = filePattern.exec(response)) !== null) {
      const filename = match[1].trim();
      const content = match[2].trim();
      files[filename] = content;
    }
    if (Object.keys(files).length > 0) {
      this.logProgress(`Parsed ${Object.keys(files).length} files using FILE: markers`);
      return files;
    }

    // Strategy 2: JSON format { "filename.md": "content", ... }
    try {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          const mdFiles = Object.entries(parsed).filter(([k]) => k.endsWith('.md'));
          if (mdFiles.length > 0) {
            mdFiles.forEach(([filename, content]) => {
              files[filename] = content as string;
            });
            this.logProgress(`Parsed ${Object.keys(files).length} files from JSON`);
            return files;
          }
        }
      }
    } catch (e) {
      // JSON parsing failed, continue to next strategy
    }

    // Strategy 3: Multiple markdown code blocks, infer filenames from headings
    const codeBlocks = response.matchAll(/```markdown\n([\s\S]*?)```/gi);
    let blockIndex = 0;
    for (const block of codeBlocks) {
      const content = block[1].trim();
      // Try to extract agent name from first heading
      const headingMatch = content.match(/^#\s+(.+?)(?:\s+Agent)?$/m);
      if (headingMatch) {
        const agentName = headingMatch[1]
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        const filename = `${agentName}-agent.md`;
        files[filename] = content;
      } else {
        // No heading found, use generic name
        files[`agent-${blockIndex + 1}.md`] = content;
      }
      blockIndex++;
    }
    if (Object.keys(files).length > 0) {
      this.logProgress(`Parsed ${Object.keys(files).length} files from markdown blocks`);
      return files;
    }

    // Strategy 4: Direct markdown content (no code blocks)
    // Split by "# " (top-level headings) to separate agents
    const sections = response.split(/(?=^# [A-Z])/m).filter(s => s.trim().length > 0);
    sections.forEach((section, index) => {
      const headingMatch = section.match(/^#\s+(.+?)(?:\s+Agent)?$/m);
      if (headingMatch) {
        const agentName = headingMatch[1]
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        const filename = `${agentName}-agent.md`;
        files[filename] = section.trim();
      } else if (index === 0 && section.includes('Agent System')) {
        // This is likely the agents.md index file
        files['agents.md'] = section.trim();
      }
    });
    if (Object.keys(files).length > 0) {
      this.logProgress(`Parsed ${Object.keys(files).length} files from direct markdown`);
      return files;
    }

    // Strategy 5: Last resort - treat entire response as single agent
    if (response.trim().length > 0) {
      this.logProgress('Using entire response as single agent file');
      files['main-agent.md'] = response.trim();
      return files;
    }

    return files;
  }

  /**
   * Generate agents.md index as fallback
   */
  private generateAgentsIndex(design: Design, context: WorkflowContext): string {
    const domain = context.research?.domain || 'general';
    const components = design.components;
    const userIntent = context.research?.userIntent || context.userRequest;

    return `# ${context.userRequest}

## Purpose
${userIntent}

## System Overview
This ${domain} agent system consists of ${components.length} specialized agents, each handling a specific aspect of the workflow. Together, they provide comprehensive coverage while maintaining ultra-concise, focused implementations.

## Architecture
- **Skills**: ${components.length} ultra-concise agents (< 200 tokens each)
- **Knowledge Base**: Comprehensive domain expertise in [knowledge-base.md](./knowledge-base.md)
- **Integration**: ${design.integrations?.length || 0} external system${design.integrations?.length !== 1 ? 's' : ''}

## Agents

${components.map((c, i) => `### ${i + 1}. [${c.name}](./${c.name.toLowerCase().replace(/\s+/g, '-')}-agent.md)

**Purpose**: ${c.description}

**Key Responsibilities**:
${c.responsibilities.slice(0, 3).map(r => `- ${r}`).join('\n')}

**When to use**: ${this.generateUsageHint(c)}
`).join('\n')}

## Getting Started

1. **Read the Knowledge Base**: Start with [knowledge-base.md](./knowledge-base.md) for comprehensive domain context
2. **Select the Right Agent**: Use the agent list above to find the most relevant skill for your task
3. **Follow the Agent's Steps**: Each agent provides clear triggers and action steps
4. **Reference Knowledge**: Agents link back to the knowledge base for detailed information

## Domain Context
**${domain.charAt(0).toUpperCase() + domain.slice(1)}** - ${this.getDomainDescription(domain)}

---

*Generated with [Synthient Agent-Builder](https://github.com/your-org/agent-builder) - Ultra-concise skills with automatic knowledge base generation*
`;
  }

  /**
   * Generate usage hint for a component
   */
  private generateUsageHint(component: any): string {
    const name = component.name.toLowerCase();

    // Generate contextual hints based on component name patterns
    if (name.includes('monitor') || name.includes('watch')) {
      return 'For continuous monitoring and alerting scenarios';
    } else if (name.includes('analyze') || name.includes('review')) {
      return 'When detailed analysis or evaluation is needed';
    } else if (name.includes('create') || name.includes('generat')) {
      return 'For creating new content or artifacts';
    } else if (name.includes('process') || name.includes('transform')) {
      return 'For data transformation and processing tasks';
    } else if (name.includes('route') || name.includes('dispatch')) {
      return 'For workflow routing and task distribution';
    } else if (name.includes('report') || name.includes('metric')) {
      return 'For reporting and metrics tracking';
    } else {
      return `For ${component.responsibilities[0]?.toLowerCase() || 'specialized tasks'}`;
    }
  }

  /**
   * Get domain description
   */
  private getDomainDescription(domain: string): string {
    const descriptions: Record<string, string> = {
      aiops: 'Automated IT Operations - monitoring, alerting, and remediation',
      sales: 'Sales automation - lead qualification, outreach, and CRM management',
      automation: 'Workflow automation - task scheduling and system integration',
      code: 'Code assistance - analysis, generation, and review',
      data: 'Data processing - ETL, analytics, and reporting',
      support: 'Customer support - ticketing, knowledge base, and response generation',
      marketing: 'Marketing automation - content creation, campaigns, and analytics',
      general: 'General assistance across multiple domains',
    };

    return descriptions[domain] || descriptions.general;
  }
}
