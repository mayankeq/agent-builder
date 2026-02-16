import { BaseAgent } from './base-agent';
import { WorkflowContext, WorkflowPhase, Requirements, Design } from '../types/workflow';
import { AgentConfig, AgentResult } from '../types/agent';
import { ClaudeClient } from '../claude/claude-client';
import { getSystemPrompt } from '../claude/prompt-templates';
import { parseDesign } from '../claude/response-parser';

/**
 * Design Agent - Creates architecture design using extended thinking
 * Analyzes requirements deeply and produces comprehensive design
 */
export class DesignAgent extends BaseAgent {
  private claudeClient: ClaudeClient;
  private extendedThinkingBudget: 'low' | 'medium' | 'high';

  constructor(config: AgentConfig, claudeClient: ClaudeClient) {
    super(config);
    this.claudeClient = claudeClient;
    this.extendedThinkingBudget = 'high'; // Default to high for quality designs
  }

  getName(): string {
    return 'DesignAgent';
  }

  getPhase(): WorkflowPhase {
    return 'design';
  }

  async execute(context: WorkflowContext): Promise<AgentResult> {
    this.validateContext(context);
    this.startExecution();

    try {
      if (!context.requirements) {
        throw new Error('Requirements must be available for design phase');
      }

      this.logProgress('Starting architecture design with extended thinking');

      const design = await this.designArchitecture(
        context.requirements,
        context
      );

      this.logProgress('Design completed', {
        components: design.components.length,
        decisions: design.decisions.length,
        thinkingPhases: design.thinkingTrace?.length || 0,
      });

      this.endExecution(true);

      return {
        type: 'design_complete',
        data: { design },
        nextPhase: 'implementation',
        metadata: {
          thinkingUsed: design.thinkingTrace !== undefined,
        },
      };
    } catch (error) {
      this.endExecution(false, error as Error);
      throw error;
    }
  }

  /**
   * Design architecture using extended thinking
   */
  private async designArchitecture(
    requirements: Requirements,
    context: WorkflowContext
  ): Promise<Design> {
    const prompt = this.buildDesignPrompt(requirements, context);

    this.logProgress('Requesting design from Claude with extended thinking');

    const response = await this.claudeClient.completeWithExtendedThinking({
      prompt,
      systemPrompt: getSystemPrompt('design'),
      model: this.config.model,
      maxTokens: this.config.maxTokens || 16000,
      extendedThinking: {
        enabled: true,
        budget: this.extendedThinkingBudget,
      },
    });

    const design = parseDesign(response.text);

    // Capture thinking trace for learning
    if (response.thinkingBlocks && response.thinkingBlocks.length > 0) {
      design.thinkingTrace = response.thinkingBlocks;
      context.captureThinking({
        phase: 'design',
        thinkingContent: response.thinkingBlocks,
        decisions: design.decisions,
        tradeoffs: design.tradeoffs,
      });
    }

    return design;
  }

  /**
   * Build comprehensive design prompt
   */
  private buildDesignPrompt(
    requirements: Requirements,
    context: WorkflowContext
  ): string {
    // Retrieve similar patterns from memory (if available)
    const similarPatterns = context.memory?.findSimilarPatterns?.(requirements) || [];

    const domain = context.research?.domain || 'general';
    const domainGuidance = this.getDomainGuidance(domain);

    return `
# Agent Design Task

## User Request
${context.userRequest}

## Domain Context
**Domain**: ${domain}
**Domain-Specific Considerations**:
${domainGuidance}

## Research Findings
**User Intent**: ${context.research?.userIntent || 'Not available'}
**Required Capabilities**:
${(context.research?.capabilities || []).map((cap, i) => `${i + 1}. ${cap}`).join('\n')}
**Success Criteria**:
${(context.research?.successCriteria || []).map((sc, i) => `${i + 1}. ${sc}`).join('\n')}

## Requirements

### Functional Requirements
${requirements.functional.map((req, i) => `${i + 1}. ${req}`).join('\n')}

### Technical Requirements
${JSON.stringify(requirements.technical, null, 2)}

### Architectural Preferences
${JSON.stringify(requirements.architectural, null, 2)}

### Performance Priorities
${this.formatPerformancePriorities(requirements.performance)}

### Output Specifications
- Type: ${requirements.output.type || 'Not specified'}
- Language: ${requirements.output.language || 'Not specified'}

${requirements.output.type === 'skill' ? `
### CRITICAL FOR SKILLS OUTPUT
Since you're designing SKILLS (not code), you MUST break down the system into **5-15+ specialized, focused skills**:
- Each skill handles ONE specific task/scenario
- Think granularly: separate skills for different content types, channels, stages, or use cases
- Examples for a marketing agent: blog-content-skill, social-media-skill, email-campaigns-skill, case-study-skill, technical-whitepaper-skill, competitive-analysis-skill, content-review-skill, seo-optimization-skill, brand-voice-skill, metrics-reporting-skill
- DO NOT create one monolithic catch-all skill
- Each skill will be ultra-concise (200 tokens) with knowledge base for depth
` : ''}

## Similar Patterns from Memory
${similarPatterns.length > 0
  ? JSON.stringify(similarPatterns, null, 2)
  : 'No similar patterns found'
}

## Design Task

Use extended thinking to deeply analyze these requirements and design a comprehensive architecture **appropriate for the ${domain} domain**.

**CRITICAL**: Your design should match the domain. For example:
- **AIOps agents**: Design monitoring loops, alert handlers, remediation workflows
- **Sales agents**: Design lead scoring logic, CRM integrations, email/notification systems
- **Automation agents**: Design workflow orchestrators, data processors, integration connectors
- **Code agents**: Design parsers, generators, analyzers, validators
- **Data agents**: Design ETL pipelines, data transformers, storage systems, analytics
- **Support agents**: Design ticket routers, knowledge base queries, response generators

Consider:
1. **Component Architecture**: ${requirements.output.type === 'skill'
  ? 'Design 5-15+ specialized skills, each handling ONE specific task. Break down by: content types, channels, stages, use cases, or scenarios. Each skill = one .md file.'
  : 'What are the main components and their responsibilities? (Use domain-appropriate terminology)'}
2. **Data Flow**: How does data/work flow through the system?
3. **Technology Stack**: What languages, frameworks, libraries, and APIs are needed?
4. **File Structure**: How should the project be organized?
5. **Integration Points**: What external systems, APIs, or services are involved?
6. **Design Decisions**: What critical choices must be made and why?
7. **Trade-offs**: What are you prioritizing and what are you sacrificing?
8. **Performance Optimizations**: How will you achieve the performance priorities?

Think through:
- Multiple approaches appropriate for this domain and their pros/cons
- Domain-specific edge cases and failure modes
- Scalability and reliability patterns for this domain
- Testing strategies appropriate for the domain
- Security considerations specific to this domain

Return your design as a structured JSON object with this format:
{
  "components": [
    {
      "name": "ComponentName",
      "type": "class|module|function|interface",
      "description": "What this component does",
      "responsibilities": ["responsibility1", "responsibility2"],
      "dependencies": ["dependency1", "dependency2"]
    }
  ],
  "dataFlow": "Description of how data flows through the system",
  "techStack": [
    {
      "name": "Technology name",
      "category": "language|framework|library|tool",
      "version": "1.0.0",
      "justification": "Why this technology"
    }
  ],
  "fileStructure": {
    "src/": {
      "type": "directory",
      "description": "Source code",
      "children": {}
    }
  },
  "integrations": [
    {
      "system": "External system name",
      "method": "API|SDK|CLI",
      "description": "How integration works"
    }
  ],
  "decisions": [
    {
      "topic": "Decision area",
      "decision": "What was decided",
      "reasoning": "Why",
      "alternatives": ["option1", "option2"]
    }
  ],
  "tradeoffs": [
    {
      "aspect": "What aspect",
      "chosen": "What we chose",
      "rejected": "What we didn't choose",
      "rationale": "Why"
    }
  ],
  "optimizations": ["optimization1", "optimization2"]
}
`;
  }

  /**
   * Get domain-specific design guidance
   */
  private getDomainGuidance(domain: string): string {
    const guidance: Record<string, string> = {
      aiops: `- Focus on monitoring loops, health checks, and auto-remediation workflows
- Design for reliability: retries, circuit breakers, failure detection
- Include alerting and notification systems
- Consider rate limiting and backoff strategies
- Plan for observability: logging, metrics, tracing`,

      sales: `- Focus on lead qualification logic, scoring systems, and routing
- Design CRM integrations (Salesforce, HubSpot, etc.)
- Include email/SMS outreach capabilities
- Plan for data enrichment and validation
- Consider compliance (GDPR, CAN-SPAM, opt-outs)`,

      automation: `- Focus on workflow orchestration and task scheduling
- Design data transformation and processing pipelines
- Include error handling and retry mechanisms
- Plan for idempotency and state management
- Consider concurrency and rate limiting`,

      code: `- Focus on AST parsing, code analysis, or generation logic
- Design for multiple languages if applicable
- Include validation and syntax checking
- Plan for template systems or code patterns
- Consider incremental processing for large codebases`,

      data: `- Focus on ETL pipelines, data transformation, and validation
- Design for data quality checks and error handling
- Include schema management and versioning
- Plan for batch and streaming processing
- Consider data partitioning and scalability`,

      support: `- Focus on ticket routing, classification, and prioritization
- Design knowledge base search and retrieval
- Include response generation and templating
- Plan for escalation workflows
- Consider SLA tracking and metrics`,

      general: `- Focus on the core capabilities identified in research
- Design for modularity and extensibility
- Include proper error handling and logging
- Plan for configuration and customization
- Consider monitoring and observability`,
    };

    return guidance[domain] || guidance.general;
  }

  /**
   * Format performance priorities for display
   */
  private formatPerformancePriorities(
    performance: Requirements['performance']
  ): string {
    const priorities = [];

    if (performance.speed) {
      priorities.push(`- Speed: ${performance.speed}`);
    }
    if (performance.quality) {
      priorities.push(`- Quality: ${performance.quality}`);
    }
    if (performance.trust) {
      priorities.push(`- Trust: ${performance.trust}`);
    }
    if (performance.parallelization) {
      priorities.push(`- Parallelization: ${performance.parallelization}`);
    }
    if (performance.budget) {
      priorities.push(`- Budget: ${performance.budget}`);
    }

    return priorities.length > 0
      ? priorities.join('\n')
      : 'No specific priorities';
  }

  /**
   * Set extended thinking budget
   */
  setThinkingBudget(budget: 'low' | 'medium' | 'high'): void {
    this.extendedThinkingBudget = budget;
    this.logProgress(`Extended thinking budget set to: ${budget}`);
  }

  // Validation method available for future use
  // private validateDesign(design: Design): void {
  //   if (design.components.length === 0) {
  //     throw new Error('Design must have at least one component');
  //   }
  //   if (design.techStack.length === 0) {
  //     throw new Error('Design must specify technology stack');
  //   }
  //   if (!design.dataFlow) {
  //     throw new Error('Design must describe data flow');
  //   }
  // }
}
