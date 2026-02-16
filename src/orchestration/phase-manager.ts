import { WorkflowPhase } from '../types/workflow';
import { createLogger } from '../utils/logger';

const logger = createLogger('PhaseManager');

/**
 * Phase Manager - Manages workflow phase transitions and validation
 */
export class PhaseManager {
  private validTransitions: Map<WorkflowPhase, WorkflowPhase[]>;

  constructor() {
    // Define valid phase transitions
    this.validTransitions = new Map([
      ['clarification', ['clarification', 'design']], // Can loop or move to design
      ['design', ['implementation']],
      ['implementation', ['packaging']],
      ['packaging', ['learning']],
      ['learning', ['completed']],
      ['completed', []],
    ]);
  }

  /**
   * Check if transition is valid
   */
  canTransition(from: WorkflowPhase, to: WorkflowPhase): boolean {
    const allowed = this.validTransitions.get(from) || [];
    return allowed.includes(to);
  }

  /**
   * Validate transition or throw error
   */
  validateTransition(from: WorkflowPhase, to: WorkflowPhase): void {
    if (!this.canTransition(from, to)) {
      const message = `Invalid phase transition: ${from} -> ${to}`;
      logger.error(message);
      throw new Error(message);
    }

    logger.debug(`Phase transition: ${from} -> ${to}`);
  }

  /**
   * Get next valid phases
   */
  getNextPhases(current: WorkflowPhase): WorkflowPhase[] {
    return this.validTransitions.get(current) || [];
  }

  /**
   * Check if phase is terminal (workflow complete)
   */
  isTerminal(phase: WorkflowPhase): boolean {
    return phase === 'completed';
  }

  /**
   * Get phase order for display/logging
   */
  getPhaseOrder(): WorkflowPhase[] {
    return ['clarification', 'design', 'implementation', 'packaging', 'learning', 'completed'];
  }

  /**
   * Get phase progress (0-100%)
   */
  getProgress(currentPhase: WorkflowPhase): number {
    const order = this.getPhaseOrder();
    const index = order.indexOf(currentPhase);

    if (index === -1) return 0;

    return Math.round((index / (order.length - 1)) * 100);
  }
}
