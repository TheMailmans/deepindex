/**
 * EmbedContext Clean Command
 * Safe index reset with confirmation
 */

import chalk from 'chalk';
import { existsSync, rmSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';
import { loadConfigResolved, type ResolvedConfig } from './config/config-loader.js';

interface CleanOptions {
  yes?: boolean; // Skip confirmation
  dryRun?: boolean; // Show what would be deleted
}

interface CleanResult {
  success: boolean;
  filesDeleted: number;
  bytesFreed: number;
  message: string;
}

/**
 * Get directory size recursively
 */
function getDirectorySize(dirPath: string): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;

  if (!existsSync(dirPath)) {
    return { files: 0, bytes: 0 };
  }

  const entries = readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      const sub = getDirectorySize(fullPath);
      files += sub.files;
      bytes += sub.bytes;
    } else {
      files++;
      bytes += stat.size;
    }
  }

  return { files, bytes };
}

/**
 * Format bytes as human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Prompt user for confirmation
 */
async function confirm(message: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Clean the embeddings index
 */
export async function clean(options: CleanOptions = {}): Promise<CleanResult> {
  let config: ResolvedConfig;

  try {
    config = loadConfigResolved();
  } catch (error) {
    return {
      success: false,
      filesDeleted: 0,
      bytesFreed: 0,
      message: 'Config not found. Nothing to clean.',
    };
  }

  const dataPath = join(config.indexDirAbs, 'data');

  // Check if data directory exists
  if (!existsSync(dataPath)) {
    return {
      success: true,
      filesDeleted: 0,
      bytesFreed: 0,
      message: 'Index not found. Nothing to clean.',
    };
  }

  // Get size info
  const { files, bytes } = getDirectorySize(dataPath);

  if (files === 0) {
    return {
      success: true,
      filesDeleted: 0,
      bytesFreed: 0,
      message: 'Index directory is empty. Nothing to clean.',
    };
  }

  // Dry run mode
  if (options.dryRun) {
    return {
      success: true,
      filesDeleted: files,
      bytesFreed: bytes,
      message: `Would delete ${files} files (${formatBytes(bytes)}) from ${dataPath}`,
    };
  }

  // Confirm unless --yes flag
  if (!options.yes) {
    console.log(chalk.yellow(`\nThis will delete the embeddings index:`));
    console.log(chalk.gray(`  Path: ${dataPath}`));
    console.log(chalk.gray(`  Files: ${files}`));
    console.log(chalk.gray(`  Size: ${formatBytes(bytes)}\n`));

    const confirmed = await confirm(chalk.yellow('Are you sure?'));

    if (!confirmed) {
      return {
        success: false,
        filesDeleted: 0,
        bytesFreed: 0,
        message: 'Cancelled by user.',
      };
    }
  }

  // Delete the data directory
  try {
    rmSync(dataPath, { recursive: true, force: true });

    return {
      success: true,
      filesDeleted: files,
      bytesFreed: bytes,
      message: `Deleted ${files} files (${formatBytes(bytes)}).`,
    };
  } catch (error) {
    return {
      success: false,
      filesDeleted: 0,
      bytesFreed: 0,
      message: `Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Print clean result to console
 */
export function printCleanResult(result: CleanResult): void {
  if (result.success) {
    if (result.filesDeleted > 0) {
      console.log(chalk.green(`\n✓ ${result.message}\n`));
      console.log(chalk.gray('Run `embedcontext index` to rebuild the index.\n'));
    } else {
      console.log(chalk.gray(`\n${result.message}\n`));
    }
  } else {
    console.log(chalk.red(`\n✗ ${result.message}\n`));
  }
}
