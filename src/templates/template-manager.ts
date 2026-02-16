import Handlebars from 'handlebars';
import { createLogger } from '../utils/logger';
import { FileManager } from '../utils/file-manager';
import { OutputType, Language, TemplateData, GeneratedFiles } from '../types/templates';
import * as path from 'path';

const logger = createLogger('TemplateManager');

/**
 * Template Manager - Handles template rendering for different output types
 */
export class TemplateManager {
  private templateDir: string;
  private handlebars: typeof Handlebars;

  constructor(templateDir?: string) {
    this.templateDir = templateDir || path.join(process.cwd(), 'templates');
    this.handlebars = Handlebars.create();
    this.registerHelpers();

    logger.info('Template manager initialized', { templateDir: this.templateDir });
  }

  /**
   * Render template for given output type and language
   */
  async renderTemplate(
    type: OutputType,
    language: Language,
    data: TemplateData
  ): Promise<GeneratedFiles> {
    logger.info(`Rendering template: ${type}/${language}`);

    const templatePath = this.getTemplatePath(type, language);
    const templates = await this.loadTemplates(templatePath);

    const files: GeneratedFiles = {};

    for (const [filename, templateContent] of Object.entries(templates)) {
      try {
        const rendered = this.render(templateContent, data);
        // Process filename (might have handlebars)
        const processedFilename = this.render(filename, data);
        files[processedFilename] = rendered;
      } catch (error) {
        logger.error(`Failed to render ${filename}`, error as Error);
        throw error;
      }
    }

    logger.info(`Rendered ${Object.keys(files).length} files`);
    return files;
  }

  /**
   * Get template directory path
   */
  private getTemplatePath(type: OutputType, language: Language): string {
    return path.join(this.templateDir, type, language);
  }

  /**
   * Load all template files from directory
   */
  private async loadTemplates(templatePath: string): Promise<Record<string, string>> {
    const templates: Record<string, string> = {};

    try {
      const files = await this.findTemplateFiles(templatePath);

      for (const file of files) {
        const fullPath = path.join(templatePath, file);
        const content = await FileManager.readFile(fullPath);
        // Remove .hbs extension for output filename
        const outputName = file.replace(/\.hbs$/, '');
        templates[outputName] = content;
      }

      logger.debug(`Loaded ${files.length} templates from ${templatePath}`);
    } catch (error) {
      logger.error(`Failed to load templates from ${templatePath}`, error as Error);
      // Return inline templates as fallback
      return this.getInlineTemplates(templatePath);
    }

    return templates;
  }

  /**
   * Find all template files recursively
   */
  private async findTemplateFiles(dir: string, baseDir: string = ''): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await FileManager.listFiles(dir);

      for (const entry of entries) {
        const relativePath = baseDir ? path.join(baseDir, entry) : entry;

        if (entry.endsWith('.hbs')) {
          files.push(relativePath);
        }
      }
    } catch (error) {
      logger.warning(`Directory not found: ${dir}, will use inline templates`);
    }

    return files;
  }

  /**
   * Render single template with data
   */
  private render(template: string, data: TemplateData): string {
    const compiled = this.handlebars.compile(template);
    return compiled(data);
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    // Date formatting
    this.handlebars.registerHelper('currentYear', () => {
      return new Date().getFullYear();
    });

    // String helpers
    this.handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    this.handlebars.registerHelper('lowercase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });

    // Conditional helper
    this.handlebars.registerHelper('eq', (a: any, b: any) => {
      return a === b;
    });

    // JSON stringification
    this.handlebars.registerHelper('json', (obj: any) => {
      return JSON.stringify(obj, null, 2);
    });

    // Join array
    this.handlebars.registerHelper('join', (arr: any[], separator: string = ', ') => {
      return Array.isArray(arr) ? arr.join(separator) : '';
    });

    logger.debug('Handlebars helpers registered');
  }

  /**
   * Fallback inline templates when files don't exist
   */
  private getInlineTemplates(templatePath: string): Record<string, string> {
    // Extract type and language from path
    const parts = templatePath.split(path.sep);
    const language = parts[parts.length - 1];
    const type = parts[parts.length - 2];

    logger.info(`Using inline templates for ${type}/${language}`);

    // Return basic inline templates based on type
    if (type === 'mcp' && language === 'typescript') {
      return {
        'index.ts': this.getMcpTypeScriptTemplate(),
        'package.json': this.getPackageJsonTemplate(),
        'tsconfig.json': this.getTsConfigTemplate(),
        'README.md': this.getReadmeTemplate(),
      };
    }

    // Default simple template
    return {
      'main.ts': '// {{name}}\n// {{description}}\n\nexport function main() {\n  console.log("Hello from {{name}}");\n}\n',
      'README.md': '# {{name}}\n\n{{description}}\n',
    };
  }

  /**
   * Inline MCP TypeScript template
   */
  private getMcpTypeScriptTemplate(): string {
    return `#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// {{name}}
// {{description}}

const server = new Server(
  {
    name: '{{name}}',
    version: '{{version}}',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool schemas
const exampleToolSchema = z.object({
  input: z.string().describe('Input parameter'),
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'example_tool',
        description: 'An example tool',
        inputSchema: zodToJsonSchema(exampleToolSchema),
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'example_tool') {
    const args = exampleToolSchema.parse(request.params.arguments);

    return {
      content: [
        {
          type: 'text',
          text: \`Processed: \${args.input}\`,
        },
      ],
    };
  }

  throw new Error(\`Unknown tool: \${request.params.name}\`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('{{name}} MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
`;
  }

  private getPackageJsonTemplate(): string {
    return `{
  "name": "{{name}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "type": "module",
  "bin": {
    "{{name}}": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "prepare": "npm run build"
  },
  "dependencies": {
    {{#each dependencies}}
    "{{name}}": "{{version}}"{{#unless @last}},{{/unless}}
    {{/each}}
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
`;
  }

  private getTsConfigTemplate(): string {
    return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`;
  }

  private getReadmeTemplate(): string {
    return `# {{name}}

{{description}}

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## Usage

\`\`\`bash
{{name}}
\`\`\`

## Generated by

Agent-Builder - https://github.com/yourusername/agent-builder
`;
  }
}
