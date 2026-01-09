/**
 * EmbedContext Init Command
 * Initialize a project with embedcontext.json
 */

import chalk from 'chalk';
import { existsSync, writeFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { createInterface } from 'readline';

interface InitOptions {
  force?: boolean; // Overwrite existing config
  yes?: boolean; // Skip prompts, use defaults
}

interface InitResult {
  success: boolean;
  configPath: string;
  message: string;
}

type ProjectType = 'typescript' | 'rust' | 'python' | 'go' | 'java' | 'mixed';

interface DomainConfig {
  name: string;
  patterns: string[];
  description: string;
}

/**
 * Detect project type from files in directory
 */
function detectProjectType(dir: string): ProjectType {
  const files = readdirSync(dir);

  if (files.includes('Cargo.toml')) return 'rust';
  if (files.includes('package.json')) return 'typescript';
  if (files.includes('requirements.txt') || files.includes('pyproject.toml')) return 'python';
  if (files.includes('go.mod')) return 'go';
  if (files.includes('pom.xml') || files.includes('build.gradle')) return 'java';

  return 'mixed';
}

/**
 * Generate default domains based on project type
 */
function generateDefaultDomains(projectType: ProjectType): DomainConfig[] {
  switch (projectType) {
    case 'typescript':
      return [
        { name: 'src', patterns: ['src/**/*.ts', 'src/**/*.tsx'], description: 'Source code' },
        { name: 'tests', patterns: ['**/*.test.ts', '**/*.spec.ts'], description: 'Test files' },
        { name: 'docs', patterns: ['*.md', 'docs/**/*.md'], description: 'Documentation' },
      ];
    case 'rust':
      return [
        { name: 'src', patterns: ['src/**/*.rs'], description: 'Rust source code' },
        { name: 'tests', patterns: ['tests/**/*.rs'], description: 'Test files' },
        { name: 'docs', patterns: ['*.md', 'docs/**/*.md'], description: 'Documentation' },
      ];
    case 'python':
      return [
        { name: 'src', patterns: ['**/*.py'], description: 'Python source code' },
        { name: 'tests', patterns: ['tests/**/*.py', '**/test_*.py'], description: 'Test files' },
        { name: 'docs', patterns: ['*.md', 'docs/**/*.md'], description: 'Documentation' },
      ];
    case 'go':
      return [
        { name: 'src', patterns: ['**/*.go'], description: 'Go source code' },
        { name: 'tests', patterns: ['**/*_test.go'], description: 'Test files' },
        { name: 'docs', patterns: ['*.md', 'docs/**/*.md'], description: 'Documentation' },
      ];
    case 'java':
      return [
        { name: 'src', patterns: ['src/**/*.java'], description: 'Java source code' },
        { name: 'tests', patterns: ['**/test/**/*.java'], description: 'Test files' },
        { name: 'docs', patterns: ['*.md', 'docs/**/*.md'], description: 'Documentation' },
      ];
    default:
      return [
        { name: 'src', patterns: ['src/**/*'], description: 'Source code' },
        { name: 'docs', patterns: ['*.md', 'docs/**/*.md'], description: 'Documentation' },
      ];
  }
}

/**
 * Generate default tag keywords
 */
function getDefaultTagKeywords(): string[] {
  return [
    'async',
    'await',
    'function',
    'class',
    'interface',
    'type',
    'struct',
    'impl',
    'trait',
    'enum',
    'const',
    'let',
    'var',
    'def',
    'fn',
  ];
}

/**
 * Prompt user for input
 */
async function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const displayQuestion = defaultValue ? `${question} [${defaultValue}] ` : `${question} `;

  return new Promise((resolve) => {
    rl.question(displayQuestion, (answer) => {
      rl.close();
      resolve(answer || defaultValue || '');
    });
  });
}

/**
 * Initialize embedcontext.json in the current directory
 */
export async function init(options: InitOptions = {}): Promise<InitResult> {
  const cwd = process.cwd();
  const configPath = join(cwd, 'embedcontext.json');

  // Check if config already exists
  if (existsSync(configPath) && !options.force) {
    return {
      success: false,
      configPath,
      message: 'embedcontext.json already exists. Use --force to overwrite.',
    };
  }

  // Detect project type
  const projectType = detectProjectType(cwd);
  const projectName = basename(cwd);
  const domains = generateDefaultDomains(projectType);

  // If not using defaults, prompt for project name
  let finalProjectName = projectName;
  if (!options.yes) {
    console.log(chalk.cyan.bold('\n🚀 EmbedContext Initialization\n'));
    console.log(chalk.gray(`Detected project type: ${projectType}\n`));

    finalProjectName = await prompt('Project name:', projectName);
  }

  // Generate config
  const config = {
    schemaVersion: 1,
    projectName: finalProjectName,
    projectType,
    rootDir: '.',
    indexDir: '.embedcontext',
    domains,
    embeddingsModel: 'nomic-embed-text',
    chunkSize: 512,
    tagKeywords: getDefaultTagKeywords(),
  };

  // Write config
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

    return {
      success: true,
      configPath,
      message: `Created ${configPath}`,
    };
  } catch (error) {
    return {
      success: false,
      configPath,
      message: `Failed to write config: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Print init result to console
 */
export function printInitResult(result: InitResult): void {
  if (result.success) {
    console.log(chalk.green(`\n✓ ${result.message}\n`));
    console.log(chalk.gray('Next steps:'));
    console.log(chalk.gray('  1. Review and customize embedcontext.json'));
    console.log(chalk.gray('  2. Run `embedcontext doctor` to verify setup'));
    console.log(chalk.gray('  3. Run `embedcontext index` to build embeddings'));
    console.log(chalk.gray('  4. Run `embedcontext mcp-config` to get Claude Desktop config\n'));
  } else {
    console.log(chalk.red(`\n✗ ${result.message}\n`));
  }
}
