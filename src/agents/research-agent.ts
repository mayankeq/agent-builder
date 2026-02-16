import { BaseAgent } from './base-agent';
import { AgentConfig, AgentResult } from '../types/agent';
import { WorkflowContext, WorkflowPhase } from '../types/workflow';
import { ClaudeClient } from '../claude/claude-client';

export interface ResearchFindings {
  domain: 'aiops' | 'sales' | 'automation' | 'code' | 'data' | 'support' | 'general';
  userIntent: string;
  capabilities: string[];
  recommendedApproach: string;
  relevantPatterns: string[];
  potentialChallenges: string[];
  successCriteria: string[];
  researchSummary: string;
}

/**
 * Research Agent - Analyzes user request and conducts deep research
 * Uses extended thinking to thoroughly understand requirements
 */
export class ResearchAgent extends BaseAgent {
  private claudeClient: ClaudeClient;

  constructor(config: AgentConfig, claudeClient: ClaudeClient) {
    super(config);
    this.claudeClient = claudeClient;
  }

  getName(): string {
    return 'ResearchAgent';
  }

  getPhase(): WorkflowPhase {
    return 'research';
  }

  async execute(context: WorkflowContext): Promise<AgentResult> {
    this.validateContext(context);
    this.startExecution();

    try {
      this.logProgress('Starting deep research on user request');
      const researchPrompt = this.buildResearchPrompt(context.userRequest);
      const systemPrompt = this.buildSystemPrompt();

      this.logProgress('Requesting research analysis from Claude with extended thinking');

      const response = await this.claudeClient.completeWithExtendedThinking({
        prompt: researchPrompt,
        systemPrompt,
        maxTokens: 32000,
        extendedThinking: {
          enabled: true,
          budget: 'high', // 10K thinking tokens for deep analysis
        },
      });

      const findings = this.parseResearchResponse(response.text);

      this.logProgress('Research completed', {
        domain: findings.domain,
        capabilities: findings.capabilities.length,
        patterns: findings.relevantPatterns.length,
        challenges: findings.potentialChallenges.length,
      });

      this.endExecution(true);

      return {
        type: 'research_complete',
        data: {
          research: {
            ...findings,
            thinkingTrace: response.thinkingBlocks,
          },
        },
        nextPhase: 'clarification',
        metadata: {
          thinkingTokens: response.usage.outputTokens,
          totalTokens: response.usage.totalTokens,
        },
      };
    } catch (error) {
      this.endExecution(false, error as Error);
      throw error;
    }
  }

  private buildSystemPrompt(): string {
    return `You are an expert systems analyst and researcher who specializes in understanding organizational needs across diverse domains. Your task is to deeply analyze a user's request to build an AI agent and conduct comprehensive domain-specific research.

You work with agents across multiple domains:
- **AIOps**: Monitoring, alerting, incident response, auto-remediation
- **Sales**: Lead qualification, outreach automation, CRM integration
- **Automation**: Workflow orchestration, data processing, system integration
- **Code**: Code analysis, generation, review, refactoring
- **Data**: ETL pipelines, data analysis, reporting, visualization
- **Support**: Ticketing systems, knowledge bases, automated responses
- **General**: Multi-purpose agents that don't fit specific categories

Your research should be thorough and consider:
1. **Domain identification**: What organizational domain does this agent serve?
2. **User intent**: What problem are they trying to solve?
3. **Required capabilities**: What specific capabilities does the agent need? (API integrations, data processing, notifications, etc.)
4. **Best practices**: What are the proven patterns in this domain?
5. **Success criteria**: How will we know the agent is working well?
6. **Challenges**: What obstacles might we face and how to address them?

Be domain-specific, actionable, and focused on the organizational outcome. Avoid assuming the agent is always about code generation unless explicitly stated.`;
  }

  private buildResearchPrompt(userRequest: string): string {
    return `# Agent Research Task

Analyze this user request for building an AI agent and conduct deep, domain-specific research:

**User Request:**
${userRequest}

## Your Task

First, identify which organizational domain this agent serves:
- **aiops**: Monitoring, alerts, incident response, auto-remediation (e.g., "monitor K8s pods", "auto-restart failed services")
- **sales**: Lead qualification, outreach, CRM operations (e.g., "qualify inbound leads", "automate sales follow-ups")
- **automation**: Workflow automation, data processing, integrations (e.g., "sync data between systems", "automate reporting")
- **code**: Code analysis, generation, review (e.g., "generate REST APIs", "analyze code quality")
- **data**: ETL, data analysis, reporting (e.g., "build data pipeline", "generate analytics reports")
- **support**: Ticketing, knowledge base, customer support (e.g., "route support tickets", "answer FAQs")
- **general**: Multi-purpose or doesn't fit above categories

Then provide comprehensive research in this JSON format:

\`\`\`json
{
  "domain": "aiops|sales|automation|code|data|support|general",
  "userIntent": "Clear description of the organizational problem they're solving",
  "capabilities": [
    "Specific capability 1 (e.g., 'API integration with K8s', 'Email sending', 'Data transformation')",
    "Specific capability 2",
    "..."
  ],
  "recommendedApproach": "Detailed recommendation for how to build this agent, specific to the domain",
  "relevantPatterns": [
    "Domain-specific pattern 1 (e.g., 'health check polling', 'lead scoring matrix', 'ETL pipeline')",
    "Domain-specific pattern 2",
    "..."
  ],
  "potentialChallenges": [
    "Challenge 1 and how to address it",
    "Challenge 2 and how to address it",
    "..."
  ],
  "successCriteria": [
    "Measurable success criterion 1 (e.g., 'Detects failures within 30s', '80% lead qualification accuracy')",
    "Measurable success criterion 2",
    "..."
  ],
  "integrationPoints": {
    "tribalKnowledge": [
      "Sources of institutional knowledge (e.g., 'Slack #support channel', 'Confluence runbooks', 'Team documentation')"
    ],
    "existingSystems": [
      "Systems to integrate with (e.g., 'Jira ticketing system', 'Salesforce CRM', 'Datadog monitoring', 'PostgreSQL ticket database')"
    ],
    "dataSources": [
      "Historical data sources (e.g., 'Past 6 months of resolved tickets', 'Support interaction logs', 'Customer satisfaction scores')"
    ]
  },
  "advancedCapabilities": [
    "Sophisticated capability 1 (e.g., 'Correlate current issue to similar past tickets', 'Predict escalation likelihood based on sentiment')",
    "Sophisticated capability 2 (e.g., 'Build knowledge base from ticket patterns', 'Learn from resolution success rates')",
    "Sophisticated capability 3 (e.g., 'Context-aware responses for public vs internal', 'Proactive issue detection before customer reports')",
    "..."
  ],
  "contextualFactors": [
    "Important context consideration 1 (e.g., 'Distinguish public customer responses from internal notes', 'SLA requirements vary by customer tier')",
    "Important context consideration 2 (e.g., 'Compliance requirements for data handling', 'Regional variations in support approach')",
    "..."
  ],
  "domainSpecificDepth": {
    "bestPractices": [
      "Industry best practice 1 (e.g., 'ITIL incident management framework', 'MEDDIC sales qualification')",
      "Industry best practice 2",
      "..."
    ],
    "antiPatterns": [
      "Common mistake to avoid 1 (e.g., 'Over-automating emotional customer interactions', 'Ignoring cultural context in global support')",
      "Common mistake to avoid 2",
      "..."
    ],
    "industryStandards": [
      "Relevant standard 1 (e.g., 'GDPR compliance for customer data', 'ISO 20000 for service management')",
      "Relevant standard 2",
      "..."
    ]
  },
  "researchSummary": "2-3 paragraph summary of your research findings and recommendations, focused on the organizational outcome"
}
\`\`\`

## Think Deeply About:
- What is the **real organizational problem** being solved?
- What **domain** does this belong to?
- What **capabilities** are needed? (Not code features, but functional capabilities)
- What are **best practices** in this specific domain?
- How will we **measure success**?
- What **challenges** are unique to this domain?

## Advanced Considerations for Production-Ready Agents:
- **Integration**: What existing systems, tribal knowledge, or data sources should the agent tap into?
- **Sophistication**: Beyond basic responses, what advanced capabilities make this agent truly valuable?
  - Correlation (linking current situation to past patterns)
  - Learning (improving from historical data)
  - Context-awareness (different behavior for different contexts)
  - Prediction (proactive detection before problems escalate)
- **Contextual Intelligence**: How should behavior differ based on context?
  - Public customer-facing vs internal team notes
  - Different customer tiers or SLA requirements
  - Regional/cultural variations
  - Compliance and security requirements
- **Domain Depth**: What makes an expert in this domain? What separates good from great?
  - Industry best practices and frameworks
  - Common anti-patterns to avoid
  - Relevant standards and compliance requirements

**CRITICAL**: Do NOT assume this is about software development or code generation unless explicitly stated. Focus on the organizational capability being built. Think about how a human expert would excel at this task, then design an agent that captures that expertise.`;
  }

  private parseResearchResponse(response: string): ResearchFindings {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error('No JSON block found in response');
      }

      const findings = JSON.parse(jsonMatch[1]);

      // Validate required fields
      const required = [
        'domain',
        'userIntent',
        'capabilities',
        'recommendedApproach',
        'relevantPatterns',
        'potentialChallenges',
        'successCriteria',
        'researchSummary',
      ];

      for (const field of required) {
        if (!findings[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      return findings;
    } catch (error) {
      this.logger.error('Failed to parse research response', error as Error);

      // Return a basic structure if parsing fails
      return {
        domain: 'general',
        userIntent: 'Failed to parse research results',
        capabilities: ['Review research output manually'],
        recommendedApproach: response.slice(0, 500),
        relevantPatterns: [],
        potentialChallenges: [],
        successCriteria: ['Manual review required'],
        researchSummary: response.slice(0, 1000),
      };
    }
  }
}
