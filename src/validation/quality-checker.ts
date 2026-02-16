import { createLogger } from '../utils/logger';

const logger = createLogger('QualityChecker');

export interface QualityReport {
  score: number; // 0-100
  metrics: QualityMetrics;
  issues: QualityIssue[];
  recommendations: string[];
}

export interface QualityMetrics {
  complexity: number;
  maintainability: number;
  testCoverage: number;
  documentation: number;
  codeStyle: number;
}

export interface QualityIssue {
  type: 'complexity' | 'style' | 'documentation' | 'maintainability';
  severity: 'low' | 'medium' | 'high';
  file: string;
  line?: number;
  message: string;
}

/**
 * Quality Checker - Checks code quality metrics
 */
export class QualityChecker {
  /**
   * Check code quality
   */
  async checkQuality(
    files: Record<string, string>,
    language: string
  ): Promise<QualityReport> {
    logger.info(`Checking quality for ${Object.keys(files).length} files`);

    const issues: QualityIssue[] = [];
    let totalComplexity = 0;
    let fileCount = 0;

    for (const [filename, content] of Object.entries(files)) {
      // Skip non-code files
      if (filename.endsWith('.json') || filename.endsWith('.yaml') || filename.endsWith('.md')) {
        continue;
      }

      fileCount++;

      // Check complexity
      const complexity = this.checkComplexity(filename, content);
      totalComplexity += complexity;

      if (complexity > 10) {
        issues.push({
          type: 'complexity',
          severity: 'high',
          file: filename,
          message: `High cyclomatic complexity: ${complexity}`,
        });
      }

      // Check function length
      const longFunctions = this.checkFunctionLength(filename, content);
      issues.push(...longFunctions);

      // Check documentation
      const docIssues = this.checkDocumentation(filename, content);
      issues.push(...docIssues);

      // Check naming conventions
      const namingIssues = this.checkNaming(filename, content, language);
      issues.push(...namingIssues);
    }

    const avgComplexity = fileCount > 0 ? totalComplexity / fileCount : 0;

    const metrics: QualityMetrics = {
      complexity: Math.max(0, 100 - avgComplexity * 10),
      maintainability: this.calculateMaintainability(issues),
      testCoverage: 0, // Would be calculated by test runner
      documentation: this.calculateDocumentation(issues),
      codeStyle: this.calculateCodeStyle(issues),
    };

    const score = this.calculateOverallScore(metrics);

    const recommendations = this.generateRecommendations(issues, metrics);

    logger.info('Quality check complete', { score, issues: issues.length });

    return { score, metrics, issues, recommendations };
  }

  /**
   * Check cyclomatic complexity
   */
  private checkComplexity(_filename: string, content: string): number {
    // Simple complexity calculation
    // Count control flow statements
    const controlFlowKeywords = ['if', 'else', 'for', 'while', 'case', 'catch', '&&', '||', '?'];

    let complexity = 1; // Base complexity

    for (const keyword of controlFlowKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Check function length
   */
  private checkFunctionLength(filename: string, content: string): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const lines = content.split('\n');

    // Simple function detection
    const functionPattern = /^(\s*)(function|def|async\s+function|const\s+\w+\s*=\s*(?:async\s*)?\()/;

    let functionStart = -1;
    let functionName = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (functionPattern.test(line)) {
        functionStart = i;
        functionName = line.match(/(?:function|def|const)\s+(\w+)/)?.[1] || 'anonymous';
      }

      // End of function (simplified)
      if (functionStart !== -1 && line.trim() === '}') {
        const length = i - functionStart;

        if (length > 50) {
          issues.push({
            type: 'maintainability',
            severity: 'medium',
            file: filename,
            line: functionStart + 1,
            message: `Function '${functionName}' is too long (${length} lines)`,
          });
        }

        functionStart = -1;
      }
    }

    return issues;
  }

  /**
   * Check documentation
   */
  private checkDocumentation(filename: string, content: string): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const lines = content.split('\n');

    // Check for functions without documentation
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (/^(export\s+)?(function|class|const\s+\w+\s*=\s*function)/.test(line)) {
        // Check if previous line is a comment
        const prevLine = i > 0 ? lines[i - 1].trim() : '';

        if (!prevLine.startsWith('//') && !prevLine.startsWith('/*') && !prevLine.startsWith('*')) {
          const name = line.match(/(?:function|class)\s+(\w+)/)?.[1] || 'anonymous';

          issues.push({
            type: 'documentation',
            severity: 'low',
            file: filename,
            line: i + 1,
            message: `Missing documentation for '${name}'`,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check naming conventions
   */
  private checkNaming(filename: string, content: string, _language: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for single-letter variable names (except common ones like i, j, k)
    const singleLetterPattern = /\b([a-hln-z])\b\s*=/g;
    const matches = content.match(singleLetterPattern);

    if (matches && matches.length > 5) {
      issues.push({
        type: 'style',
        severity: 'low',
        file: filename,
        message: 'Too many single-letter variable names',
      });
    }

    return issues;
  }

  /**
   * Calculate maintainability score
   */
  private calculateMaintainability(issues: QualityIssue[]): number {
    const maintainabilityIssues = issues.filter(
      i => i.type === 'maintainability' || i.type === 'complexity'
    );

    return Math.max(0, 100 - maintainabilityIssues.length * 10);
  }

  /**
   * Calculate documentation score
   */
  private calculateDocumentation(issues: QualityIssue[]): number {
    const docIssues = issues.filter(i => i.type === 'documentation');

    return Math.max(0, 100 - docIssues.length * 5);
  }

  /**
   * Calculate code style score
   */
  private calculateCodeStyle(issues: QualityIssue[]): number {
    const styleIssues = issues.filter(i => i.type === 'style');

    return Math.max(0, 100 - styleIssues.length * 5);
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(metrics: QualityMetrics): number {
    const weights = {
      complexity: 0.25,
      maintainability: 0.25,
      testCoverage: 0.2,
      documentation: 0.15,
      codeStyle: 0.15,
    };

    return Math.round(
      metrics.complexity * weights.complexity +
      metrics.maintainability * weights.maintainability +
      metrics.testCoverage * weights.testCoverage +
      metrics.documentation * weights.documentation +
      metrics.codeStyle * weights.codeStyle
    );
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    issues: QualityIssue[],
    metrics: QualityMetrics
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.complexity < 70) {
      recommendations.push('Reduce code complexity by breaking down complex functions');
    }

    if (metrics.maintainability < 70) {
      recommendations.push('Improve maintainability by reducing function length and complexity');
    }

    if (metrics.documentation < 70) {
      recommendations.push('Add documentation for public functions and classes');
    }

    if (metrics.codeStyle < 70) {
      recommendations.push('Follow naming conventions and code style guidelines');
    }

    const highSeverityIssues = issues.filter(i => i.severity === 'high');
    if (highSeverityIssues.length > 0) {
      recommendations.push(`Address ${highSeverityIssues.length} high-severity issues first`);
    }

    return recommendations;
  }
}
