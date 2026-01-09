/**
 * EmbedContext - Main Export
 * Universal semantic code search using Ollama embeddings
 */

export { OllamaEmbedding, type EmbeddingConfig } from './ollama-embedding.js';
export { MetadataStore, type ChunkMetadata } from './metadata-store.js';
export { FaissStore } from './faiss-store.js';
export { BaseChunker, type CodeChunk } from './chunkers/base-chunker.js';
export { RustChunker } from './chunkers/rust-chunker.js';
export { TypeScriptChunker } from './chunkers/typescript-chunker.js';
export { MarkdownChunker } from './chunkers/markdown-chunker.js';
export { Indexer, type IndexerConfig, type IndexingProgress } from './indexer.js';
export { QueryEngine, type SearchOptions, type SearchResult, type QueryEngineConfig } from './query-engine.js';
export { ConfigLoader, loadConfigResolved, type EmbedContextConfig, type ResolvedConfig, type DomainConfig } from './config/config-loader.js';
export {
  validateManifest,
  writeManifest,
  readManifest,
  getIndexStatus,
  generateConfigHash,
  getManifestPath,
  type ManifestData,
  type ManifestStats,
  type ManifestValidationResult,
} from './manifest.js';

// CLI utilities
export { doctor, runDiagnostics } from './doctor.js';
export { clean } from './clean.js';
export { init } from './init.js';
export { generateMCPConfig } from './mcp-config.js';

// Search tier detection
export {
  detectSearchTier,
  checkFaissAvailable,
  checkOllamaAvailable,
  getTierDescription,
  tierSupportsSemantic,
  tierSupportsVectorSearch,
  type TierCapabilities,
} from './search-tier.js';
export type { SearchTier } from './search-tier.js';
