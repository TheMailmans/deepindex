/**
 * EmbedContext MCP Config Command
 * Outputs configuration for Claude Desktop MCP integration
 */

import chalk from 'chalk';
import { resolve } from 'path';
import { loadConfigResolved, findConfig, type ResolvedConfig } from './config/config-loader.js';

interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface MCPConfig {
  mcpServers: {
    [key: string]: MCPServerConfig;
  };
}

interface MCPConfigOptions {
  json?: boolean; // Output raw JSON
  name?: string; // Custom server name
}

/**
 * Generate MCP config for Claude Desktop
 */
export function generateMCPConfig(options: MCPConfigOptions = {}): MCPConfig {
  let config: ResolvedConfig;
  let configPath: string | null;

  try {
    config = loadConfigResolved();
    configPath = findConfig();
  } catch {
    // If no config, generate a template
    const npmBinPath = process.execPath.includes('node') ? 'npx' : 'npx';
    return {
      mcpServers: {
        'embedcontext': {
          command: npmBinPath,
          args: ['embedcontext-mcp'],
          env: {
            EMBEDCONTEXT_CONFIG: '/path/to/your/project/embedcontext.json',
          },
        },
      },
    };
  }

  const serverName = options.name || `embedcontext-${config.projectName.toLowerCase().replace(/\s+/g, '-')}`;

  // Get the path to the MCP server
  // When installed globally: embedcontext-mcp
  // When running locally: node dist/mcp-server.js
  const mcpConfig: MCPConfig = {
    mcpServers: {
      [serverName]: {
        command: 'npx',
        args: ['embedcontext-mcp'],
        env: configPath
          ? {
              EMBEDCONTEXT_CONFIG: resolve(configPath),
            }
          : undefined,
      },
    },
  };

  return mcpConfig;
}

/**
 * Print MCP config to console
 */
export function printMCPConfig(options: MCPConfigOptions = {}): void {
  const mcpConfig = generateMCPConfig(options);

  if (options.json) {
    console.log(JSON.stringify(mcpConfig, null, 2));
    return;
  }

  console.log(chalk.cyan.bold('\n📎 MCP Configuration for Claude Desktop\n'));

  console.log(chalk.gray('Add this to your Claude Desktop configuration file:\n'));
  console.log(chalk.gray('  macOS: ~/Library/Application Support/Claude/claude_desktop_config.json'));
  console.log(chalk.gray('  Windows: %APPDATA%\\Claude\\claude_desktop_config.json\n'));

  console.log(chalk.yellow('─'.repeat(60)));
  console.log(JSON.stringify(mcpConfig, null, 2));
  console.log(chalk.yellow('─'.repeat(60)));

  console.log(chalk.gray('\nIf you already have other MCP servers configured, merge the'));
  console.log(chalk.gray('"mcpServers" objects together.\n'));

  // Check if config was found
  const configPath = findConfig();
  if (!configPath) {
    console.log(chalk.yellow('⚠ No embedcontext.json found in current directory.'));
    console.log(chalk.gray('  Update EMBEDCONTEXT_CONFIG path after running `embedcontext init`\n'));
  }
}
