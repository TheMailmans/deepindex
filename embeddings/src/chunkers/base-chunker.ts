/**
 * Base Chunker Interface
 * All language-specific chunkers implement this interface
 */

import { ConfigLoader } from '../config/config-loader.js';

export interface CodeChunk {
  text: string;
  startLine: number;
  endLine: number;
  symbolName?: string;
  symbolType?: string;
  tags: string[];
  isTodo: boolean;
}

export abstract class BaseChunker {
  protected maxTokens: number;
  protected contextLines: number;
  protected tagKeywords: string[];

  constructor(maxTokens: number = 500, contextLines: number = 2, keywords?: string[]) {
    this.maxTokens = maxTokens;
    this.contextLines = contextLines;

    // Use provided keywords or load from config
    if (keywords) {
      this.tagKeywords = keywords;
    } else {
      try {
        const config = ConfigLoader.getInstance();
        this.tagKeywords = config.getTagKeywords();
      } catch {
        // Fallback to generic keywords if config not loaded
        this.tagKeywords = [
          'async', 'await', 'function', 'class', 'interface', 'type',
          'api', 'endpoint', 'route', 'handler', 'middleware',
          'database', 'query', 'model', 'schema',
          'error', 'validation', 'test', 'mock'
        ];
      }
    }
  }

  /**
   * Chunk a file into semantic chunks
   */
  abstract chunkFile(content: string, filePath: string): CodeChunk[];

  /**
   * Approximate token count (rough estimate: 1 token ≈ 4 characters)
   */
  protected estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Extract TODO/FIXME markers
   */
  protected detectTodo(text: string): boolean {
    return /TODO|FIXME|XXX|HACK|NOTE:/i.test(text);
  }

  /**
   * Extract tags from comments
   */
  protected extractTags(text: string): string[] {
    const tags: string[] = [];

    for (const keyword of this.tagKeywords) {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        tags.push(keyword);
      }
    }

    return Array.from(new Set(tags)); // Remove duplicates
  }

  /**
   * Get lines from content with line numbers
   */
  protected getLines(content: string): string[] {
    return content.split('\n');
  }

  /**
   * Extract a chunk with context lines
   */
  protected extractWithContext(
    lines: string[],
    startLine: number,
    endLine: number
  ): { text: string; startLine: number; endLine: number } {
    const contextStart = Math.max(0, startLine - this.contextLines);
    const contextEnd = Math.min(lines.length - 1, endLine + this.contextLines);

    const chunkLines = lines.slice(contextStart, contextEnd + 1);
    const text = chunkLines.join('\n');

    return {
      text,
      startLine: contextStart,
      endLine: contextEnd,
    };
  }
}
