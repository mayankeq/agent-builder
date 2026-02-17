import { SessionStatus, OutputType, Language } from '@/types';

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  pending: 'Pending',
  clarifying: 'Clarifying',
  designing: 'Designing',
  implementing: 'Implementing',
  packaging: 'Packaging',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  pending: 'text-blue-600 bg-blue-100',
  clarifying: 'text-purple-600 bg-purple-100',
  designing: 'text-indigo-600 bg-indigo-100',
  implementing: 'text-orange-600 bg-orange-100',
  packaging: 'text-yellow-600 bg-yellow-100',
  completed: 'text-green-600 bg-green-100',
  failed: 'text-red-600 bg-red-100',
  cancelled: 'text-gray-600 bg-gray-100',
};

export const OUTPUT_TYPE_LABELS: Record<OutputType, string> = {
  skill: 'Claude Code Skill',
  mcp: 'MCP Server',
  cli: 'CLI Tool',
  library: 'Library',
};

export const OUTPUT_TYPE_DESCRIPTIONS: Record<OutputType, string> = {
  skill: 'A custom skill that extends Claude Code capabilities',
  mcp: 'A Model Context Protocol server for AI integrations',
  cli: 'A command-line interface tool',
  library: 'A reusable library package',
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  typescript: 'TypeScript',
  python: 'Python',
};

export const PRIORITY_LABELS = {
  speed: 'Speed',
  quality: 'Quality',
  trust: 'Trust',
  budget: 'Budget',
};

export const PRIORITY_DESCRIPTIONS = {
  speed: 'Optimize for faster agent creation',
  quality: 'Optimize for higher quality output with comprehensive testing',
  trust: 'Maximize reliability and security',
  budget: 'Minimize token usage and API costs',
};
