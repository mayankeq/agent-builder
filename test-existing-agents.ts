#!/usr/bin/env ts-node
/**
 * Test script for existing agent reader functionality
 */

import { readExistingAgents, formatExistingAgentPattern, analyzeExistingAgentPattern } from './src/utils/existing-agent-reader';

async function main() {
  const testDir = './test-agents';

  console.log('Testing Existing Agent Reader\n');
  console.log('================================\n');

  try {
    console.log(`Reading agents from: ${testDir}\n`);

    // Read existing agents
    const pattern = await readExistingAgents(testDir);

    console.log('✓ Successfully read agents\n');
    console.log(`Found files:`);
    console.log(`  - Agent files: ${pattern.agentFiles.size}`);
    console.log(`  - Index file: ${pattern.agentsIndex ? 'yes' : 'no'}`);
    console.log(`  - CLAUDE.md: ${pattern.claudeMd ? 'yes' : 'no'}`);
    console.log(`  - .cursorrules: ${pattern.cursorRules ? 'yes' : 'no'}`);
    console.log('');

    // List agent files
    console.log('Agent files:');
    pattern.agentFiles.forEach((content, filename) => {
      const lines = content.split('\n').length;
      const chars = content.length;
      console.log(`  - ${filename} (${lines} lines, ${chars} chars)`);
    });
    console.log('');

    // Analyze pattern
    console.log('Analyzing patterns...\n');
    const analysis = analyzeExistingAgentPattern(pattern);

    console.log('Pattern Analysis:');
    console.log(`  Common sections: ${analysis.commonSections.join(', ')}`);
    console.log(`  Structure patterns:`);
    analysis.structurePatterns.forEach(p => console.log(`    - ${p}`));
    console.log(`  Style notes:`);
    analysis.styleNotes.forEach(n => console.log(`    - ${n}`));
    console.log('');

    // Format for Claude
    console.log('Formatted pattern (first 500 chars):');
    console.log('---');
    const formatted = formatExistingAgentPattern(pattern);
    console.log(formatted.substring(0, 500) + '...');
    console.log('---\n');

    console.log('✓ All tests passed!');

  } catch (error) {
    console.error('✗ Test failed:', (error as Error).message);
    process.exit(1);
  }
}

main();
