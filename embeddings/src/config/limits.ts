/**
 * Resource Limits Configuration
 *
 * Defines safe defaults for resource consumption to prevent
 * runaway processes and protect system resources.
 */

/**
 * File processing limits
 */
export const FILE_LIMITS = {
  /** Maximum file size to process (10 MB) */
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,

  /** Maximum number of files to index in one run */
  MAX_FILES_PER_INDEX: 10_000,

  /** Maximum line length before truncation (2000 chars) */
  MAX_LINE_LENGTH: 2000,

  /** Maximum file path length */
  MAX_PATH_LENGTH: 4096,
} as const;

/**
 * Chunk processing limits
 */
export const CHUNK_LIMITS = {
  /** Maximum chunks per file */
  MAX_CHUNKS_PER_FILE: 100,

  /** Maximum total chunks in index */
  MAX_TOTAL_CHUNKS: 100_000,

  /** Maximum chunk text length (for embeddings) */
  MAX_CHUNK_TEXT_LENGTH: 8000,

  /** Default chunk size in characters */
  DEFAULT_CHUNK_SIZE: 512,

  /** Minimum chunk size */
  MIN_CHUNK_SIZE: 100,

  /** Maximum chunk size */
  MAX_CHUNK_SIZE: 4000,
} as const;

/**
 * Search limits
 */
export const SEARCH_LIMITS = {
  /** Maximum search query length */
  MAX_QUERY_LENGTH: 1000,

  /** Maximum search results per query */
  MAX_RESULTS: 100,

  /** Default search results */
  DEFAULT_RESULTS: 10,

  /** Maximum domains to search */
  MAX_DOMAINS: 50,
} as const;

/**
 * MCP server limits
 */
export const MCP_LIMITS = {
  /** Maximum concurrent MCP requests */
  MAX_CONCURRENT_REQUESTS: 5,

  /** Request timeout in milliseconds (30 seconds) */
  REQUEST_TIMEOUT_MS: 30_000,

  /** Maximum requests per minute (rate limiting) */
  MAX_REQUESTS_PER_MINUTE: 60,

  /** Maximum response size in bytes (1 MB) */
  MAX_RESPONSE_SIZE_BYTES: 1024 * 1024,
} as const;

/**
 * Embedding limits
 */
export const EMBEDDING_LIMITS = {
  /** Maximum text length for single embedding */
  MAX_EMBED_TEXT_LENGTH: 8192,

  /** Embedding batch size */
  BATCH_SIZE: 10,

  /** Maximum retries for Ollama requests */
  MAX_RETRIES: 3,

  /** Retry delay in milliseconds */
  RETRY_DELAY_MS: 1000,

  /** Request timeout in milliseconds (60 seconds for embeddings) */
  REQUEST_TIMEOUT_MS: 60_000,
} as const;

/**
 * Memory limits
 */
export const MEMORY_LIMITS = {
  /** Maximum vectors to keep in memory before writing */
  MAX_VECTORS_IN_MEMORY: 10_000,

  /** Cache size for metadata queries */
  METADATA_CACHE_SIZE: 1000,
} as const;

/**
 * Configuration limits
 */
export const CONFIG_LIMITS = {
  /** Maximum number of domains */
  MAX_DOMAINS: 100,

  /** Maximum patterns per domain */
  MAX_PATTERNS_PER_DOMAIN: 50,

  /** Maximum tag keywords */
  MAX_TAG_KEYWORDS: 200,

  /** Maximum project name length */
  MAX_PROJECT_NAME_LENGTH: 128,
} as const;

/**
 * All limits combined for easy access
 */
export const LIMITS = {
  file: FILE_LIMITS,
  chunk: CHUNK_LIMITS,
  search: SEARCH_LIMITS,
  mcp: MCP_LIMITS,
  embedding: EMBEDDING_LIMITS,
  memory: MEMORY_LIMITS,
  config: CONFIG_LIMITS,
} as const;

/**
 * Get environment variable override for a limit
 */
export function getLimitOverride(name: string, defaultValue: number): number {
  const envVar = `DEEPINDEX_LIMIT_${name.toUpperCase()}`;
  const envValue = process.env[envVar];

  if (envValue !== undefined) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return defaultValue;
}
