/**
 * Output types supported
 */
export type OutputType =
  | 'skill'    // Prompt-based markdown agents (NEW)
  | 'plugin'   // Executable code (formerly 'skill')
  | 'mcp'      // MCP servers
  | 'cli'      // CLI tools
  | 'library'; // Libraries

/**
 * Programming languages supported
 */
export type Language = 'typescript' | 'python';

/**
 * Template data for rendering
 */
export interface TemplateData {
  name: string;
  description: string;
  version: string;
  author?: string;
  language: Language;
  outputType: OutputType;
  dependencies: Dependency[];
  code: Record<string, string>;
  tests: Record<string, string>;
  config: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Dependency specification
 */
export interface Dependency {
  name: string;
  version: string;
  isDev?: boolean;
}

/**
 * Generated files from templates
 */
export interface GeneratedFiles {
  [filename: string]: string;
}

/**
 * Template metadata
 */
export interface TemplateMetadata {
  name: string;
  outputType: OutputType;
  language: Language;
  description: string;
  files: string[];
  requiredData: string[];
}
