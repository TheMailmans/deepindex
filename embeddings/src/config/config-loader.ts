/**
 * Configuration Loader for DevContext
 * Loads and validates project-specific configuration
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface DomainConfig {
  name: string;
  patterns: string[];
  description: string;
}

export interface DevContextConfig {
  projectName: string;
  projectType: string; // 'rust', 'typescript', 'python', 'go', 'java', 'mixed'
  rootDir: string;
  domains: DomainConfig[];
  embeddingsModel?: string;
  chunkSize?: number;
  tagKeywords?: string[];
}

export class ConfigLoader {
  private static instance: ConfigLoader | null = null;
  private config: DevContextConfig | null = null;

  private constructor() {}

  static getInstance(configPath?: string): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    if (configPath) {
      ConfigLoader.instance.load(configPath);
    }
    return ConfigLoader.instance;
  }

  load(configPath: string): void {
    const configContent = readFileSync(configPath, 'utf-8');
    this.config = JSON.parse(configContent);
  }

  getConfig(): DevContextConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first or set DEVCONTEXT_CONFIG environment variable.');
    }
    return this.config;
  }

  getDomains(): Record<string, string[]> {
    const domains: Record<string, string[]> = {};
    this.getConfig().domains.forEach(domain => {
      domains[domain.name] = domain.patterns;
    });
    return domains;
  }

  getTagKeywords(): string[] {
    return this.getConfig().tagKeywords || [
      'async', 'await', 'function', 'class', 'interface', 'type',
      'api', 'endpoint', 'route', 'handler', 'middleware',
      'database', 'query', 'model', 'schema',
      'test', 'mock', 'fixture', 'error', 'validation'
    ];
  }

  getEmbeddingsModel(): string {
    return this.getConfig().embeddingsModel || 'nomic-embed-text';
  }

  getChunkSize(): number {
    return this.getConfig().chunkSize || 512;
  }
}
