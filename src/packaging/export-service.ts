import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { createLogger } from '../utils/logger';
import { WorkflowContext } from '../types/workflow';

const logger = createLogger('ExportService');

export interface ExportOptions {
  sessionId: string;
  outputDir: string;
  outputType: string;
  language: string;
  includeSource?: boolean;
  includeDocs?: boolean;
  includeTests?: boolean;
}

export interface ExportResult {
  success: boolean;
  zipPath?: string;
  size?: number;
  error?: string;
}

/**
 * Export Service - Creates downloadable ZIP packages of generated agents
 */
export class ExportService {
  /**
   * Export agent as ZIP file
   */
  async exportAgent(
    context: WorkflowContext,
    outputDir: string
  ): Promise<ExportResult> {
    try {
      const zipFileName = `${context.sessionId}-${context.options.outputType || 'agent'}.zip`;
      const zipPath = path.join(outputDir, '..', 'downloads', zipFileName);

      // Ensure downloads directory exists
      const downloadsDir = path.dirname(zipPath);
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      logger.info('Creating ZIP export', { zipPath });

      // Create ZIP archive
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      const output = fs.createWriteStream(zipPath);

      // Handle archive events
      output.on('close', () => {
        logger.info('ZIP archive created', {
          size: archive.pointer(),
          path: zipPath,
        });
      });

      archive.on('error', (err: Error) => {
        throw err;
      });

      // Pipe archive to file
      archive.pipe(output);

      // Add all files from output directory
      if (fs.existsSync(outputDir)) {
        archive.directory(outputDir, false);
      }

      // Add setup instructions
      const instructions = this.generateSetupInstructions(context);
      archive.append(instructions, { name: 'SETUP.md' });

      // Add README
      const readme = this.generateReadme(context);
      archive.append(readme, { name: 'README.md' });

      // Finalize archive
      await archive.finalize();

      // Wait for output stream to finish
      await new Promise<void>((resolve, reject) => {
        output.on('close', () => resolve());
        output.on('error', reject);
      });

      const stats = fs.statSync(zipPath);

      return {
        success: true,
        zipPath,
        size: stats.size,
      };
    } catch (error) {
      logger.error('Export failed', error as Error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Generate setup instructions based on output type
   */
  private generateSetupInstructions(context: WorkflowContext): string {
    const outputType = context.options.outputType || 'skill';
    const language = context.options.language || 'typescript';

    const instructions: Record<string, string> = {
      skill: `# Skill Setup Instructions

## Installation

This is a Claude Code skill. To install:

1. **Extract the ZIP file**
   \`\`\`bash
   unzip ${context.sessionId}-skill.zip -d my-skill
   cd my-skill
   \`\`\`

2. **Install dependencies**
   ${language === 'typescript' ? `\`\`\`bash
   npm install
   \`\`\`` : `\`\`\`bash
   pip install -r requirements.txt
   \`\``}

3. **Build the skill** (TypeScript only)
   ${language === 'typescript' ? `\`\`\`bash
   npm run build
   \`\`\`` : 'N/A'}

4. **Deploy to Claude Code**
   \`\`\`bash
   cp -r . ~/.claude/skills/$(basename $PWD)
   \`\`\`

5. **Verify installation**
   - Open Claude Code CLI
   - The skill should appear in your available skills list

## Usage

Invoke the skill in Claude Code using its skill invocation command.

## Configuration

Check the skill.yaml file for configuration options.

## Troubleshooting

- **Skill not appearing**: Restart Claude Code CLI
- **Dependencies missing**: Re-run install commands
- **Build errors**: Check for TypeScript/Python version compatibility
`,

      mcp: `# MCP Server Setup Instructions

## Installation

This is an MCP (Model Context Protocol) server. To install:

1. **Extract the ZIP file**
   \`\`\`bash
   unzip ${context.sessionId}-mcp.zip -d my-mcp-server
   cd my-mcp-server
   \`\`\`

2. **Install dependencies**
   ${language === 'typescript' ? `\`\`\`bash
   npm install
   \`\`\`` : `\`\`\`bash
   pip install -r requirements.txt
   \`\``}

3. **Build the server** (TypeScript only)
   ${language === 'typescript' ? `\`\`\`bash
   npm run build
   \`\`\`` : 'N/A'}

4. **Register with Claude**

   Add to your \`~/.claude/config.json\`:
   \`\`\`json
   {
     "mcpServers": {
       "${context.sessionId}": {
         "command": "${language === 'typescript' ? 'node' : 'python'}",
         "args": ["${language === 'typescript' ? 'dist/index.js' : 'src/server.py'}"],
         "disabled": false
       }
     }
   }
   \`\`\`

5. **Test the server**
   \`\`\`bash
   ${language === 'typescript' ? 'node dist/index.js' : 'python src/server.py'}
   \`\`\`

## Configuration

Check package.json or config files for server configuration options.

## Troubleshooting

- **Server not connecting**: Check Claude config.json syntax
- **Command not found**: Verify Node.js or Python in PATH
- **Port conflicts**: Check if another service is using the same port
`,

      cli: `# CLI Tool Setup Instructions

## Installation

This is a command-line tool. To install:

1. **Extract the ZIP file**
   \`\`\`bash
   unzip ${context.sessionId}-cli.zip -d my-cli-tool
   cd my-cli-tool
   \`\`\`

2. **Install dependencies**
   ${language === 'typescript' ? `\`\`\`bash
   npm install
   \`\`\`` : `\`\`\`bash
   pip install -r requirements.txt
   \`\``}

3. **Build the tool** (TypeScript only)
   ${language === 'typescript' ? `\`\`\`bash
   npm run build
   \`\`\`` : 'N/A'}

4. **Install globally**

   ${language === 'typescript' ? `**Option A: npm link (development)**
   \`\`\`bash
   npm link
   \`\`\`

   **Option B: Copy to local bin**
   \`\`\`bash
   mkdir -p ~/.local/bin
   cp dist/cli.js ~/.local/bin/my-cli
   chmod +x ~/.local/bin/my-cli
   \`\`\`

   Make sure \`~/.local/bin\` is in your PATH.` : `**Option A: pip install (development)**
   \`\`\`bash
   pip install -e .
   \`\`\`

   **Option B: Install from package**
   \`\`\`bash
   python setup.py install
   \`\`\``}

5. **Verify installation**
   \`\`\`bash
   my-cli --help
   \`\`\`

## Usage

See README.md for command usage and examples.

## Troubleshooting

- **Command not found**: Ensure installation directory is in PATH
- **Permission denied**: Check file permissions (chmod +x)
- **Module errors**: Verify all dependencies are installed
`,

      library: `# Library Setup Instructions

## Installation

This is a reusable library. To use:

1. **Extract the ZIP file**
   \`\`\`bash
   unzip ${context.sessionId}-library.zip -d my-library
   cd my-library
   \`\`\`

2. **Install dependencies**
   ${language === 'typescript' ? `\`\`\`bash
   npm install
   \`\`\`` : `\`\`\`bash
   pip install -r requirements.txt
   \`\``}

3. **Build the library** (TypeScript only)
   ${language === 'typescript' ? `\`\`\`bash
   npm run build
   \`\`\`` : 'N/A'}

## Development Use

${language === 'typescript' ? `**Link for local development:**
\`\`\`bash
npm link
\`\`\`

**Use in another project:**
\`\`\`bash
cd /path/to/your/project
npm link my-library
\`\`\`` : `**Install in editable mode:**
\`\`\`bash
pip install -e .
\`\`\`

**Use in another project:**
\`\`\`python
import my_library
\`\`\``}

## Publishing

${language === 'typescript' ? `**Publish to npm:**
\`\`\`bash
npm publish
\`\`\`` : `**Publish to PyPI:**
\`\`\`bash
python setup.py sdist bdist_wheel
twine upload dist/*
\`\`\``}

## Usage

See README.md for API documentation and usage examples.

## Testing

${language === 'typescript' ? `\`\`\`bash
npm test
\`\`\`` : `\`\`\`bash
pytest
\`\`\``}
`,
    };

    return instructions[outputType] || instructions.skill;
  }

  /**
   * Generate README for the agent
   */
  private generateReadme(context: WorkflowContext): string {
    const domain = context.research?.domain || 'general';
    const userIntent = context.research?.userIntent || 'Not available';
    const capabilities =
      context.research?.capabilities?.join(', ') || 'Not available';

    return `# ${context.options.outputType?.toUpperCase() || 'Agent'}: ${context.sessionId}

## Overview

**Domain**: ${domain}
**User Intent**: ${userIntent}
**Capabilities**: ${capabilities}

## Generated Information

- **Session ID**: ${context.sessionId}
- **Output Type**: ${context.options.outputType || 'skill'}
- **Language**: ${context.options.language || 'typescript'}
- **Quality Tier**: ${context.options.qualityTier || 'simple'}
- **Generated**: ${new Date().toISOString()}

## Structure

This package contains all the artifacts generated for your agent:

- \`src/\` - Source code
- \`tests/\` - Test files
- \`docs/\` - Documentation
- \`config/\` - Configuration files
- \`SETUP.md\` - Installation and setup instructions
- \`README.md\` - This file

## Quick Start

See \`SETUP.md\` for detailed installation instructions.

## Design Decisions

${context.design?.decisions?.map((d) => `### ${d.topic}\n**Decision**: ${d.decision}\n**Reasoning**: ${d.reasoning}\n`).join('\n') || 'No design decisions recorded'}

## Success Criteria

${context.research?.successCriteria?.map((sc, i) => `${i + 1}. ${sc}`).join('\n') || 'No success criteria defined'}

## Support

Generated by Synthient Agent-Builder Platform.

For issues or questions about the generated agent, refer to the documentation or contact your administrator.
`;
  }
}
