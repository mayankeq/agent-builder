import { ExistingAgentPattern } from '../utils/existing-agent-reader';

/**
 * Workflow phases
 */
export type WorkflowPhase =
  | 'research'
  | 'clarification'
  | 'design'
  | 'implementation'
  | 'packaging'
  | 'learning'
  | 'completed';

/**
 * Agent domain categories
 */
export type AgentDomain =
  | 'aiops'        // Monitoring, alerts, remediation
  | 'sales'        // Lead qualification, CRM, outreach
  | 'automation'   // Workflows, data processing, integration
  | 'code'         // Code analysis, generation, review
  | 'data'         // ETL, analysis, reporting
  | 'support'      // Ticketing, knowledge base, response
  | 'general';     // General-purpose agents

/**
 * Research findings from deep analysis
 */
export interface Research {
  domain: AgentDomain;
  userIntent: string;
  capabilities: string[];  // What the agent needs to do (domain-agnostic)
  recommendedApproach: string;
  relevantPatterns: string[];
  potentialChallenges: string[];
  successCriteria: string[];  // How to measure success
  researchSummary: string;
  thinkingTrace?: string[];
  // Advanced capabilities for production-ready agents
  integrationPoints?: {
    tribalKnowledge?: string[];      // Confluence, Slack, Notion, internal docs
    existingSystems?: string[];      // CRM, ticketing, monitoring, databases
    dataSources?: string[];          // Historical data, logs, analytics
  };
  advancedCapabilities?: string[];   // Correlation, learning, context-awareness, prediction
  contextualFactors?: string[];      // Public/private responses, SLA requirements, compliance
  domainSpecificDepth?: {            // Deep domain knowledge
    bestPractices?: string[];
    antiPatterns?: string[];
    industryStandards?: string[];
  };
}

/**
 * User requirements gathered during clarification
 */
export interface Requirements {
  functional: string[];
  technical: Record<string, any>;
  architectural: Record<string, any>;
  performance: {
    speed?: 'low' | 'medium' | 'high';
    quality?: 'low' | 'medium' | 'high';
    trust?: 'low' | 'medium' | 'high';
    parallelization?: 'none' | 'auto' | 'aggressive';
    budget?: 'low' | 'medium' | 'high';
  };
  output: {
    type?: 'skill' | 'mcp' | 'cli' | 'library';
    language?: 'typescript' | 'python';
  };
}

export interface Optimization {
  type?: string;
  description: string;
  impact?: string;
  implementation?: string;
}

/**
 * Design produced by design agent
 */
export interface Design {
  components: Component[];
  dataFlow: string;
  techStack: TechnologyChoice[];
  fileStructure: FileStructure;
  integrations: Integration[];
  decisions: DesignDecision[];
  tradeoffs: Tradeoff[];
  optimizations: (string | Optimization)[];
  thinkingTrace?: string[];
}

export interface Component {
  name: string;
  type: 'class' | 'module' | 'function' | 'interface';
  description: string;
  responsibilities: string[];
  dependencies: string[];
}

export interface TechnologyChoice {
  name: string;
  category: string;
  version?: string;
  justification: string;
}

export interface FileStructure {
  [path: string]: {
    type: 'file' | 'directory';
    description?: string;
    children?: FileStructure;
  };
}

export interface Integration {
  system: string;
  method: string;
  description: string;
}

export interface DesignDecision {
  topic: string;
  decision: string;
  reasoning: string;
  alternatives?: string[];
}

export interface Tradeoff {
  aspect: string;
  chosen: string;
  rejected: string;
  rationale: string;
}

/**
 * Implementation artifacts
 */
export interface Implementation {
  code: Record<string, string>;
  tests: Record<string, string>;
  docs: Record<string, string>;
  config: Record<string, string>;
}

/**
 * Quality tier for agent generation
 */
export type QualityTier = 'simple' | 'advanced';

/**
 * Build options provided by user
 */
export interface BuildOptions {
  outputType?: 'skill' | 'mcp' | 'cli' | 'library';
  language?: 'typescript' | 'python';
  qualityTier?: QualityTier;  // Controls thinking budget and comprehensiveness
  interactive?: boolean;
  config?: string;
  performance?: Requirements['performance'];
  autoDeploy?: boolean;  // Whether to auto-install the agent
  existingAgentsDir?: string;  // Path to directory with existing agent files to learn from
}

/**
 * Build result
 */
export interface BuildResult {
  sessionId: string;
  outputDir: string;
  artifacts: Record<string, string>;
  metrics: WorkflowMetrics;
}

/**
 * Workflow metrics
 */
export interface WorkflowMetrics {
  totalDuration: number;
  phaseMetrics: Record<WorkflowPhase, PhaseMetrics>;
  tokenUsage: number;
  errorCount: number;
}

export interface PhaseMetrics {
  duration: number;
  startTime: Date;
  endTime: Date;
  success: boolean;
  error?: string;
}

/**
 * Workflow context passed between agents
 */
export interface WorkflowContext {
  sessionId: string;
  userRequest: string;
  currentPhase: WorkflowPhase;
  research?: Research;
  requirements?: Requirements;
  design?: Design;
  implementation?: Implementation;
  options: BuildOptions;
  metrics: WorkflowMetrics;
  memory: any;
  startTime: Date;
  existingAgents?: ExistingAgentPattern;  // Patterns learned from existing agent files

  withResearch(research: Research): WorkflowContext;
  withRequirements(requirements: Requirements): WorkflowContext;
  withDesign(design: Design): WorkflowContext;
  withImplementation(implementation: Implementation): WorkflowContext;
  transitionTo(phase: WorkflowPhase): void;
  captureThinking(thinking: any): void;
}
