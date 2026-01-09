/**
 * Query Engine
 *
 * Combines semantic vector search (FAISS) with keyword search (SQLite FTS5)
 * using Reciprocal Rank Fusion (RRF) for optimal result ranking.
 *
 * Supports three search tiers:
 * - Tier 1 (hybrid): FAISS + Ollama + FTS5 - Full semantic search
 * - Tier 2 (rerank): Ollama + FTS5 - Keyword search with semantic reranking
 * - Tier 3 (keyword): FTS5 only - Pure keyword search
 *
 * Architecture:
 * - Semantic search: Finds conceptually similar code via embeddings
 * - Keyword search: Finds exact term matches via full-text search
 * - RRF: Merges both result sets with position-based scoring
 */

import { FaissStore } from './faiss-store.js';
import { MetadataStore, ChunkMetadata } from './metadata-store.js';
import { OllamaEmbedding } from './ollama-embedding.js';
import { SearchTier, detectSearchTier, getTierDescription } from './search-tier.js';

export interface SearchOptions {
  maxResults?: number;
  domain?: string;
  fileType?: string;
  semanticWeight?: number; // 0.0 to 1.0, default 0.7
  keywordWeight?: number; // 0.0 to 1.0, default 0.3
}

export interface SearchResult {
  chunk: ChunkMetadata;
  score: number;
  semanticScore: number;
  keywordScore: number;
  matchType: 'semantic' | 'keyword' | 'hybrid';
}

export interface QueryEngineConfig {
  metadataStore: MetadataStore;
  faissStore?: FaissStore | null;
  embedding?: OllamaEmbedding | null;
  tier?: SearchTier;
}

export class QueryEngine {
  private faissStore: FaissStore | null;
  private metadataStore: MetadataStore;
  private embedding: OllamaEmbedding | null;
  private tier: SearchTier;

  constructor(config: QueryEngineConfig) {
    this.metadataStore = config.metadataStore;
    this.faissStore = config.faissStore || null;
    this.embedding = config.embedding || null;

    // Determine tier based on available components
    if (config.tier) {
      this.tier = config.tier;
    } else if (this.faissStore && this.embedding) {
      this.tier = 'hybrid';
    } else if (this.embedding) {
      this.tier = 'rerank';
    } else {
      this.tier = 'keyword';
    }
  }

  /**
   * Legacy constructor for backwards compatibility
   */
  static createLegacy(
    faissStore: FaissStore,
    metadataStore: MetadataStore,
    embedding: OllamaEmbedding
  ): QueryEngine {
    return new QueryEngine({
      metadataStore,
      faissStore,
      embedding,
      tier: 'hybrid',
    });
  }

  /**
   * Create a QueryEngine with automatic tier detection
   */
  static async createWithAutoTier(
    metadataStore: MetadataStore,
    dataPath: string
  ): Promise<{ engine: QueryEngine; tier: SearchTier }> {
    const tierInfo = await detectSearchTier();

    let faissStore: FaissStore | null = null;
    let embedding: OllamaEmbedding | null = null;

    if (tierInfo.hasOllama) {
      embedding = new OllamaEmbedding();
    }

    if (tierInfo.hasFaiss && tierInfo.tier === 'hybrid') {
      const { join } = await import('path');
      faissStore = new FaissStore(768, join(dataPath, 'embeddings.faiss'));
      if (faissStore.exists()) {
        await faissStore.load();
      } else {
        faissStore = null; // Downgrade tier if index doesn't exist
      }
    }

    const engine = new QueryEngine({
      metadataStore,
      faissStore,
      embedding,
      tier: tierInfo.tier,
    });

    return { engine, tier: tierInfo.tier };
  }

  /**
   * Get the current search tier
   */
  getTier(): SearchTier {
    return this.tier;
  }

  /**
   * Get human-readable tier description
   */
  getTierDescription(): string {
    return getTierDescription(this.tier);
  }

  /**
   * Search using the appropriate method for the current tier
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    switch (this.tier) {
      case 'hybrid':
        return this.searchHybrid(query, options);
      case 'rerank':
        return this.searchRerank(query, options);
      case 'keyword':
        return this.searchKeyword(query, options);
    }
  }

  /**
   * Tier 1: Hybrid search using semantic + keyword with RRF ranking
   */
  private async searchHybrid(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const {
      maxResults = 10,
      domain,
      fileType,
      semanticWeight = 0.7,
      keywordWeight = 0.3,
    } = options;

    // Validate maxResults (FAISS requires k > 0)
    if (maxResults <= 0) {
      return [];
    }

    if (!this.faissStore || !this.embedding) {
      // Fallback to rerank if components not available
      return this.searchRerank(query, options);
    }

    // Validate weights sum to 1.0
    const totalWeight = semanticWeight + keywordWeight;
    const normalizedSemanticWeight = semanticWeight / totalWeight;
    const normalizedKeywordWeight = keywordWeight / totalWeight;

    // Run both searches in parallel for performance
    const [semanticResults, keywordResults] = await Promise.all([
      this.semanticSearch(query, maxResults * 2), // Get more candidates for fusion
      this.keywordSearchInternal(query, maxResults * 2),
    ]);

    // Apply Reciprocal Rank Fusion (RRF)
    const fusedResults = this.applyRRF(
      semanticResults,
      keywordResults,
      normalizedSemanticWeight,
      normalizedKeywordWeight
    );

    // Filter by domain and file type if specified
    let filteredResults = fusedResults;
    if (domain) {
      filteredResults = filteredResults.filter((r) => r.chunk.domain === domain);
    }
    if (fileType) {
      filteredResults = filteredResults.filter((r) => r.chunk.fileType === fileType);
    }

    // Return top N results
    return filteredResults.slice(0, maxResults);
  }

  /**
   * Tier 2: Rerank search - keyword search with semantic reranking
   */
  private async searchRerank(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { maxResults = 10, domain, fileType } = options;

    if (!this.embedding) {
      // Fallback to keyword-only if Ollama not available
      return this.searchKeyword(query, options);
    }

    // Get more keyword candidates for reranking
    const keywordResults = this.keywordSearchInternal(query, maxResults * 3);

    if (keywordResults.length === 0) {
      return [];
    }

    // Generate query embedding
    const queryEmbedding = await this.embedding.embed(query);

    // Score each result semantically
    const scoredResults: SearchResult[] = [];

    for (const result of keywordResults) {
      // Generate embedding for chunk text (this is expensive but necessary for rerank)
      // In production, you'd cache these embeddings
      const chunkEmbedding = await this.embedding.embed(result.chunk.chunkText.slice(0, 1000));
      const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);

      scoredResults.push({
        chunk: result.chunk,
        score: similarity * 0.7 + result.rank * 0.3, // Weighted combination
        semanticScore: similarity,
        keywordScore: result.rank,
        matchType: 'hybrid',
      });
    }

    // Sort by combined score
    scoredResults.sort((a, b) => b.score - a.score);

    // Filter by domain and file type if specified
    let filteredResults = scoredResults;
    if (domain) {
      filteredResults = filteredResults.filter((r) => r.chunk.domain === domain);
    }
    if (fileType) {
      filteredResults = filteredResults.filter((r) => r.chunk.fileType === fileType);
    }

    return filteredResults.slice(0, maxResults);
  }

  /**
   * Tier 3: Keyword-only search using FTS5
   */
  private searchKeyword(query: string, options: SearchOptions = {}): SearchResult[] {
    const { maxResults = 10, domain, fileType } = options;

    const keywordResults = this.keywordSearchInternal(query, maxResults * 2);

    // Convert to SearchResult format
    let results: SearchResult[] = keywordResults.map((result) => ({
      chunk: result.chunk,
      score: result.rank,
      semanticScore: 0,
      keywordScore: result.rank,
      matchType: 'keyword' as const,
    }));

    // Filter by domain and file type if specified
    if (domain) {
      results = results.filter((r) => r.chunk.domain === domain);
    }
    if (fileType) {
      results = results.filter((r) => r.chunk.fileType === fileType);
    }

    return results.slice(0, maxResults);
  }

  /**
   * Semantic search using vector embeddings (internal)
   */
  private async semanticSearch(
    query: string,
    maxResults: number
  ): Promise<Array<{ chunk: ChunkMetadata; distance: number }>> {
    if (!this.faissStore || !this.embedding) {
      return [];
    }

    // Generate query embedding
    const queryEmbedding = await this.embedding.embed(query);

    // Search FAISS index
    const searchResults = await this.faissStore.search(queryEmbedding, maxResults);

    // Retrieve metadata for each result
    const results: Array<{ chunk: ChunkMetadata; distance: number }> = [];

    for (let i = 0; i < searchResults.ids.length; i++) {
      const vectorId = searchResults.ids[i];
      const distance = searchResults.distances[i];
      const metadata = this.metadataStore.getChunkByVectorId(vectorId);

      if (metadata) {
        results.push({ chunk: metadata, distance });
      }
    }

    return results;
  }

  /**
   * Keyword search using SQLite FTS5 (internal)
   */
  private keywordSearchInternal(
    query: string,
    maxResults: number
  ): Array<{ chunk: ChunkMetadata; rank: number }> {
    try {
      const results = this.metadataStore.fullTextSearch(query, maxResults);

      // FTS5 returns results in rank order (best first)
      // Assign synthetic rank scores: 1.0 for first result, decreasing linearly
      return results.map((chunk, index) => ({
        chunk,
        rank: 1.0 - index / Math.max(results.length, 1),
      }));
    } catch {
      // FTS5 can fail on certain query syntax (e.g., special characters)
      // Return empty results rather than failing the entire search
      return [];
    }
  }

  /**
   * Reciprocal Rank Fusion (RRF)
   *
   * Merges two ranked lists using position-based scoring:
   * score = 1 / (k + rank)
   *
   * Where k=60 is a constant that reduces impact of high rankings
   * (standard value from research literature)
   */
  private applyRRF(
    semanticResults: Array<{ chunk: ChunkMetadata; distance: number }>,
    keywordResults: Array<{ chunk: ChunkMetadata; rank: number }>,
    semanticWeight: number,
    keywordWeight: number
  ): SearchResult[] {
    const k = 60; // RRF constant
    const scoreMap = new Map<string, SearchResult>();

    // Process semantic results
    semanticResults.forEach((result, index) => {
      const rrfScore = 1 / (k + index + 1); // +1 because rank is 1-indexed
      const similarity = 1 / (1 + result.distance); // Convert distance to similarity

      scoreMap.set(result.chunk.id, {
        chunk: result.chunk,
        score: rrfScore * semanticWeight,
        semanticScore: similarity,
        keywordScore: 0,
        matchType: 'semantic',
      });
    });

    // Process keyword results and merge
    keywordResults.forEach((result, index) => {
      const rrfScore = 1 / (k + index + 1);
      const existing = scoreMap.get(result.chunk.id);

      if (existing) {
        // Chunk appears in both searches - boost it
        existing.score += rrfScore * keywordWeight;
        existing.keywordScore = result.rank;
        existing.matchType = 'hybrid';
      } else {
        // Keyword-only result
        scoreMap.set(result.chunk.id, {
          chunk: result.chunk,
          score: rrfScore * keywordWeight,
          semanticScore: 0,
          keywordScore: result.rank,
          matchType: 'keyword',
        });
      }
    });

    // Sort by final score (highest first)
    return Array.from(scoreMap.values()).sort((a, b) => b.score - a.score);
  }

  /**
   * Cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Find related code by analyzing a specific file or chunk
   */
  async findRelatedCode(filePath: string, maxResults: number = 5): Promise<SearchResult[]> {
    // Get all chunks from the target file
    const targetChunks = this.metadataStore.getChunksByFile(filePath);

    if (targetChunks.length === 0) {
      return [];
    }

    // Use the first chunk's text as the search query
    // (Could be enhanced to combine multiple chunks)
    const queryText = targetChunks[0].chunkText;

    // Search for similar code, excluding the source file
    const results = await this.search(queryText, { maxResults: maxResults * 2 });

    // Filter out chunks from the same file
    return results.filter((r) => r.chunk.filePath !== filePath).slice(0, maxResults);
  }

  /**
   * Search debug logs for error patterns
   */
  async searchDebugLogs(errorPattern: string, maxResults: number = 10): Promise<SearchResult[]> {
    const results = await this.search(errorPattern, {
      maxResults,
      semanticWeight: 0.8, // Favor semantic matching for error descriptions
      keywordWeight: 0.2,
    });

    // Filter to only debug log chunks
    return results.filter((r) => r.chunk.isDebugLog);
  }

  /**
   * Find all TODOs, optionally filtered by domain
   */
  getTodos(domain?: string): ChunkMetadata[] {
    return this.metadataStore.getTodos(domain);
  }

  /**
   * Trace a request flow by finding related endpoints and handlers
   *
   * For example: "user login" → finds frontend login component,
   * API auth route, JWT generation, database queries, etc.
   */
  async traceRequestFlow(
    flowDescription: string,
    maxResults: number = 10
  ): Promise<{
    frontend: SearchResult[];
    backend: SearchResult[];
    database: SearchResult[];
  }> {
    // Search each domain separately for better organization
    const [frontend, backend, database] = await Promise.all([
      this.search(flowDescription, {
        domain: 'typescript-frontend',
        maxResults: Math.ceil(maxResults / 3),
      }),
      this.search(flowDescription, {
        domain: 'rust-auth', // Could be generalized
        maxResults: Math.ceil(maxResults / 3),
      }),
      this.search(flowDescription, {
        domain: 'database',
        maxResults: Math.ceil(maxResults / 3),
      }),
    ]);

    return { frontend, backend, database };
  }
}
