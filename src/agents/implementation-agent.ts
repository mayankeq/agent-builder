import { BaseAgent } from './base-agent';
import { WorkflowContext, WorkflowPhase, Design } from '../types/workflow';
import { AgentConfig, AgentResult } from '../types/agent';
import { ClaudeClient } from '../claude/claude-client';
import { getSystemPrompt } from '../claude/prompt-templates';
import { parseCode } from '../claude/response-parser';
import { TemplateManager } from '../templates/template-manager';
import { OutputType, Language } from '../types/templates';
import { SkillAgent } from './skill-agent';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Implementation Agent - Generates code based on design
 * Creates complete, runnable code following best practices
 */
export class ImplementationAgent extends BaseAgent {
  private claudeClient: ClaudeClient;
  private templateManager: TemplateManager;

  constructor(config: AgentConfig, claudeClient: ClaudeClient) {
    super(config);
    this.claudeClient = claudeClient;
    this.templateManager = new TemplateManager();
  }

  getName(): string {
    return 'ImplementationAgent';
  }

  getPhase(): WorkflowPhase {
    return 'implementation';
  }

  async execute(context: WorkflowContext): Promise<AgentResult> {
    this.validateContext(context);
    this.startExecution();

    try {
      if (!context.design) {
        throw new Error('Design must be available for implementation phase');
      }

      this.logProgress('Starting code generation');

      const code = await this.generateCode(context.design, context);

      this.logProgress('Code generation completed', {
        fileCount: Object.keys(code).length,
      });

      this.endExecution(true);

      return {
        type: 'implementation_complete',
        data: { code },
        nextPhase: 'implementation', // Will be combined with tests/docs
      };
    } catch (error) {
      this.endExecution(false, error as Error);
      throw error;
    }
  }

  /**
   * Generate code from design - Hybrid template approach
   */
  private async generateCode(
    design: Design,
    context: WorkflowContext
  ): Promise<Record<string, string>> {
    // Extract requirements with defaults
    const requirements = context.requirements || {
      output: { type: 'plugin', language: 'typescript' },
      performance: {},
    };
    const domain = context.research?.domain || 'general';
    const outputType = (requirements.output?.type || 'plugin') as OutputType;
    const language = (requirements.output?.language || 'typescript') as Language;

    this.logProgress('Implementation configuration', {
      domain,
      outputType,
      language,
    });

    // Route to SkillAgent for prompt-based skills
    if (outputType === 'skill') {
      this.logProgress('Generating prompt-based skill agents');
      const skillAgent = new SkillAgent(this.config, this.claudeClient);
      const result = await skillAgent.execute(context);
      return result.data.code;
    }

    // Check if domain-specific templates exist
    const hasTemplates = await this.checkTemplatesExist(domain, outputType);

    if (hasTemplates) {
      this.logProgress('Using hybrid template approach for domain-specific generation');
      return await this.generateWithTemplates(design, context, domain, outputType, language);
    } else {
      this.logProgress('No domain templates found, using Claude generation');
      return await this.generateWithClaude(design, context);
    }
  }

  /**
   * Check if domain-specific templates exist
   */
  private async checkTemplatesExist(domain: string, outputType: OutputType): Promise<boolean> {
    const templatePath = path.join(process.cwd(), 'templates', outputType, domain);
    try {
      await fs.access(templatePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate code using templates + Claude logic injection
   */
  private async generateWithTemplates(
    design: Design,
    context: WorkflowContext,
    domain: string,
    outputType: OutputType,
    language: Language
  ): Promise<Record<string, string>> {
    // Generate logic snippets from Claude
    const logicSnippets = await this.generateLogicSnippets(design, context);

    this.logProgress('Injecting logic into templates', {
      snippets: Object.keys(logicSnippets).length,
    });

    // Prepare template data with all required fields
    const templateData = {
      name: context.userRequest.split(' ').slice(0, 3).join('-').toLowerCase(),
      version: '1.0.0',
      description: context.userRequest,
      language: language,
      outputType: outputType,
      dependencies: design.techStack.map(t => ({
        name: t.name,
        version: t.version || 'latest',
        isDev: false,
      })),
      code: {}, // Will be filled by template rendering
      tests: {},
      config: {},
      metadata: {
        domain: domain,
        currentYear: new Date().getFullYear(),
        ...logicSnippets, // Inject logic snippets as metadata
      },
      // Also spread snippets at top level for template access
      ...logicSnippets,
    } as any; // Cast to any for snippet fields

    // Render templates
    const code = await this.templateManager.renderTemplate(
      outputType,
      domain as any, // Using domain as variant
      templateData
    );

    return code;
  }

  /**
   * Generate logic snippets (not full files) from Claude
   */
  private async generateLogicSnippets(
    design: Design,
    context: WorkflowContext
  ): Promise<Record<string, string>> {
    const prompt = this.buildLogicSnippetPrompt(design, context);

    this.logProgress('Requesting logic snippets from Claude (compact output)');

    const response = await this.claudeClient.complete({
      prompt,
      systemPrompt: getSystemPrompt('implementation'),
      model: this.config.model,
      maxTokens: 8000, // Much smaller - only logic snippets
    });

    // Parse logic snippets (simpler format)
    const snippets = this.parseLogicSnippets(response.text);

    return snippets;
  }

  /**
   * Parse logic snippets from Claude response
   */
  private parseLogicSnippets(response: string): Record<string, string> {
    const snippets: Record<string, string> = {};

    // Look for SNIPPET: markers
    const snippetPattern = /SNIPPET:\s*([^\n]+?)\s*\n```(?:[a-z]+)?\n([\s\S]*?)```/gi;
    let match;

    while ((match = snippetPattern.exec(response)) !== null) {
      const key = match[1].trim();
      const code = match[2].trim();
      snippets[key] = code;
    }

    // Add default values for missing snippets
    const defaults: Record<string, string> = {
      healthCheckLogic: 'Health check logic to be implemented',
      remediationLogic: 'Remediation logic to be implemented',
      alertLogic: 'Alert logic to be implemented',
      healthCheckImplementation: 'Implementation details',
      remediationImplementation: 'Implementation details',
      alertImplementation: 'Implementation details',
      additionalConfigFields: '',
      defaultConfigValues: '',
      healthCheckCode: '// Health check implementation\nreturn { target, healthy: true, message: "OK" };',
      remediationCode: '// Remediation implementation\nreturn { success: true, action: "remediate" };',
      validationCode: '// Validation implementation\nreturn true;',
      alertCode: '// Alert implementation\nconsole.log(`Alert: ${alert.message}`);',
    };

    // Fill in missing snippets with defaults
    for (const [key, value] of Object.entries(defaults)) {
      if (!snippets[key]) {
        snippets[key] = value;
      }
    }

    return snippets;
  }

  /**
   * Fallback: Generate full code with Claude (legacy approach)
   */
  private async generateWithClaude(
    design: Design,
    context: WorkflowContext
  ): Promise<Record<string, string>> {
    const prompt = this.buildImplementationPrompt(design, context);

    this.logProgress('Requesting code from Claude');

    const response = await this.claudeClient.complete({
      prompt,
      systemPrompt: getSystemPrompt('implementation'),
      model: this.config.model,
      maxTokens: this.config.maxTokens || 16000,
    });

    const code = parseCode(response.text);

    return code;
  }

  /**
   * Build logic snippet prompt - asks for compact code snippets, not full files
   */
  private buildLogicSnippetPrompt(
    design: Design,
    context: WorkflowContext
  ): string {
    const requirements = context.requirements!;
    const domain = context.research?.domain || 'general';
    const language = requirements.output.language || 'typescript';

    return `
# Logic Snippet Generation Task

## Context
**Domain**: ${domain}
**User Intent**: ${context.research?.userIntent || 'Not available'}
**Success Criteria**: ${(context.research?.successCriteria || []).join(', ')}

## Design Summary
Components: ${design.components.map(c => c.name).join(', ')}
Tech Stack: ${design.techStack.map(t => t.name).join(', ')}

## Task
Generate ONLY the domain-specific logic snippets (NOT full files). Templates will provide the structure.

**CRITICAL**: Return ONLY code snippets in this format:

SNIPPET: snippetName
\`\`\`${language}
// compact logic code here (5-30 lines)
\`\`\`

For ${domain} domain, generate these snippets:

${this.getRequiredSnippets(domain)}

### Guidelines
1. **Keep snippets COMPACT** - 5-30 lines each
2. **Focus on domain logic** - not boilerplate
3. **Use appropriate ${language} patterns**
4. **Add inline comments** for clarity
5. **Handle errors appropriately**
6. **Use async/await** where appropriate

Example output:
SNIPPET: healthCheckCode
\`\`\`${language}
// Check pod status via Kubernetes API
const k8s = new k8s.Client();
const pods = await k8s.listPods(target);
const failed = pods.filter(p => p.status !== 'Running');

if (failed.length > 0) {
  return {
    target,
    healthy: false,
    message: \`\${failed.length} pods failed\`,
    severity: 'critical',
    remediable: true,
  };
}

return { target, healthy: true, message: 'All pods running' };
\`\`\`

SNIPPET: remediationCode
\`\`\`${language}
// Restart failed pod
const validated = await this.validateRemediation(failure.target, 'restart');
if (!validated) {
  throw new Error('Remediation validation failed');
}

const k8s = new k8s.Client();
await k8s.deletePod(failure.target);

return {
  success: true,
  action: 'restart_pod',
  metadata: { target: failure.target },
};
\`\`\`

Generate ALL required snippets following this pattern.
`;
  }

  /**
   * Get required snippet names for domain
   */
  private getRequiredSnippets(domain: string): string {
    const snippets: Record<string, string> = {
      aiops: `
Required snippets:
1. **healthCheckCode** - Check target system health (return HealthResult)
2. **remediationCode** - Execute remediation action (return RemediationResult)
3. **validationCode** - Validate remediation is safe (return boolean)
4. **alertCode** - Send alert through channels (send alert, return void)
5. **healthCheckImplementation** - Document how health checks work
6. **remediationImplementation** - Document how remediation works
7. **alertImplementation** - Document how alerts work
8. **additionalConfigFields** - Extra config fields needed
9. **defaultConfigValues** - Default values for extra config
10. **healthCheckLogic** - Brief description of health check approach
11. **remediationLogic** - Brief description of remediation approach
12. **alertLogic** - Brief description of alert approach`,

      sales: `
Required snippets:
1. **leadScoringCode** - Score and qualify leads
2. **crmSyncCode** - Sync with CRM system
3. **outreachCode** - Send outreach messages
4. **enrichmentCode** - Enrich lead data from sources
5. **responseTrackingCode** - Track lead responses
6. **complianceCode** - Handle opt-outs and compliance`,

      automation: `
Required snippets:
1. **workflowCode** - Orchestrate workflow steps
2. **transformCode** - Transform data between steps
3. **integrationCode** - Integrate with external systems
4. **stateManagementCode** - Manage workflow state
5. **errorRecoveryCode** - Handle and recover from errors`,

      general: `
Required snippets:
1. **mainLogic** - Core functionality
2. **configLogic** - Configuration handling
3. **errorHandling** - Error handling patterns`,
    };

    return snippets[domain] || snippets.general;
  }

  /**
   * Build implementation prompt
   */
  private buildImplementationPrompt(
    design: Design,
    context: WorkflowContext
  ): string {
    const requirements = context.requirements!;
    const language = requirements.output.language || 'typescript';
    const domain = context.research?.domain || 'general';

    return `
# Agent Implementation Task

## Domain Context
**Domain**: ${domain}
**User Intent**: ${context.research?.userIntent || 'Not available'}
**Success Criteria**: ${(context.research?.successCriteria || []).join(', ')}

## Design
${JSON.stringify(design, null, 2)}

## Requirements
- Language: ${language}
- Output Type: ${requirements.output.type}
- Performance Priorities: ${JSON.stringify(requirements.performance)}

## Components to Implement
${design.components.map(c => `
### ${c.name} (${c.type})
Description: ${c.description}
Responsibilities: ${c.responsibilities.join(', ')}
Dependencies: ${c.dependencies.join(', ')}
`).join('\n')}

## File Structure
${JSON.stringify(design.fileStructure, null, 2)}

## Technology Stack
${design.techStack.map(t => `- ${t.name} (${t.category}): ${t.justification}`).join('\n')}

## Implementation Guidelines

**CRITICAL**: Generate artifacts appropriate for the **${domain}** domain:

${this.getDomainImplementationGuidance(domain, language)}

### General Guidelines
1. **Generate complete, working artifacts** for all components
2. **Follow ${language} best practices** and conventions
3. **Include proper error handling** for expected failures
4. **Add type safety** (TypeScript types / Python type hints where applicable)
5. **Include inline documentation** for complex logic
6. **Implement optimizations** from the design: ${design.optimizations.join(', ')}
7. **Make it production-ready**: Include logging, monitoring hooks, configuration

**IMPORTANT**: Return code using markdown code blocks with FILE headers (NOT JSON):

For each file, use this EXACT format:
\`\`\`
FILE: path/to/file.${language === 'typescript' ? 'ts' : 'py'}
\`\`\`${language === 'typescript' ? 'typescript' : 'python'}
// actual code here
\`\`\`

Example output:
\`\`\`
FILE: src/index.${language === 'typescript' ? 'ts' : 'py'}
\`\`\`${language}
import { something } from './module';

export function main() {
  // implementation
}
\`\`\`

\`\`\`
FILE: src/config.${language === 'typescript' ? 'ts' : 'py'}
\`\`\`${language}
export const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};
\`\`\`

Make sure:
- Each file starts with "FILE: path/to/file"
- Use proper markdown code blocks with language tags
- All imports/dependencies are correct
- Functions/methods have proper signatures
- Error handling is comprehensive and domain-appropriate
- Code/artifacts are idiomatic and production-ready
- The agent can actually solve the user's problem
`;
  }

  /**
   * Get domain-specific implementation guidance
   */
  private getDomainImplementationGuidance(domain: string, language: string): string {
    const ext = language === 'typescript' ? 'ts' : 'py';

    const guidance: Record<string, string> = {
      aiops: `For AIOps agents, generate:
- Monitoring loops with configurable polling intervals
- Health check implementations for target systems
- Alert detection and classification logic
- Auto-remediation workflows with safety checks
- Integration code for monitoring APIs (Prometheus, Datadog, CloudWatch, etc.)
- Notification handlers (Slack, PagerDuty, email)
- Example: src/monitor.${ext}, src/remediation.${ext}, src/alerts.${ext}`,

      sales: `For Sales agents, generate:
- Lead qualification and scoring logic
- CRM integration code (Salesforce, HubSpot APIs)
- Email/SMS outreach templates and sending logic
- Lead enrichment from data sources (Clearbit, LinkedIn, etc.)
- Response tracking and analytics
- Compliance handling (opt-outs, GDPR)
- Example: src/lead-scorer.${ext}, src/crm-sync.${ext}, src/outreach.${ext}`,

      automation: `For Automation agents, generate:
- Workflow orchestration and task scheduling
- Data transformation and processing pipelines
- System integration connectors (REST APIs, webhooks, etc.)
- State management and persistence
- Error recovery and retry logic
- Event handling and triggers
- Example: src/workflow.${ext}, src/processors.${ext}, src/integrations.${ext}`,

      code: `For Code agents, generate:
- Code parsers and AST manipulation
- Code generation templates and logic
- Analysis algorithms and validators
- Refactoring transformations
- Language-specific tooling integration
- Output formatting and file writing
- Example: src/parser.${ext}, src/generator.${ext}, src/analyzer.${ext}`,

      data: `For Data agents, generate:
- ETL pipeline components (extract, transform, load)
- Data validation and quality checks
- Schema management and migrations
- Batch and streaming processors
- Database/data warehouse connectors
- Analytics and reporting logic
- Example: src/extractors.${ext}, src/transformers.${ext}, src/loaders.${ext}`,

      support: `For Support agents, generate:
- Ticket classification and routing logic
- Knowledge base search and retrieval
- Response generation from templates
- Escalation workflow handlers
- SLA tracking and alerting
- Integration with ticketing systems (Zendesk, Jira, etc.)
- Example: src/classifier.${ext}, src/knowledge-base.${ext}, src/responder.${ext}`,

      general: `For General agents, generate:
- Core functionality as specified in the design
- Proper abstraction and modularity
- Configuration management
- Integration points as needed
- Logging and monitoring hooks
- Example: src/main.${ext}, src/core.${ext}, src/utils.${ext}`,
    };

    return guidance[domain] || guidance.general;
  }
}
