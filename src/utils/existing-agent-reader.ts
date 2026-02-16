import { promises as fs } from 'fs';
import * as path from 'path';
import { createLogger } from './logger';

const logger = createLogger('ExistingAgentReader');

/**
 * Pattern extracted from existing agent files
 */
export interface ExistingAgentPattern {
  agentsIndex?: string;  // agents.md content
  agentFiles: Map<string, string>;  // agent file name -> content
  claudeMd?: string;  // CLAUDE.md content
  cursorRules?: string;  // .cursorrules content
}

/**
 * Read existing agent files from a directory to learn patterns
 * @param directory - Path to directory containing existing agent files
 * @returns Pattern structure with all discovered agent files
 */
export async function readExistingAgents(directory: string): Promise<ExistingAgentPattern> {
  const pattern: ExistingAgentPattern = {
    agentFiles: new Map<string, string>(),
  };

  try {
    // Check if directory exists
    const stats = await fs.stat(directory);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${directory}`);
    }

    logger.info(`Reading existing agents from: ${directory}`);

    // Read all files in the directory
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      const filename = entry.name;
      const filepath = path.join(directory, filename);

      try {
        const content = await fs.readFile(filepath, 'utf-8');

        // Identify special files
        if (filename === 'agents.md') {
          pattern.agentsIndex = content;
          logger.info('Found agents.md index file');
        } else if (filename === 'CLAUDE.md') {
          pattern.claudeMd = content;
          logger.info('Found CLAUDE.md file');
        } else if (filename === '.cursorrules') {
          pattern.cursorRules = content;
          logger.info('Found .cursorrules file');
        } else if (filename.endsWith('.md')) {
          // Regular agent markdown file
          pattern.agentFiles.set(filename, content);
          logger.info(`Found agent file: ${filename}`);
        }
      } catch (error) {
        logger.warning(`Failed to read file ${filename}: ${(error as Error).message}`);
        // Continue with other files
      }
    }

    const totalFiles = pattern.agentFiles.size +
      (pattern.agentsIndex ? 1 : 0) +
      (pattern.claudeMd ? 1 : 0) +
      (pattern.cursorRules ? 1 : 0);

    logger.info(`Successfully read ${totalFiles} files from ${directory}`);
    logger.info(`  - Agent files: ${pattern.agentFiles.size}`);
    logger.info(`  - Index file: ${pattern.agentsIndex ? 'yes' : 'no'}`);
    logger.info(`  - CLAUDE.md: ${pattern.claudeMd ? 'yes' : 'no'}`);
    logger.info(`  - .cursorrules: ${pattern.cursorRules ? 'yes' : 'no'}`);

    return pattern;
  } catch (error) {
    logger.error(`Failed to read existing agents from ${directory}: ${(error as Error).message}`);
    throw new Error(`Cannot read existing agents from ${directory}: ${(error as Error).message}`);
  }
}

/**
 * Format existing agent patterns into a readable summary for Claude
 * @param pattern - The pattern extracted from existing agents
 * @returns Formatted string for inclusion in prompts
 */
export function formatExistingAgentPattern(pattern: ExistingAgentPattern): string {
  const sections: string[] = [];

  if (pattern.agentsIndex) {
    sections.push('## Existing Agent Index (agents.md)');
    sections.push('```markdown');
    sections.push(pattern.agentsIndex);
    sections.push('```\n');
  }

  if (pattern.agentFiles.size > 0) {
    sections.push(`## Existing Agent Files (${pattern.agentFiles.size} files)\n`);

    // Include up to 3 full agent files as examples
    const filesToShow = Array.from(pattern.agentFiles.entries()).slice(0, 3);
    filesToShow.forEach(([filename, content]) => {
      sections.push(`### File: ${filename}`);
      sections.push('```markdown');
      sections.push(content);
      sections.push('```\n');
    });

    // List remaining files without content
    if (pattern.agentFiles.size > 3) {
      sections.push(`### Additional Agent Files (${pattern.agentFiles.size - 3} more)`);
      const remainingFiles = Array.from(pattern.agentFiles.keys()).slice(3);
      remainingFiles.forEach(filename => {
        sections.push(`- ${filename}`);
      });
      sections.push('');
    }
  }

  if (pattern.claudeMd) {
    sections.push('## Existing CLAUDE.md Guidelines');
    sections.push('```markdown');
    sections.push(pattern.claudeMd);
    sections.push('```\n');
  }

  if (pattern.cursorRules) {
    sections.push('## Existing .cursorrules');
    sections.push('```');
    sections.push(pattern.cursorRules);
    sections.push('```\n');
  }

  return sections.join('\n');
}

/**
 * Extract key patterns and style elements from existing agents
 * @param pattern - The pattern extracted from existing agents
 * @returns Structured insights about the existing agent patterns
 */
export function analyzeExistingAgentPattern(pattern: ExistingAgentPattern): {
  commonSections: string[];
  structurePatterns: string[];
  styleNotes: string[];
} {
  const analysis = {
    commonSections: [] as string[],
    structurePatterns: [] as string[],
    styleNotes: [] as string[],
  };

  // Analyze all agent files
  const allContent = Array.from(pattern.agentFiles.values()).join('\n\n');

  // Common sections found in agents
  const sectionPatterns = [
    { pattern: /##\s*Purpose/i, name: 'Purpose' },
    { pattern: /##\s*When to Activate/i, name: 'When to Activate' },
    { pattern: /##\s*How to Help/i, name: 'How to Help' },
    { pattern: /##\s*Key Knowledge/i, name: 'Key Knowledge' },
    { pattern: /##\s*Example/i, name: 'Examples' },
    { pattern: /##\s*Best Practices/i, name: 'Best Practices' },
    { pattern: /##\s*Integration/i, name: 'Integration Points' },
  ];

  sectionPatterns.forEach(({ pattern, name }) => {
    if (pattern.test(allContent)) {
      analysis.commonSections.push(name);
    }
  });

  // Structure patterns
  if (pattern.agentsIndex) {
    analysis.structurePatterns.push('Uses agents.md index file to organize multiple agents');

    // Check for slash command references
    if (/\/[a-z-]+/i.test(pattern.agentsIndex)) {
      analysis.structurePatterns.push('Uses slash command syntax for agent invocation');
    }
  }

  if (pattern.agentFiles.size > 1) {
    analysis.structurePatterns.push(`Multiple specialized agents (${pattern.agentFiles.size} files)`);
  }

  // Style notes
  const firstAgent = pattern.agentFiles.values().next().value;
  if (firstAgent) {
    // Check heading style
    if (/^# [A-Z]/.test(firstAgent)) {
      analysis.styleNotes.push('Uses title case for main headings');
    }

    // Check bullet style
    if (/^- /.test(firstAgent)) {
      analysis.styleNotes.push('Uses dash bullets for lists');
    }

    // Check code block usage
    const codeBlockCount = (firstAgent.match(/```/g) || []).length / 2;
    if (codeBlockCount > 0) {
      analysis.styleNotes.push(`Uses code blocks for examples (avg ${Math.round(codeBlockCount)} per agent)`);
    }

    // Check emoji usage
    if (/[\u{1F300}-\u{1F9FF}]/u.test(firstAgent)) {
      analysis.styleNotes.push('Includes emojis for visual appeal');
    }
  }

  return analysis;
}
