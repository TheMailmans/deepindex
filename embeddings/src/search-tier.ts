/**
 * Search Tier Detection and Management
 *
 * Implements three-tier fallback for search capabilities:
 * - Tier 1 (hybrid): FAISS + Ollama + FTS5 - Full semantic search
 * - Tier 2 (rerank): Ollama + FTS5 - Keyword search with semantic reranking
 * - Tier 3 (keyword): FTS5 only - Pure keyword search
 *
 * Gracefully degrades based on available dependencies.
 */

import { OllamaEmbedding } from './ollama-embedding.js';

export type SearchTier = 'hybrid' | 'rerank' | 'keyword';

export interface TierCapabilities {
  tier: SearchTier;
  hasFaiss: boolean;
  hasOllama: boolean;
  hasFts5: boolean; // Always true for SQLite
  description: string;
}

/**
 * Check if FAISS native module is available
 */
export async function checkFaissAvailable(): Promise<boolean> {
  try {
    // Dynamic import to avoid crash if native module not available
    const faissModule = await import('faiss-node');
    return typeof faissModule.default?.IndexFlatL2 === 'function';
  } catch {
    return false;
  }
}

/**
 * Check if Ollama is available and has the embedding model
 */
export async function checkOllamaAvailable(): Promise<boolean> {
  try {
    const embedding = new OllamaEmbedding();
    const isHealthy = await embedding.isHealthy();
    if (!isHealthy) return false;

    const hasModel = await embedding.verifyModel();
    return hasModel;
  } catch {
    return false;
  }
}

/**
 * Detect available search tier based on environment
 */
export async function detectSearchTier(): Promise<TierCapabilities> {
  const [hasFaiss, hasOllama] = await Promise.all([
    checkFaissAvailable(),
    checkOllamaAvailable(),
  ]);

  // FTS5 is always available (SQLite is a dev dependency)
  const hasFts5 = true;

  if (hasFaiss && hasOllama) {
    return {
      tier: 'hybrid',
      hasFaiss,
      hasOllama,
      hasFts5,
      description: 'Full hybrid search (FAISS + Ollama + FTS5)',
    };
  }

  if (hasOllama) {
    return {
      tier: 'rerank',
      hasFaiss,
      hasOllama,
      hasFts5,
      description: 'Rerank mode (Ollama + FTS5, no FAISS)',
    };
  }

  return {
    tier: 'keyword',
    hasFaiss,
    hasOllama,
    hasFts5,
    description: 'Keyword-only mode (FTS5)',
  };
}

/**
 * Get human-readable tier description
 */
export function getTierDescription(tier: SearchTier): string {
  switch (tier) {
    case 'hybrid':
      return 'hybrid (semantic + keyword)';
    case 'rerank':
      return 'rerank (keyword + semantic reranking)';
    case 'keyword':
      return 'keyword-only';
  }
}

/**
 * Check if a tier supports semantic features
 */
export function tierSupportsSemantic(tier: SearchTier): boolean {
  return tier === 'hybrid' || tier === 'rerank';
}

/**
 * Check if a tier supports fast vector search
 */
export function tierSupportsVectorSearch(tier: SearchTier): boolean {
  return tier === 'hybrid';
}
