#!/usr/bin/env node
import 'dotenv/config';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { CLIController } from './cli/cli-controller';
import { createLogger } from './utils/logger';

const logger = createLogger('CLI');

async function main() {
  const controller = new CLIController();

  await yargs(hideBin(process.argv))
    .command(
      'create [description]',
      'Create a new agent',
      (yargs) => {
        return yargs
          .positional('description', {
            type: 'string',
            describe: 'Brief description of the agent to build',
          })
          .option('output', {
            alias: 'o',
            type: 'string',
            choices: ['skill', 'mcp', 'cli', 'library'],
            describe: 'Output format',
          })
          .option('language', {
            alias: 'l',
            type: 'string',
            choices: ['typescript', 'python'],
            describe: 'Programming language',
          })
          .option('config', {
            alias: 'c',
            type: 'string',
            describe: 'Path to configuration file',
          })
          .option('interactive', {
            alias: 'i',
            type: 'boolean',
            default: true,
            describe: 'Run in interactive mode',
          })
          .option('existing-agents-dir', {
            alias: 'e',
            type: 'string',
            describe: 'Path to directory with existing agent files to learn from',
          });
      },
      async (argv) => {
        await controller.createCommand(argv);
      }
    )
    .command(
      'list',
      'List all sessions',
      {},
      async () => {
        await controller.listCommand();
      }
    )
    .command(
      'show <sessionId>',
      'Show session details',
      (yargs) => {
        return yargs.positional('sessionId', {
          type: 'string',
          describe: 'Session ID to display',
          demandOption: true,
        });
      },
      async (argv) => {
        await controller.showCommand(argv.sessionId as string);
      }
    )
    .help()
    .alias('help', 'h')
    .version('0.1.0')
    .alias('version', 'v')
    .demandCommand(1, 'You must specify a command')
    .strict()
    .argv;
}

main().catch((error) => {
  logger.error('Fatal error', error);
  console.error('Error:', error.message);
  process.exit(1);
});
