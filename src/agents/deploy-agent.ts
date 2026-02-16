import { BaseAgent } from './base-agent';
import { AgentConfig, AgentResult } from '../types/agent';
import { WorkflowContext, WorkflowPhase } from '../types/workflow';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

const exec = promisify(require('child_process').exec);

export interface DeploymentResult {
  installed: boolean;
  skillPath: string;
  setupComplete: boolean;
  message: string;
}

/**
 * Deploy Agent - Automatically deploys generated agents
 * Handles installation, dependency setup, and Claude Code registration
 */
export class DeployAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  getName(): string {
    return 'DeployAgent';
  }

  getPhase(): WorkflowPhase {
    return 'packaging';
  }

  async execute(context: WorkflowContext): Promise<AgentResult> {
    this.validateContext(context);
    this.startExecution();

    try {
      if (!context.implementation) {
        throw new Error('Implementation must be available for deployment');
      }

      this.logProgress('Starting auto-deployment');

      const outputDir = `./output/${context.sessionId}`;
      const deployResult = await this.deploySkill(
        outputDir,
        context.requirements?.output.type || 'skill'
      );

      this.logProgress('Deployment completed', {
        installed: deployResult.installed,
        path: deployResult.skillPath,
      });

      this.endExecution(true);

      return {
        type: 'deploy_complete',
        data: { deployment: deployResult },
        nextPhase: 'completed',
        metadata: {
          autoDeployed: deployResult.installed,
        },
      };
    } catch (error) {
      this.endExecution(false, error as Error);
      throw error;
    }
  }

  /**
   * Deploy agent based on output type
   */
  private async deploySkill(
    outputDir: string,
    outputType: string
  ): Promise<DeploymentResult> {
    switch (outputType) {
      case 'skill':
        return this.deploySkillType(outputDir);
      case 'mcp':
        return this.deployMCPServer(outputDir);
      case 'cli':
        return this.deployCLITool(outputDir);
      case 'library':
        return this.deployLibrary(outputDir);
      default:
        return {
          installed: false,
          skillPath: outputDir,
          setupComplete: false,
          message: `Unknown output type: ${outputType}`,
        };
    }
  }

  /**
   * Deploy skill to Claude Code
   */
  private async deploySkillType(outputDir: string): Promise<DeploymentResult> {

    try {
      // 1. Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        throw new Error(`Output directory not found: ${outputDir}`);
      }

      // 2. Install dependencies
      this.logProgress('Installing dependencies');
      await this.installDependencies(outputDir);

      // 3. Build the skill
      this.logProgress('Building skill');
      await this.buildSkill(outputDir);

      // 4. Copy to Claude Code skills directory
      const claudeSkillsDir = path.join(os.homedir(), '.claude', 'skills');
      const skillName = this.getSkillName(outputDir);
      const targetPath = path.join(claudeSkillsDir, skillName);

      this.logProgress('Deploying to Claude Code', { target: targetPath });

      // Ensure skills directory exists
      if (!fs.existsSync(claudeSkillsDir)) {
        fs.mkdirSync(claudeSkillsDir, { recursive: true });
      }

      // Copy skill to Claude Code directory
      await this.copyDirectory(outputDir, targetPath);

      // 5. Run initial setup if setup script exists
      const setupComplete = await this.runSetup(targetPath);

      return {
        installed: true,
        skillPath: targetPath,
        setupComplete,
        message: `Skill deployed to ${targetPath}. Available in Claude Code as: ${skillName}`,
      };
    } catch (error) {
      this.logger.error('Deployment failed', error as Error);
      return {
        installed: false,
        skillPath: outputDir,
        setupComplete: false,
        message: `Deployment failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Install npm dependencies
   */
  private async installDependencies(dir: string): Promise<void> {
    try {
      await exec('npm install', { cwd: dir });
      this.logProgress('Dependencies installed');
    } catch (error) {
      this.logger.error('Failed to install dependencies', error as Error);
      // Continue anyway - skill might still work
    }
  }

  /**
   * Build the skill
   */
  private async buildSkill(dir: string): Promise<void> {
    try {
      const packageJson = path.join(dir, 'package.json');
      if (fs.existsSync(packageJson)) {
        const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
        if (pkg.scripts && pkg.scripts.build) {
          await exec('npm run build', { cwd: dir });
          this.logProgress('Skill built successfully');
        }
      }
    } catch (error) {
      this.logger.error('Failed to build skill', error as Error);
      // Continue anyway
    }
  }

  /**
   * Get skill name from skill.yaml
   */
  private getSkillName(dir: string): string {
    try {
      const skillYaml = path.join(dir, 'skill.yaml');
      if (fs.existsSync(skillYaml)) {
        const content = fs.readFileSync(skillYaml, 'utf-8');
        const nameMatch = content.match(/name:\s*(.+)/);
        if (nameMatch) {
          return nameMatch[1].trim();
        }
      }
    } catch (error) {
      this.logger.error('Could not read skill name', error as Error);
    }
    return path.basename(dir);
  }

  /**
   * Copy directory recursively
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    // Remove destination if it exists
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }

    // Create destination
    fs.mkdirSync(dest, { recursive: true });

    // Copy all files
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and build artifacts
        if (['node_modules', '.git', 'dist'].includes(entry.name)) {
          continue;
        }
        await this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Run setup script if it exists
   */
  private async runSetup(dir: string): Promise<boolean> {
    try {
      const setupScript = path.join(dir, 'setup.js');
      if (fs.existsSync(setupScript)) {
        this.logProgress('Running setup script');
        await exec(`node setup.js`, { cwd: dir });
        return true;
      }
    } catch (error) {
      this.logger.error('Setup script failed', error as Error);
    }
    return false;
  }

  /**
   * Deploy MCP server to Claude Code
   */
  private async deployMCPServer(outputDir: string): Promise<DeploymentResult> {
    try {
      // 1. Install dependencies and build
      await this.installDependencies(outputDir);
      await this.buildSkill(outputDir); // Uses npm run build if available

      // 2. Copy to MCP servers directory
      const mcpServersDir = path.join(os.homedir(), '.claude', 'mcp-servers');
      const serverName = this.getMCPServerName(outputDir);
      const targetPath = path.join(mcpServersDir, serverName);

      this.logProgress('Deploying MCP server to Claude Code', { target: targetPath });

      // Ensure directory exists
      if (!fs.existsSync(mcpServersDir)) {
        fs.mkdirSync(mcpServersDir, { recursive: true });
      }

      // Copy server to Claude Code directory
      await this.copyDirectory(outputDir, targetPath);

      // 3. Register in Claude config
      await this.registerMCPServer(serverName, targetPath);

      return {
        installed: true,
        skillPath: targetPath,
        setupComplete: true,
        message: `MCP server deployed to ${targetPath} and registered in Claude config`,
      };
    } catch (error) {
      this.logger.error('MCP deployment failed', error as Error);
      return {
        installed: false,
        skillPath: outputDir,
        setupComplete: false,
        message: `MCP deployment failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Deploy CLI tool to user's PATH
   */
  private async deployCLITool(outputDir: string): Promise<DeploymentResult> {
    try {
      // 1. Install dependencies and build
      await this.installDependencies(outputDir);
      await this.buildSkill(outputDir);

      // 2. Get CLI name
      const cliName = this.getCLIName(outputDir);

      // 3. Install globally or to local bin
      const localBin = path.join(os.homedir(), '.local', 'bin');

      // Ensure ~/.local/bin exists
      if (!fs.existsSync(localBin)) {
        fs.mkdirSync(localBin, { recursive: true });
      }

      // Check if it's an npm package
      const packageJson = path.join(outputDir, 'package.json');
      if (fs.existsSync(packageJson)) {
        // For npm packages, use npm link or copy bin
        const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
        if (pkg.bin) {
          const binName = typeof pkg.bin === 'string' ? cliName : Object.keys(pkg.bin)[0];
          const binSource = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin[binName];
          const sourcePath = path.join(outputDir, binSource);
          const targetPath = path.join(localBin, binName);

          // Copy and make executable
          fs.copyFileSync(sourcePath, targetPath);
          fs.chmodSync(targetPath, '755');

          return {
            installed: true,
            skillPath: targetPath,
            setupComplete: true,
            message: `CLI tool installed to ${targetPath}. Make sure ${localBin} is in your PATH.`,
          };
        }
      }

      // For Python CLIs
      const setupPy = path.join(outputDir, 'setup.py');
      if (fs.existsSync(setupPy)) {
        await exec('pip install -e .', { cwd: outputDir });
        return {
          installed: true,
          skillPath: outputDir,
          setupComplete: true,
          message: `Python CLI installed in development mode from ${outputDir}`,
        };
      }

      return {
        installed: false,
        skillPath: outputDir,
        setupComplete: false,
        message: 'Could not determine how to install CLI tool',
      };
    } catch (error) {
      this.logger.error('CLI deployment failed', error as Error);
      return {
        installed: false,
        skillPath: outputDir,
        setupComplete: false,
        message: `CLI deployment failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Deploy library (package as npm/pip module)
   */
  private async deployLibrary(outputDir: string): Promise<DeploymentResult> {
    try {
      // 1. Install dependencies and build
      await this.installDependencies(outputDir);
      await this.buildSkill(outputDir);

      // 2. For libraries, we don't "install" them - we just prepare the package
      const packageJson = path.join(outputDir, 'package.json');
      const setupPy = path.join(outputDir, 'setup.py');

      let message = `Library packaged in ${outputDir}.\n\n`;

      if (fs.existsSync(packageJson)) {
        message += 'To use as npm package:\n';
        message += `  1. cd ${outputDir}\n`;
        message += `  2. npm link (for local development)\n`;
        message += `  3. npm publish (to publish to npm registry)\n`;
      } else if (fs.existsSync(setupPy)) {
        message += 'To use as Python package:\n';
        message += `  1. cd ${outputDir}\n`;
        message += `  2. pip install -e . (for local development)\n`;
        message += `  3. python setup.py sdist bdist_wheel (to build)\n`;
        message += `  4. twine upload dist/* (to publish to PyPI)\n`;
      }

      return {
        installed: false,
        skillPath: outputDir,
        setupComplete: true,
        message,
      };
    } catch (error) {
      this.logger.error('Library packaging failed', error as Error);
      return {
        installed: false,
        skillPath: outputDir,
        setupComplete: false,
        message: `Library packaging failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Get MCP server name from package.json
   */
  private getMCPServerName(dir: string): string {
    try {
      const packageJson = path.join(dir, 'package.json');
      if (fs.existsSync(packageJson)) {
        const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
        return pkg.name || path.basename(dir);
      }
    } catch (error) {
      this.logger.error('Could not read server name', error as Error);
    }
    return path.basename(dir);
  }

  /**
   * Get CLI name from package.json
   */
  private getCLIName(dir: string): string {
    try {
      const packageJson = path.join(dir, 'package.json');
      if (fs.existsSync(packageJson)) {
        const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
        if (pkg.bin) {
          return typeof pkg.bin === 'string' ? pkg.name : Object.keys(pkg.bin)[0];
        }
        return pkg.name || path.basename(dir);
      }
    } catch (error) {
      this.logger.error('Could not read CLI name', error as Error);
    }
    return path.basename(dir);
  }

  /**
   * Register MCP server in Claude config
   */
  private async registerMCPServer(serverName: string, serverPath: string): Promise<void> {
    try {
      const configPath = path.join(os.homedir(), '.claude', 'config.json');
      let config: any = {};

      // Read existing config
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }

      // Ensure mcpServers section exists
      if (!config.mcpServers) {
        config.mcpServers = {};
      }

      // Add server entry
      config.mcpServers[serverName] = {
        command: 'node',
        args: [path.join(serverPath, 'dist', 'index.js')],
        disabled: false,
      };

      // Write back
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      this.logProgress('Registered MCP server in Claude config');
    } catch (error) {
      this.logger.error('Failed to register MCP server', error as Error);
      throw error;
    }
  }
}
