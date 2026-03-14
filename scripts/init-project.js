#!/usr/bin/env node
/**
 * DEEPINDEX cross-platform init script
 * Works on Windows, macOS, and Linux
 * Usage: node scripts/init-project.js
 */

import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import { readFileSync } from 'fs';

const cwd = process.cwd();
const projectName = basename(cwd);

// Detect project type
function detectProjectType() {
  if (existsSync(join(cwd, 'Cargo.toml'))) return 'rust';
  if (existsSync(join(cwd, 'package.json'))) return 'typescript';
  if (existsSync(join(cwd, 'pyproject.toml')) || existsSync(join(cwd, 'requirements.txt'))) return 'python';
  if (existsSync(join(cwd, 'go.mod'))) return 'go';
  if (existsSync(join(cwd, 'pom.xml')) || existsSync(join(cwd, 'build.gradle'))) return 'java';
  return 'mixed';
}

function getDomains(type) {
  const docs = { name: 'docs', patterns: ['*.md', 'docs/**/*.md'], description: 'Documentation' };
  switch (type) {
    case 'typescript': return [
      { name: 'src', patterns: ['src/**/*.ts', 'src/**/*.tsx'], description: 'Source code' },
      { name: 'tests', patterns: ['**/*.test.ts', '**/*.spec.ts'], description: 'Test files' },
      docs,
    ];
    case 'rust': return [
      { name: 'src', patterns: ['src/**/*.rs'], description: 'Rust source code' },
      { name: 'tests', patterns: ['tests/**/*.rs'], description: 'Test files' },
      docs,
    ];
    case 'python': return [
      { name: 'src', patterns: ['**/*.py'], description: 'Python source code' },
      { name: 'tests', patterns: ['tests/**/*.py', '**/test_*.py'], description: 'Test files' },
      docs,
    ];
    default: return [
      { name: 'src', patterns: ['src/**/*'], description: 'Source code' },
      docs,
    ];
  }
}

const projectType = detectProjectType();
const configPath = join(cwd, 'DEEPINDEX.json');

console.log('🚀 DEEPINDEX Initialization');
console.log('');
console.log(`Project: ${projectName}`);
console.log(`Type:    ${projectType}`);
console.log('');

if (existsSync(configPath)) {
  console.log('⚠ DEEPINDEX.json already exists. Delete it first or use `DEEPINDEX init --force`.');
  process.exit(1);
}

const config = {
  schemaVersion: 1,
  projectName,
  projectType,
  rootDir: '.',
  indexDir: '.DEEPINDEX',
  domains: getDomains(projectType),
  embeddingsModel: 'nomic-embed-text',
  chunkSize: 512,
  tagKeywords: ['async', 'await', 'function', 'class', 'interface', 'type', 'api', 'database', 'test', 'error'],
};

writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
console.log('✅ Created DEEPINDEX.json');

// Create .claude structure
const claudeInit = join(cwd, '.claude', 'INIT.md');
mkdirSync(join(cwd, '.claude', 'memory-bank', 'core'), { recursive: true });
mkdirSync(join(cwd, '.claude', 'memory-bank', 'knowledge'), { recursive: true });

const initContent = `# Claude Code Initialization Protocol

When starting a session in this project:

1. **Read Memory Bank** - Load context from \`.claude/memory-bank/\`
2. **Use DEEPINDEX** - Run semantic_search to explore unfamiliar code
3. **Review Recent Commits** - Check git history for latest changes

## Available MCP Tools
- \`semantic_search\` - Search code semantically
- \`find_related_code\` - Find related implementations
- \`explain_error\` - Search debug logs for solutions
- \`find_todos\` - List all TODO/FIXME markers
- \`trace_request_flow\` - Trace feature across layers
`;

writeFileSync(claudeInit, initContent);
console.log('✅ Created .claude/INIT.md');

console.log('');
console.log('Next steps:');
console.log('  1. Review DEEPINDEX.json and customize domains');
console.log('  2. DEEPINDEX doctor    → verify setup');
console.log('  3. DEEPINDEX index     → build embeddings');
console.log('  4. DEEPINDEX mcp-config → get Claude Desktop config');
