/**
 * EmbedContext Doctor Command
 * Environment health check and diagnostics
 */

import chalk from 'chalk';
import { existsSync } from 'fs';
import { join } from 'path';
import { OllamaEmbedding } from './ollama-embedding.js';
import { loadConfigResolved, findConfig, type ResolvedConfig } from './config/config-loader.js';
import { getIndexStatus, validateManifest } from './manifest.js';
import { detectSearchTier, getTierDescription } from './search-tier.js';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  detail?: string;
}

/**
 * Run all health checks and return results
 */
export async function runDiagnostics(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // 1. Check Node.js version
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  results.push({
    name: 'Node.js',
    status: nodeMajor >= 18 ? 'pass' : 'fail',
    message: nodeVersion,
    detail: nodeMajor < 18 ? 'Requires Node.js 18 or higher' : undefined,
  });

  // 2. Check config file exists
  const configPath = findConfig();
  if (configPath) {
    results.push({
      name: 'Config file',
      status: 'pass',
      message: configPath,
    });
  } else {
    results.push({
      name: 'Config file',
      status: 'fail',
      message: 'Not found',
      detail: 'Run `embedcontext init` to create embedcontext.json',
    });
  }

  // 3. Check Ollama connectivity
  const embedding = new OllamaEmbedding();
  const ollamaHealthy = await embedding.isHealthy();
  results.push({
    name: 'Ollama server',
    status: ollamaHealthy ? 'pass' : 'fail',
    message: ollamaHealthy ? 'Connected (http://localhost:11434)' : 'Not reachable',
    detail: ollamaHealthy ? undefined : 'Start Ollama with: ollama serve',
  });

  // 4. Check nomic-embed-text model
  if (ollamaHealthy) {
    const hasModel = await embedding.verifyModel();
    results.push({
      name: 'Embedding model',
      status: hasModel ? 'pass' : 'fail',
      message: hasModel ? 'nomic-embed-text' : 'Not found',
      detail: hasModel ? undefined : 'Install with: ollama pull nomic-embed-text',
    });
  } else {
    results.push({
      name: 'Embedding model',
      status: 'warn',
      message: 'Skipped (Ollama not available)',
    });
  }

  // 5. Detect search tier
  const tierInfo = await detectSearchTier();
  results.push({
    name: 'Search tier',
    status: tierInfo.tier === 'hybrid' ? 'pass' : tierInfo.tier === 'rerank' ? 'warn' : 'warn',
    message: getTierDescription(tierInfo.tier),
    detail: tierInfo.tier !== 'hybrid' ? tierInfo.description : undefined,
  });

  // 6. Check index status (only if config exists)
  if (configPath) {
    try {
      const config = loadConfigResolved();
      const indexStatus = getIndexStatus(config);
      const manifestResult = validateManifest(config);

      let status: 'pass' | 'fail' | 'warn' = 'pass';
      if (!manifestResult.valid) {
        status = manifestResult.reason === 'stale' ? 'warn' : 'fail';
      }

      results.push({
        name: 'Index status',
        status,
        message: indexStatus,
        detail: !manifestResult.valid ? manifestResult.message : undefined,
      });

      // 7. Check data directory
      const dataPath = join(config.indexDirAbs, 'data');
      const hasData = existsSync(dataPath);
      results.push({
        name: 'Data directory',
        status: hasData ? 'pass' : 'warn',
        message: hasData ? dataPath : 'Not created',
        detail: hasData ? undefined : 'Will be created on first index',
      });
    } catch (error) {
      results.push({
        name: 'Index status',
        status: 'fail',
        message: 'Error loading config',
        detail: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Print diagnostics to console with colors
 */
export function printDiagnostics(results: CheckResult[]): void {
  console.log(chalk.cyan.bold('\n🩺 EmbedContext Doctor\n'));

  const maxNameLen = Math.max(...results.map((r) => r.name.length));

  for (const result of results) {
    const icon = result.status === 'pass' ? chalk.green('✓') : result.status === 'warn' ? chalk.yellow('⚠') : chalk.red('✗');
    const name = result.name.padEnd(maxNameLen);
    const message =
      result.status === 'pass'
        ? chalk.green(result.message)
        : result.status === 'warn'
          ? chalk.yellow(result.message)
          : chalk.red(result.message);

    console.log(`  ${icon} ${chalk.bold(name)}  ${message}`);

    if (result.detail) {
      console.log(chalk.gray(`    └─ ${result.detail}`));
    }
  }

  const passCount = results.filter((r) => r.status === 'pass').length;
  const warnCount = results.filter((r) => r.status === 'warn').length;
  const failCount = results.filter((r) => r.status === 'fail').length;

  console.log();
  if (failCount > 0) {
    console.log(chalk.red(`${failCount} issue(s) need attention`));
  } else if (warnCount > 0) {
    console.log(chalk.yellow(`All checks passed with ${warnCount} warning(s)`));
  } else {
    console.log(chalk.green('All checks passed!'));
  }
  console.log();
}

/**
 * Run doctor command
 */
export async function doctor(): Promise<boolean> {
  const results = await runDiagnostics();
  printDiagnostics(results);
  return results.every((r) => r.status !== 'fail');
}
