import inquirer from 'inquirer';
import chalk from 'chalk';
import { createLogger } from '../utils/logger';

const logger = createLogger('InteractiveMode');

/**
 * Interactive Mode - Handles interactive prompts and user input
 */
export class InteractiveMode {
  /**
   * Ask user for agent request
   */
  async askUserRequest(): Promise<string> {
    console.log(chalk.gray('What agent would you like to build?\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'request',
        message: 'Describe the agent:',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Please provide a description';
          }
          return true;
        },
      },
    ]);

    logger.info('User request received');
    return answers.request;
  }

  /**
   * Ask clarification questions
   */
  async askQuestions(questions: any[]): Promise<Record<string, string>> {
    const answers: Record<string, string> = {};

    for (const question of questions) {
      const response = await inquirer.prompt([
        {
          type: question.options ? 'list' : 'input',
          name: question.id,
          message: question.text,
          choices: question.options,
          validate: (input: string) => {
            if (question.required && (!input || input.trim().length === 0)) {
              return 'This field is required';
            }
            return true;
          },
        },
      ]);

      answers[question.id] = response[question.id];
    }

    return answers;
  }

  /**
   * Confirm action
   */
  async confirmAction(message: string): Promise<boolean> {
    const response = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message,
        default: false,
      },
    ]);

    return response.confirm;
  }

  /**
   * Select from options
   */
  async selectOption(message: string, choices: string[]): Promise<string> {
    const response = await inquirer.prompt([
      {
        type: 'list',
        name: 'selection',
        message,
        choices,
      },
    ]);

    return response.selection;
  }

  /**
   * Display progress
   */
  displayProgress(message: string): void {
    console.log(chalk.blue(`⏳ ${message}...`));
  }

  /**
   * Display success
   */
  displaySuccess(message: string): void {
    console.log(chalk.green(`✓ ${message}`));
  }

  /**
   * Display error
   */
  displayError(message: string): void {
    console.log(chalk.red(`✗ ${message}`));
  }
}
