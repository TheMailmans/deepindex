/**
 * Configuration Loader for DEEPINDEX
 * Loads and validates project-specific configuration
 *
 * INVARIANT:
 * - rootDirAbs and indexDirAbs are absolute
 * - indexDirAbs is resolved once and reused everywhere
 * - No code should call path.resolve(rootDir, config.indexDir) directly
 */

import { readFileSync, existsSync, realpathSync } from 'fs';
import { join, dirname, resolve, isAbsolute } from 'path';

export interface DomainConfig {
  name: string;
  patterns: string[];
  description: string;
}

export interface DEEPINDEXConfig {
  schemaVersion?: number;
  projectName: string;
  projectType: string; // 'rust', 'typescript', 'python', 'go', 'java', 'mixed'
  rootDir: string;
  indexDir?: string;
  domains: DomainConfig[];
  embeddingsModel?: string;
  chunkSize?: number;
  tagKeywords?: string[];
}

/**
 * Resolved configuration with absolute paths.
 * This is the ONLY interface that should be used by CLI, index, search, clean, doctor, MCP.
 */
export interface ResolvedConfig {
  schemaVersion: number;
  projectName: string;
  projectType: string;
  rootDirAbs: string;       // Always absolute
  indexDirAbs: string;      // Always absolute
  domains: DomainConfig[];
  embeddingsModel: string;
  chunkSize: number;
  tagKeywords: string[];
  configPath: string;       // Path to the config file
}

const CONFIG_FILENAME = 'DEEPINDEX.json';
const ENV_VAR_NAME = 'DEEPINDEX_CONFIG';
const DEFAULT_INDEX_DIR = '.DEEPINDEX';
const DEFAULT_SCHEMA_VERSION = 1;
const DEFAULT_EMBEDDINGS_MODEL = 'nomic-embed-text';
const DEFAULT_CHUNK_SIZE = 512;

/**
 * Walk up directories to find DEEPINDEX.json
 * Returns the path to the config file or null if not found.
 */
export function findConfig(startDir: string = process.cwd()): string | null {
  let dir = startDir;
  while (dir !== dirname(dir)) {
    const configPath = join(dir, CONFIG_FILENAME);
    if (existsSync(configPath)) return configPath;
    dir = dirname(dir);
  }
  return null;
}

/**
 * Resolve indexDir to absolute path
 * @internal
 */
function resolveIndexDir(rootDirAbs: string, indexDir: string | undefined): string {
  const raw = indexDir || DEFAULT_INDEX_DIR;
  // path.resolve returns absPath unchanged if it's already absolute
  return resolve(rootDirAbs, raw);
}

/**
 * Load raw config from file (internal only)
 * @internal
 */
function loadConfig(configPath: string): DEEPINDEXConfig {
  const configContent = readFileSync(configPath, 'utf-8');
  return JSON.parse(configContent);
}

/**
 * Load and resolve configuration.
 *
 * Priority order:
 * 1. explicitPath parameter (highest)
 * 2. DEEPINDEX_CONFIG env var
 * 3. Walk up directories to find DEEPINDEX.json
 *
 * This is the ONLY export that should be used by CLI, index, search, clean, doctor, MCP.
 */
export function loadConfigResolved(explicitPath?: string): ResolvedConfig {
  const configPath = explicitPath
    || process.env[ENV_VAR_NAME]
    || findConfig();

  if (!configPath) {
    throw new Error(`No ${CONFIG_FILENAME} found. Run: DEEPINDEX init`);
  }

  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const config = loadConfig(configPath);
  const configDir = dirname(resolve(configPath));

  // CRITICAL: rootDir must be absolute at runtime
  const rootDirAbs = isAbsolute(config.rootDir)
    ? config.rootDir
    : resolve(configDir, config.rootDir || '.');

  // Resolve indexDir relative to rootDir
  const indexDirAbs = resolveIndexDir(rootDirAbs, config.indexDir);

  return {
    schemaVersion: config.schemaVersion || DEFAULT_SCHEMA_VERSION,
    projectName: config.projectName,
    projectType: config.projectType,
    rootDirAbs,
    indexDirAbs,
    domains: config.domains,
    embeddingsModel: config.embeddingsModel || DEFAULT_EMBEDDINGS_MODEL,
    chunkSize: config.chunkSize || DEFAULT_CHUNK_SIZE,
    tagKeywords: config.tagKeywords || [
      'async', 'await', 'function', 'class', 'interface', 'type',
      'api', 'endpoint', 'route', 'handler', 'middleware',
      'database', 'query', 'model', 'schema',
      'test', 'mock', 'fixture', 'error', 'validation'
    ],
    configPath: resolve(configPath),
  };
}

/**
 * @deprecated Use loadConfigResolved() instead.
 * This class is kept for backwards compatibility during migration.
 */
export class ConfigLoader {
  private static instance: ConfigLoader | null = null;
  private resolvedConfig: ResolvedConfig | null = null;

  private constructor() {}

  static getInstance(configPath?: string): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    if (configPath || !ConfigLoader.instance.resolvedConfig) {
      ConfigLoader.instance.load(configPath);
    }
    return ConfigLoader.instance;
  }

  load(configPath?: string): void {
    this.resolvedConfig = loadConfigResolved(configPath);
  }

  getConfig(): ResolvedConfig {
    if (!this.resolvedConfig) {
      throw new Error(`Configuration not loaded. Call load() first or set ${ENV_VAR_NAME} environment variable.`);
    }
    return this.resolvedConfig;
  }

  getDomains(): Record<string, string[]> {
    const domains: Record<string, string[]> = {};
    this.getConfig().domains.forEach(domain => {
      domains[domain.name] = domain.patterns;
    });
    return domains;
  }

  getTagKeywords(): string[] {
    return this.getConfig().tagKeywords;
  }

  getEmbeddingsModel(): string {
    return this.getConfig().embeddingsModel;
  }

  getChunkSize(): number {
    return this.getConfig().chunkSize;
  }

  getRootDir(): string {
    return this.getConfig().rootDirAbs;
  }

  getIndexDir(): string {
    return this.getConfig().indexDirAbs;
  }
}
