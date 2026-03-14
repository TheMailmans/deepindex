#!/usr/bin/env node

/**
 * DEEPINDEX CLI
 * Command-line interface for semantic code search
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { Indexer } from './indexer.js';
import { MetadataStore } from './metadata-store.js';
import { OllamaEmbedding } from './ollama-embedding.js';
import { FaissStore } from './faiss-store.js';
import { loadConfigResolved, findConfig, ResolvedConfig } from './config/config-loader.js';
import { writeManifest, validateManifest, getIndexStatus, type ManifestStats } from './manifest.js';
import { type SearchTier } from './search-tier.js';
import { doctor, printDiagnostics, runDiagnostics } from './doctor.js';
import { clean, printCleanResult } from './clean.js';
import { printMCPConfig } from './mcp-config.js';
import { init, printInitResult } from './init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('deepindex')
  .description('deepindex - local-first semantic code search')
  .version('0.1.0');

// Helper to load config or exit with message
function requireConfig(): {
  config: ResolvedConfig;
  projectPath: string;
  dataPath: string;
  domains: Record<string, string[]>;
  projectName: string;
} {
  try {
    const config = loadConfigResolved();
    return {
      config,
      projectPath: config.rootDirAbs,
      dataPath: path.join(config.indexDirAbs, 'data'),
      domains: config.domains.reduce((acc, d) => {
        acc[d.name] = d.patterns;
        return acc;
      }, {} as Record<string, string[]>),
      projectName: config.projectName,
    };
  } catch (error) {
    console.error(chalk.red('✗ Failed to load configuration'));
    console.error(chalk.gray('  Make sure DEEPINDEX.json exists or set DEEPINDEX_CONFIG env variable'));
    console.error(chalk.gray('  Run `DEEPINDEX init` to create a new configuration'));
    if (error instanceof Error) {
      console.error(chalk.gray(`  ${error.message}`));
    }
    process.exit(1);
  }
}

// INIT command - can run without config
program
  .command('init')
  .description('Initialize DEEPINDEX.json in the current directory')
  .option('-f, --force', 'Overwrite existing configuration')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (options: { force?: boolean; yes?: boolean }) => {
    const result = await init({ force: options.force, yes: options.yes });
    printInitResult(result);
    process.exit(result.success ? 0 : 1);
  });

// DOCTOR command - can run without config
program
  .command('doctor')
  .description('Check environment and configuration health')
  .action(async () => {
    const success = await doctor();
    process.exit(success ? 0 : 1);
  });

// MCP-CONFIG command - can run without config
program
  .command('mcp-config')
  .description('Output MCP configuration for Claude Desktop')
  .option('--json', 'Output raw JSON only')
  .option('--name <name>', 'Custom server name')
  .action((options: { json?: boolean; name?: string }) => {
    printMCPConfig({ json: options.json, name: options.name });
  });

// CLEAN command - requires config
program
  .command('clean')
  .description('Remove the embeddings index')
  .option('-y, --yes', 'Skip confirmation prompt')
  .option('--dry-run', 'Show what would be deleted without deleting')
  .action(async (options: { yes?: boolean; dryRun?: boolean }) => {
    const result = await clean({ yes: options.yes, dryRun: options.dryRun });
    printCleanResult(result);
    process.exit(result.success ? 0 : 1);
  });

// INDEX command - requires config
program
  .command('index')
  .description('Index the codebase for semantic search')
  .action(async () => {
    const { config, projectPath, dataPath, domains, projectName } = requireConfig();

    console.log(chalk.cyan.bold(`\n🚀 DEEPINDEX Indexer - ${projectName}\n`));

    try {
      // Ensure data directory exists
      if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
      }

      const indexer = new Indexer({
        projectPath,
        dataPath,
        domains,
      });

      await indexer.initialize();

      const startTime = Date.now();

      await indexer.indexProject(() => {
        // Progress updates are already logged by the indexer
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log(chalk.green.bold(`\n✓ Indexing completed in ${duration}s\n`));

      const stats = indexer.getStats();
      console.log(chalk.cyan('Index Statistics:'));
      console.log(`  Total chunks: ${chalk.bold(stats.totalChunks)}`);
      console.log(`  TODOs found: ${chalk.bold(stats.totalTodos)}`);
      console.log(`  Debug logs: ${chalk.bold(stats.totalDebugLogs)}`);
      console.log('\n  By domain:');
      for (const [domain, count] of Object.entries(stats.byDomain)) {
        console.log(`    ${domain}: ${count}`);
      }

      // Write manifest for stale detection
      const manifestStats: ManifestStats = {
        fileCount: Object.keys(stats.byDomain).reduce((sum, d) => sum + (stats.byDomain[d] || 0), 0),
        chunkCount: stats.totalChunks,
        embeddingDimension: 768,
      };
      const searchTier: SearchTier = 'hybrid'; // TODO: detect actual tier
      const manifest = writeManifest(config, manifestStats, searchTier);
      console.log(chalk.gray(`\n  Manifest written: ${manifest.indexedAt}`));

      indexer.close();
    } catch (error) {
      console.error(chalk.red.bold('\n✗ Indexing failed:'), error);
      process.exit(1);
    }
  });

// SEARCH command - requires config
program
  .command('search <query>')
  .description('Search the codebase semantically')
  .option('-n, --max-results <number>', 'Maximum number of results', '5')
  .option('-d, --domain <domain>', 'Filter by domain')
  .action(async (query: string, options: { maxResults: string; domain?: string }) => {
    const { config, dataPath } = requireConfig();

    console.log(chalk.cyan.bold('\n🔍 Semantic Search\n'));

    // Check manifest for stale index
    const manifestResult = validateManifest(config);
    if (!manifestResult.valid) {
      if (manifestResult.reason === 'stale') {
        console.log(chalk.yellow('⚠ Index may be stale: config changed since last index'));
        console.log(chalk.gray('  Run `DEEPINDEX index` to update\n'));
      } else if (manifestResult.reason === 'missing') {
        console.error(chalk.red('✗ Index not found. Please run: DEEPINDEX index'));
        process.exit(1);
      }
    }

    console.log(chalk.gray(`Query: "${query}"\n`));

    try {
      const metadataStore = new MetadataStore(path.join(dataPath, 'metadata.db'));
      const embedding = new OllamaEmbedding();
      const faissStore = new FaissStore(768, path.join(dataPath, 'embeddings.faiss'));

      // Check if index exists
      if (!faissStore.exists()) {
        console.error(chalk.red('✗ Index not found. Please run: DEEPINDEX index'));
        process.exit(1);
      }

      await faissStore.load();

      // Generate query embedding
      console.log(chalk.gray('Generating query embedding...'));
      const queryEmbedding = await embedding.embed(query);

      // Search FAISS
      const maxResults = parseInt(options.maxResults, 10);
      const searchResults = await faissStore.search(queryEmbedding, maxResults);

      console.log(chalk.green(`✓ Found ${searchResults.ids.length} results\n`));

      // Get metadata for each result
      for (let i = 0; i < searchResults.ids.length; i++) {
        const vectorId = searchResults.ids[i];
        const distance = searchResults.distances[i];
        const similarity = (1 / (1 + distance)).toFixed(3); // Convert distance to similarity score

        const metadata = metadataStore.getChunkByVectorId(vectorId);

        if (metadata) {
          // Filter by domain if specified
          if (options.domain && metadata.domain !== options.domain) {
            continue;
          }

          console.log(chalk.cyan.bold(`${i + 1}. ${metadata.filePath}`) + chalk.gray(` (similarity: ${similarity})`));
          console.log(chalk.gray(`   Lines ${metadata.startLine}-${metadata.endLine}`));

          if (metadata.symbolName) {
            console.log(chalk.yellow(`   ${metadata.symbolType}: ${metadata.symbolName}`));
          }

          if (metadata.tags.length > 0) {
            console.log(chalk.gray(`   Tags: ${metadata.tags.join(', ')}`));
          }

          // Show snippet (first 3 lines)
          const lines = metadata.chunkText.split('\n').slice(0, 3);
          console.log(chalk.gray('   ' + lines.join('\n   ')));
          console.log();
        }
      }

      metadataStore.close();
    } catch (error) {
      console.error(chalk.red.bold('\n✗ Search failed:'), error);
      process.exit(1);
    }
  });

// STATS command - requires config
program
  .command('stats')
  .description('Show index statistics')
  .action(async () => {
    const { config, dataPath } = requireConfig();

    console.log(chalk.cyan.bold('\n📊 Index Statistics\n'));

    // Show index status from manifest
    const indexStatus = getIndexStatus(config);
    console.log(
      chalk.cyan('Index Status:'),
      indexStatus.includes('missing') || indexStatus.includes('stale') ? chalk.yellow(indexStatus) : chalk.green(indexStatus)
    );

    // Check manifest for stale index
    const manifestResult = validateManifest(config);
    if (!manifestResult.valid) {
      if (manifestResult.reason === 'stale') {
        console.log(chalk.yellow('\n⚠ Config changed since last index. Run `DEEPINDEX index` to update.\n'));
      } else if (manifestResult.reason === 'missing') {
        console.error(chalk.red('\n✗ Index not found. Please run: DEEPINDEX index'));
        process.exit(1);
      }
    }

    try {
      const metadataStore = new MetadataStore(path.join(dataPath, 'metadata.db'));
      const faissStore = new FaissStore(768, path.join(dataPath, 'embeddings.faiss'));

      // Check if index exists
      if (!faissStore.exists()) {
        console.error(chalk.red('✗ Index not found. Please run: DEEPINDEX index'));
        process.exit(1);
      }

      await faissStore.load();

      const stats = metadataStore.getStats();

      console.log(chalk.cyan('Total Chunks:'), chalk.bold(stats.totalChunks));
      console.log(chalk.cyan('Vector Dimension:'), chalk.bold('768'));
      console.log(chalk.cyan('TODOs:'), chalk.bold(stats.totalTodos));
      console.log(chalk.cyan('Debug Logs:'), chalk.bold(stats.totalDebugLogs));

      console.log(chalk.cyan.bold('\nBy Domain:'));
      for (const [domain, count] of Object.entries(stats.byDomain).sort((a, b) => b[1] - a[1])) {
        const percentage = ((count / stats.totalChunks) * 100).toFixed(1);
        console.log(`  ${domain.padEnd(20)} ${chalk.bold(count.toString().padStart(5))} (${percentage}%)`);
      }

      console.log(chalk.cyan.bold('\nBy File Type:'));
      for (const [fileType, count] of Object.entries(stats.byFileType).sort((a, b) => b[1] - a[1])) {
        const percentage = ((count / stats.totalChunks) * 100).toFixed(1);
        console.log(`  ${fileType.padEnd(20)} ${chalk.bold(count.toString().padStart(5))} (${percentage}%)`);
      }

      console.log();

      metadataStore.close();
    } catch (error) {
      console.error(chalk.red.bold('\n✗ Failed to get stats:'), error);
      process.exit(1);
    }
  });

// MCP command (alias for running mcp-server)
program
  .command('mcp')
  .description('Run the MCP server')
  .action(async () => {
    // Import and run the MCP server
    const mcpServerPath = path.join(__dirname, 'mcp-server.js');
    const { spawn } = await import('child_process');
    const child = spawn('node', [mcpServerPath], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('exit', (code) => process.exit(code || 0));
  });

program.parse();
