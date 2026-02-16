import { BaseAgent } from './base-agent';
import { WorkflowContext, WorkflowPhase, Requirements } from '../types/workflow';
import { AgentConfig, AgentResult, Question, Answer } from '../types/agent';
import { ClaudeClient } from '../claude/claude-client';
import { getSystemPrompt } from '../claude/prompt-templates';
import { parseQuestions } from '../claude/response-parser';

/**
 * Clarification Agent - Gathers detailed requirements through interactive questions
 * Runs for 2-3 rounds until requirements are sufficiently clear
 */
export class ClarificationAgent extends BaseAgent {
  private claudeClient: ClaudeClient;
  private maxRounds: number;
  private currentRound: number = 0;

  constructor(config: AgentConfig, claudeClient: ClaudeClient) {
    super(config);
    this.claudeClient = claudeClient;
    this.maxRounds = 3; // Default, can be configured
  }

  getName(): string {
    return 'ClarificationAgent';
  }

  getPhase(): WorkflowPhase {
    return 'clarification';
  }

  async execute(context: WorkflowContext): Promise<AgentResult> {
    this.validateContext(context);
    this.startExecution();

    try {
      const requirements = context.requirements || this.initializeRequirements(context);

      // Generate questions based on current understanding
      const questions = await this.generateQuestions(context, requirements);

      // If no questions, we're done with clarification
      if (questions.length === 0) {
        this.logProgress('No more questions - requirements complete');
        this.endExecution(true);

        return {
          type: 'clarification_complete',
          data: { requirements },
          nextPhase: 'design',
        };
      }

      this.logProgress(`Generated ${questions.length} questions for round ${this.currentRound + 1}`);

      this.endExecution(true);

      return {
        type: 'clarification_questions',
        data: { questions, requirements, round: this.currentRound },
        nextPhase: 'clarification', // Stay in clarification until complete
      };
    } catch (error) {
      this.endExecution(false, error as Error);
      throw error;
    }
  }

  /**
   * Generate targeted questions based on current requirements
   */
  async generateQuestions(
    context: WorkflowContext,
    requirements: Requirements
  ): Promise<Question[]> {
    // Check if we've reached max rounds
    if (this.currentRound >= this.maxRounds) {
      this.logProgress('Reached maximum clarification rounds');
      return [];
    }

    const gaps = this.identifyGaps(requirements);

    // If no significant gaps, we're done
    if (gaps.length === 0) {
      return [];
    }

    const prompt = this.buildClarificationPrompt(context, requirements, gaps);

    this.logProgress('Requesting questions from Claude');

    const response = await this.claudeClient.complete({
      prompt,
      systemPrompt: getSystemPrompt('clarification'),
      model: this.config.model,
      maxTokens: 4000,
    });

    const questions = parseQuestions(response.text);

    this.currentRound++;

    return questions.slice(0, 3); // Maximum 3 questions per round
  }

  /**
   * Identify gaps in current requirements
   */
  private identifyGaps(requirements: Requirements): string[] {
    const gaps: string[] = [];

    // Check functional requirements
    if (requirements.functional.length === 0) {
      gaps.push('No functional requirements specified');
    }

    // Check technical details
    if (Object.keys(requirements.technical).length === 0) {
      gaps.push('No technical requirements specified');
    }

    // Check output format
    if (!requirements.output.type) {
      gaps.push('Output type not specified');
    }

    if (!requirements.output.language) {
      gaps.push('Programming language not specified');
    }

    // Check performance priorities
    const perfKeys = Object.keys(requirements.performance);
    if (perfKeys.length === 0) {
      gaps.push('Performance priorities not specified');
    }

    return gaps;
  }

  /**
   * Build prompt for generating questions
   */
  private buildClarificationPrompt(
    context: WorkflowContext,
    requirements: Requirements,
    gaps: string[]
  ): string {
    return `
User wants to build: ${context.userRequest}

Current understanding:
${JSON.stringify(requirements, null, 2)}

Identified gaps:
${gaps.map((gap, i) => `${i + 1}. ${gap}`).join('\n')}

This is clarification round ${this.currentRound + 1} of ${this.maxRounds}.

Generate 2-3 targeted questions to fill the most critical gaps. Focus on:
1. Understanding what the agent should do (functional requirements)
2. Technical constraints and preferences
3. Output format and language if not specified
4. Performance priorities (speed, quality, trust, budget)

Return questions as a JSON array following the specified format.
`;
  }

  /**
   * Process user answers and update requirements
   */
  processAnswers(requirements: Requirements, answers: Answer[]): Requirements {
    const updated = { ...requirements };

    for (const answer of answers) {
      // Parse answer based on question category
      // This is a simplified version - real implementation would be more sophisticated
      if (typeof answer.value === 'string') {
        if (answer.questionId.includes('functional')) {
          updated.functional.push(answer.value);
        } else if (answer.questionId.includes('output-type')) {
          updated.output.type = answer.value as any;
        } else if (answer.questionId.includes('language')) {
          updated.output.language = answer.value as any;
        }
      }
    }

    return updated;
  }

  /**
   * Initialize requirements from context options
   */
  private initializeRequirements(context: WorkflowContext): Requirements {
    return {
      functional: [],
      technical: {},
      architectural: {},
      performance: {},
      output: {
        type: context.options?.outputType,
        language: context.options?.language,
      },
    };
  }

  /**
   * Check if requirements are sufficient to proceed
   */
  isComplete(requirements: Requirements): boolean {
    return (
      requirements.functional.length > 0 &&
      requirements.output.type !== undefined &&
      requirements.output.language !== undefined
    );
  }
}
