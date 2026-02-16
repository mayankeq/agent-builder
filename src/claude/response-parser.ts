import { z } from 'zod';
import { createLogger } from '../utils/logger';
import { ValidationError } from '../utils/error-handler';
import { Question } from '../types/agent';
import { Design } from '../types/workflow';

const logger = createLogger('ResponseParser');

/**
 * Zod schemas for validation
 */

const QuestionSchema = z.object({
  id: z.string(),
  category: z.enum(['functional', 'technical', 'architectural', 'performance', 'output']),
  text: z.string(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
});

const ComponentSchema = z.object({
  name: z.string(),
  type: z.enum(['class', 'module', 'function', 'interface']),
  description: z.string(),
  responsibilities: z.array(z.string()),
  dependencies: z.array(z.string()),
});

const TechnologyChoiceSchema = z.object({
  name: z.string(),
  category: z.string(),
  version: z.string().optional(),
  justification: z.string(),
});

const DesignDecisionSchema = z.object({
  topic: z.string(),
  decision: z.string(),
  reasoning: z.string(),
  alternatives: z.array(z.string()).optional(),
});

const TradeoffSchema = z.object({
  aspect: z.string(),
  chosen: z.string(),
  rejected: z.string(),
  rationale: z.string(),
});

const OptimizationSchema = z.union([
  z.string(),
  z.object({
    type: z.string().optional(),
    description: z.string(),
    impact: z.string().optional(),
    implementation: z.string().optional(),
  }),
]);

const DesignSchema = z.object({
  components: z.array(ComponentSchema),
  dataFlow: z.string(),
  techStack: z.array(TechnologyChoiceSchema),
  fileStructure: z.record(z.any()),
  integrations: z.array(
    z.object({
      system: z.string(),
      method: z.string(),
      description: z.string(),
    })
  ),
  decisions: z.array(DesignDecisionSchema),
  tradeoffs: z.array(TradeoffSchema),
  optimizations: z.array(OptimizationSchema),
});

/**
 * Parse questions from clarification agent response
 */
export function parseQuestions(response: string): Question[] {
  try {
    logger.debug('Parsing questions from response');

    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                      response.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new ValidationError('No JSON array found in response');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonStr);

    // Validate with Zod
    const questions = z.array(QuestionSchema).parse(parsed);

    logger.info(`Parsed ${questions.length} questions`);
    return questions;
  } catch (error) {
    logger.error('Failed to parse questions', error as Error);
    throw new ValidationError(
      'Invalid questions format',
      { originalError: (error as Error).message }
    );
  }
}

/**
 * Parse design from design agent response
 * Uses multiple fallback strategies for robustness
 */
export function parseDesign(response: string): Design {
  try {
    logger.debug('Parsing design from response');

    // Strategy 1: Try markdown code block with validation
    try {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = parseDesignJSON(jsonMatch[1]);
        const design = DesignSchema.parse(parsed);
        logger.info('Design parsed successfully (strategy 1)', {
          components: design.components.length,
          techStack: design.techStack.length,
          decisions: design.decisions.length,
        });
        return design;
      }
    } catch (e) {
      logger.debug('Strategy 1 failed, trying strategy 2');
    }

    // Strategy 2: Try largest JSON object
    try {
      const jsonStr = extractLargestJSON(response);
      const parsed = parseDesignJSON(jsonStr);
      const design = DesignSchema.parse(parsed);
      logger.info('Design parsed successfully (strategy 2)', {
        components: design.components.length,
        techStack: design.techStack.length,
      });
      return design;
    } catch (e) {
      logger.debug('Strategy 2 failed, trying strategy 3');
    }

    // Strategy 3: Aggressive cleaning + relaxed validation
    try {
      const cleaned = cleanJSONString(response);
      const parsed = parseDesignJSON(cleaned);

      // Return with defaults for missing fields (relaxed validation)
      const design: Design = {
        components: parsed.components || [],
        dataFlow: parsed.dataFlow || 'Not specified',
        techStack: parsed.techStack || [],
        fileStructure: parsed.fileStructure || {},
        integrations: parsed.integrations || [],
        decisions: parsed.decisions || [],
        tradeoffs: parsed.tradeoffs || [],
        optimizations: parsed.optimizations || [],
      };

      logger.info('Design parsed successfully (strategy 3 - relaxed)', {
        components: design.components.length,
      });
      return design;
    } catch (e) {
      logger.debug('Strategy 3 failed, trying strategy 4');
    }

    // Strategy 4: Extract partial design with text parsing
    try {
      const design = extractDesignFromText(response);
      logger.info('Design extracted from text (strategy 4)', {
        components: design.components.length,
      });
      return design;
    } catch (e) {
      logger.debug('Strategy 4 failed');
    }

    throw new ValidationError('Could not parse design using any strategy');

  } catch (error) {
    logger.error('Failed to parse design', error as Error);
    throw new ValidationError(
      'Invalid design format',
      { originalError: (error as Error).message }
    );
  }
}

/**
 * Parse JSON string to design object
 */
function parseDesignJSON(jsonStr: string): any {
  return JSON.parse(jsonStr);
}

/**
 * Extract design from text by parsing structured sections
 * Last resort fallback when JSON parsing fails
 */
function extractDesignFromText(text: string): Design {
  logger.warning('Using text extraction as last resort');

  // Look for component sections
  const componentMatches = text.matchAll(/(?:Component|Module):\s*([^\n]+)/gi);
  const components = Array.from(componentMatches).map((match, index) => ({
    name: match[1].trim() || `Component${index + 1}`,
    type: 'module' as const,
    description: 'Extracted from text',
    responsibilities: [],
    dependencies: [],
  }));

  return {
    components: components.length > 0 ? components : [
      {
        name: 'MainComponent',
        type: 'module',
        description: 'Primary component (extracted from partial response)',
        responsibilities: ['Core functionality'],
        dependencies: [],
      }
    ],
    dataFlow: 'Data flow information not available',
    techStack: [],
    fileStructure: {},
    integrations: [],
    decisions: [],
    tradeoffs: [],
    optimizations: [],
  };
}

/**
 * Parse code files from implementation agent response
 * Uses multiple fallback strategies for robustness
 */
export function parseCode(response: string): Record<string, string> {
  try {
    logger.debug('Parsing code from response');

    // Strategy 1: Try to parse JSON from markdown code block
    try {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = parseCodeJSON(jsonMatch[1]);
        logger.info(`Parsed ${Object.keys(parsed).length} code files (strategy 1: markdown block)`);
        return parsed;
      }
    } catch (e) {
      logger.debug('Strategy 1 failed, trying strategy 2');
    }

    // Strategy 2: Try to find and parse the largest JSON object
    try {
      const parsed = parseCodeJSON(extractLargestJSON(response));
      logger.info(`Parsed ${Object.keys(parsed).length} code files (strategy 2: largest JSON)`);
      return parsed;
    } catch (e) {
      logger.debug('Strategy 2 failed, trying strategy 3');
    }

    // Strategy 3: Extract code blocks with file paths as comments
    try {
      const parsed = extractCodeBlocksByPath(response);
      if (Object.keys(parsed).length > 0) {
        logger.info(`Parsed ${Object.keys(parsed).length} code files (strategy 3: code blocks)`);
        return parsed;
      }
    } catch (e) {
      logger.debug('Strategy 3 failed, trying strategy 4');
    }

    // Strategy 4: Last resort - clean and parse aggressively
    try {
      const cleaned = cleanJSONString(response);
      const parsed = parseCodeJSON(cleaned);
      logger.info(`Parsed ${Object.keys(parsed).length} code files (strategy 4: aggressive clean)`);
      return parsed;
    } catch (e) {
      logger.debug('Strategy 4 failed');
    }

    // All strategies failed
    throw new ValidationError('Could not parse code from response using any strategy');

  } catch (error) {
    logger.error('Failed to parse code', error as Error);
    throw new ValidationError(
      'Invalid code format',
      { originalError: (error as Error).message }
    );
  }
}

/**
 * Parse JSON string to code object with validation
 */
function parseCodeJSON(jsonStr: string): Record<string, string> {
  const parsed = JSON.parse(jsonStr);

  // Validate it's a record of strings
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ValidationError('Code must be an object mapping paths to contents');
  }

  // Validate all values are strings
  for (const [path, content] of Object.entries(parsed)) {
    if (typeof content !== 'string') {
      throw new ValidationError(`Content for ${path} must be a string`);
    }
  }

  return parsed;
}

/**
 * Extract the largest JSON object from text
 */
function extractLargestJSON(text: string): string {
  const matches: string[] = [];

  // Find all potential JSON objects
  let depth = 0;
  let start = -1;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (depth === 0) {
        start = i;
      }
      depth++;
    } else if (text[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        matches.push(text.substring(start, i + 1));
        start = -1;
      }
    }
  }

  if (matches.length === 0) {
    throw new Error('No JSON objects found');
  }

  // Return the largest one
  return matches.reduce((a, b) => a.length > b.length ? a : b);
}

/**
 * Extract code blocks with file path markers
 * Looks for patterns like:
 * FILE: src/index.ts
 * ```typescript
 * code here
 * ```
 */
function extractCodeBlocksByPath(text: string): Record<string, string> {
  const result: Record<string, string> = {};

  // Pattern 1: FILE: path/to/file.ext format
  const filePattern = /FILE:\s*([^\n]+?)\s*\n```(?:[a-z]+)?\n([\s\S]*?)```/gi;
  let match;
  while ((match = filePattern.exec(text)) !== null) {
    const filePath = match[1].trim();
    const code = match[2].trim();
    result[filePath] = code;
  }

  // Pattern 2: Comment-based (legacy): // src/index.ts or # src/index.py
  if (Object.keys(result).length === 0) {
    const commentPattern = /(?:\/\/|#)\s*([^\n]+?\.[a-z]{2,4})\s*\n```(?:[a-z]+)?\n([\s\S]*?)```/gi;
    while ((match = commentPattern.exec(text)) !== null) {
      const filePath = match[1].trim();
      const code = match[2].trim();
      result[filePath] = code;
    }
  }

  return result;
}

/**
 * Clean JSON string by fixing common issues
 */
function cleanJSONString(text: string): string {
  // Extract JSON-like content
  let json = text.match(/\{[\s\S]*\}/)?.[0] || text;

  // Fix common issues
  json = json
    // Remove trailing commas
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix unescaped quotes in strings (basic attempt)
    .replace(/("(?:[^"\\]|\\.)*")/g, (match) => {
      return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
    });

  return json;
}

/**
 * Parse test files from testing agent response
 */
export function parseTests(response: string): Record<string, string> {
  try {
    logger.debug('Parsing tests from response');

    // Same format as code
    return parseCode(response);
  } catch (error) {
    logger.error('Failed to parse tests', error as Error);
    throw new ValidationError(
      'Invalid tests format',
      { originalError: (error as Error).message }
    );
  }
}

/**
 * Parse documentation files from documentation agent response
 */
export function parseDocs(response: string): Record<string, string> {
  try {
    logger.debug('Parsing documentation from response');

    // Same format as code
    return parseCode(response);
  } catch (error) {
    logger.error('Failed to parse documentation', error as Error);
    throw new ValidationError(
      'Invalid documentation format',
      { originalError: (error as Error).message }
    );
  }
}

/**
 * Parse package configuration from packaging agent response
 */
export function parsePackageConfig(response: string): Record<string, string> {
  try {
    logger.debug('Parsing package config from response');

    // Same format as code
    return parseCode(response);
  } catch (error) {
    logger.error('Failed to parse package config', error as Error);
    throw new ValidationError(
      'Invalid package config format',
      { originalError: (error as Error).message }
    );
  }
}

/**
 * Extract thinking blocks and convert to structured format
 */
export function parseThinkingTrace(thinkingBlocks: string[]): any {
  return {
    phases: thinkingBlocks.length,
    content: thinkingBlocks,
    summary: thinkingBlocks.length > 0
      ? `Extended thinking with ${thinkingBlocks.length} phases`
      : 'No extended thinking captured',
  };
}

/**
 * Safe JSON extraction from text that may contain markdown
 */
export function extractJSON(text: string): any {
  // Try to find JSON in markdown code blocks
  const codeBlockMatch = text.match(/```json\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1]);
  }

  // Try to find raw JSON object
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return JSON.parse(objectMatch[0]);
  }

  // Try to find raw JSON array
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return JSON.parse(arrayMatch[0]);
  }

  throw new Error('No JSON found in text');
}

/**
 * Validate and clean parsed data
 */
export function validateAndClean(data: any, schema: z.ZodSchema): any {
  try {
    return schema.parse(data);
  } catch (error) {
    logger.warning('Validation failed, attempting to clean data', {
      error: (error as Error).message,
    });

    // Attempt basic cleaning (remove undefined, null, empty arrays)
    const cleaned = cleanObject(data);

    return schema.parse(cleaned);
  }
}

function cleanObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(cleanObject).filter(item => item !== undefined && item !== null);
  }

  if (obj !== null && typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = cleanObject(value);
      if (cleanedValue !== undefined && cleanedValue !== null) {
        if (Array.isArray(cleanedValue) && cleanedValue.length === 0) {
          continue;
        }
        cleaned[key] = cleanedValue;
      }
    }
    return cleaned;
  }

  return obj;
}
