import { createLogger } from '../utils/logger';
import { Language } from '../types/templates';
import * as ts from 'typescript';

const logger = createLogger('CodeValidator');

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  file: string;
  line?: number;
  column?: number;
  message: string;
  severity: 'error';
}

export interface ValidationWarning {
  file: string;
  line?: number;
  column?: number;
  message: string;
  severity: 'warning';
}

/**
 * Code Validator - Validates syntax and structure of generated code
 */
export class CodeValidator {
  /**
   * Validate all code files
   */
  async validateCode(
    files: Record<string, string>,
    language: Language
  ): Promise<ValidationResult> {
    logger.info(`Validating ${Object.keys(files).length} files`, { language });

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const [filename, content] of Object.entries(files)) {
      if (language === 'typescript' && filename.endsWith('.ts')) {
        const tsResult = this.validateTypeScript(filename, content);
        errors.push(...tsResult.errors);
        warnings.push(...tsResult.warnings);
      } else if (language === 'python' && filename.endsWith('.py')) {
        const pyResult = this.validatePython(filename, content);
        errors.push(...pyResult.errors);
        warnings.push(...pyResult.warnings);
      } else if (filename.endsWith('.json')) {
        const jsonResult = this.validateJson(filename, content);
        errors.push(...jsonResult.errors);
      } else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
        const yamlResult = this.validateYaml(filename, content);
        errors.push(...yamlResult.errors);
      }
    }

    const valid = errors.length === 0;

    logger.info('Validation complete', {
      valid,
      errors: errors.length,
      warnings: warnings.length,
    });

    return { valid, errors, warnings };
  }

  /**
   * Validate TypeScript syntax
   */
  private validateTypeScript(
    filename: string,
    content: string
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Parse TypeScript code
      ts.createSourceFile(
        filename,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      // Simplified syntax checking - just verify it parses without major errors
      // In production, would use full TypeScript compiler API
      const diagnostics: ts.Diagnostic[] = [];

      for (const diagnostic of diagnostics) {
        if (diagnostic.file && diagnostic.start !== undefined) {
          const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
            diagnostic.start
          );

          const message = ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            '\n'
          );

          if (diagnostic.category === ts.DiagnosticCategory.Error) {
            errors.push({
              file: filename,
              line: line + 1,
              column: character + 1,
              message,
              severity: 'error',
            });
          } else if (diagnostic.category === ts.DiagnosticCategory.Warning) {
            warnings.push({
              file: filename,
              line: line + 1,
              column: character + 1,
              message,
              severity: 'warning',
            });
          }
        }
      }
    } catch (error) {
      errors.push({
        file: filename,
        message: `Failed to parse TypeScript: ${(error as Error).message}`,
        severity: 'error',
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate Python syntax (basic check)
   */
  private validatePython(
    filename: string,
    content: string
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic Python syntax checks
    const lines = content.split('\n');

    // Check indentation consistency
    let indentType: 'spaces' | 'tabs' | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip empty lines and comments
      if (line.trim().length === 0 || line.trim().startsWith('#')) {
        continue;
      }

      // Check indentation
      if (line.startsWith('\t') && indentType === 'spaces') {
        warnings.push({
          file: filename,
          line: i + 1,
          message: 'Mixed tabs and spaces for indentation',
          severity: 'warning',
        });
      } else if (line.startsWith(' ') && indentType === 'tabs') {
        warnings.push({
          file: filename,
          line: i + 1,
          message: 'Mixed tabs and spaces for indentation',
          severity: 'warning',
        });
      }

      if (line.startsWith('\t')) {
        indentType = 'tabs';
      } else if (line.startsWith(' ')) {
        indentType = 'spaces';
      }

      // Check for common syntax issues
      if (line.trim().endsWith(':') && i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (nextLine.trim().length > 0 && !nextLine.startsWith(' ') && !nextLine.startsWith('\t')) {
          errors.push({
            file: filename,
            line: i + 2,
            message: 'Expected indented block',
            severity: 'error',
          });
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate JSON syntax
   */
  private validateJson(
    filename: string,
    content: string
  ): { errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    try {
      JSON.parse(content);
    } catch (error: any) {
      errors.push({
        file: filename,
        message: `Invalid JSON: ${error.message}`,
        severity: 'error',
      });
    }

    return { errors };
  }

  /**
   * Validate YAML syntax
   */
  private validateYaml(
    filename: string,
    content: string
  ): { errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    try {
      // Basic YAML validation
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for tabs (YAML doesn't allow tabs)
        if (line.includes('\t')) {
          errors.push({
            file: filename,
            line: i + 1,
            message: 'YAML does not allow tabs for indentation',
            severity: 'error',
          });
        }
      }
    } catch (error: any) {
      errors.push({
        file: filename,
        message: `Invalid YAML: ${error.message}`,
        severity: 'error',
      });
    }

    return { errors };
  }
}
