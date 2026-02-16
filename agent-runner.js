// Agent Runner - Integrates frontend with agent-builder CLI

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// In-memory storage for agent sessions (replace with database in production)
const sessions = new Map();

/**
 * Create and run an agent
 * @param {Object} params - Agent parameters
 * @param {string} params.description - Agent description
 * @param {string} params.output_format - Output format (mcp, cli, library, skill)
 * @param {string} params.language - Programming language (typescript, python)
 * @param {Object} params.options - Additional options
 * @param {string} params.userId - User ID (for tracking)
 * @returns {string} Session ID
 */
function createAgent({ description, output_format, language, options = {}, userId }) {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const session = {
    id: sessionId,
    userId,
    description,
    output_format,
    language,
    options,
    status: 'pending',
    progress: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    logs: [],
    result: null,
    error: null
  };

  sessions.set(sessionId, session);

  // Start agent creation process
  runAgentBuilder(sessionId);

  return sessionId;
}

/**
 * Get agent session status
 */
function getSession(sessionId) {
  return sessions.get(sessionId);
}

/**
 * List all sessions for a user
 */
function listSessions(userId) {
  return Array.from(sessions.values())
    .filter(s => s.userId === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * Run the agent-builder CLI
 */
function runAgentBuilder(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.status = 'in_progress';
  session.updated_at = new Date().toISOString();

  const args = [
    'dist/index.js',
    'create',
    session.description,
    '--output', session.output_format,
    '--language', session.language,
    '--interactive', 'false'
  ];

  console.log(`Starting agent builder for session ${sessionId}`);
  console.log(`Command: node ${args.join(' ')}`);

  const agentProcess = spawn('node', args, {
    cwd: __dirname,
    env: {
      ...process.env,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
    }
  });

  // Capture stdout
  agentProcess.stdout.on('data', (data) => {
    const output = data.toString();
    session.logs.push({
      type: 'stdout',
      message: output,
      timestamp: new Date().toISOString()
    });

    // Parse progress from output (simple heuristic)
    if (output.includes('Clarification')) session.progress = 10;
    else if (output.includes('Design')) session.progress = 30;
    else if (output.includes('Implementation')) session.progress = 60;
    else if (output.includes('Packaging')) session.progress = 85;
    else if (output.includes('Complete')) session.progress = 100;

    session.updated_at = new Date().toISOString();

    console.log(`[${sessionId}] ${output.trim()}`);
  });

  // Capture stderr
  agentProcess.stderr.on('data', (data) => {
    const output = data.toString();
    session.logs.push({
      type: 'stderr',
      message: output,
      timestamp: new Date().toISOString()
    });
    session.updated_at = new Date().toISOString();

    console.error(`[${sessionId}] ERROR: ${output.trim()}`);
  });

  // Handle completion
  agentProcess.on('close', (code) => {
    if (code === 0) {
      session.status = 'completed';
      session.progress = 100;

      // Find the output directory
      const outputDir = path.join(__dirname, 'output');
      const sessionDirs = fs.readdirSync(outputDir)
        .filter(f => f.includes(sessionId.substring(0, 10)));

      if (sessionDirs.length > 0) {
        const outputPath = path.join(outputDir, sessionDirs[0]);
        const files = fs.readdirSync(outputPath);

        session.result = {
          output_path: outputPath,
          files: files,
          download_url: `/api/agents/${sessionId}/download`
        };
      }

      console.log(`[${sessionId}] Agent creation completed successfully`);
    } else {
      session.status = 'failed';
      session.error = `Process exited with code ${code}`;
      console.error(`[${sessionId}] Agent creation failed with code ${code}`);
    }

    session.updated_at = new Date().toISOString();
    session.completed_at = new Date().toISOString();
  });

  // Handle errors
  agentProcess.on('error', (error) => {
    session.status = 'failed';
    session.error = error.message;
    session.updated_at = new Date().toISOString();

    console.error(`[${sessionId}] Process error:`, error);
  });
}

module.exports = {
  createAgent,
  getSession,
  listSessions
};
