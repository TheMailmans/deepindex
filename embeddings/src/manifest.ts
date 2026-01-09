/**
 * EmbedContext Manifest Management
 *
 * Tracks build metadata, config hash, and validates index freshness.
 *
 * Manifest is written to .embedcontext/manifest.json after each index build.
 * Used to detect stale indexes when config changes.
 */

import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync, realpathSync } from 'fs';
import { join } from 'path';
import type { ResolvedConfig } from './config/config-loader.js';
import type { SearchTier } from './search-tier.js';

const MANIFEST_VERSION = 1;
const TOOL_VERSION = '0.1.0';
const MANIFEST_FILENAME = 'manifest.json';

export type { SearchTier };

export interface ManifestStats {
  fileCount: number;
  chunkCount: number;
  embeddingDimension: number;
}

export interface ManifestData {
  manifestVersion: number;
  toolVersion: string;
  schemaVersion: number;
  configHash: string;
  rootDir: string;
  rootDirReal: string;
  indexDir: string;
  indexDirReal: string;
  indexedAt: string;
  stats: ManifestStats;
  searchTier: SearchTier;
}

export type ManifestValidationResult =
  | { valid: true; manifest: ManifestData }
  | { valid: false; reason: 'missing' | 'mismatch' | 'stale' | 'newer_version'; message: string };

/**
 * Generate a SHA-256 hash of the config for change detection.
 * Includes fields that affect indexing: domains, patterns, rootDir, tagKeywords.
 */
export function generateConfigHash(config: ResolvedConfig): string {
  const hashInput = {
    schemaVersion: config.schemaVersion,
    rootDirAbs: config.rootDirAbs,
    domains: config.domains,
    tagKeywords: config.tagKeywords,
    chunkSize: config.chunkSize,
  };

  const hash = createHash('sha256')
    .update(JSON.stringify(hashInput))
    .digest('hex');

  return `sha256:${hash.slice(0, 16)}`;  // Truncate for readability
}

/**
 * Get the manifest file path for a given config.
 */
export function getManifestPath(config: ResolvedConfig): string {
  return join(config.indexDirAbs, 'data', MANIFEST_FILENAME);
}

/**
 * Read manifest from disk.
 * Returns null if manifest doesn't exist.
 */
export function readManifest(config: ResolvedConfig): ManifestData | null {
  const manifestPath = getManifestPath(config);

  if (!existsSync(manifestPath)) {
    return null;
  }

  try {
    const content = readFileSync(manifestPath, 'utf-8');
    return JSON.parse(content) as ManifestData;
  } catch {
    return null;
  }
}

/**
 * Write manifest to disk after indexing.
 */
export function writeManifest(
  config: ResolvedConfig,
  stats: ManifestStats,
  searchTier: SearchTier
): ManifestData {
  const manifestPath = getManifestPath(config);

  // Get real paths for validation
  let rootDirReal: string;
  let indexDirReal: string;

  try {
    rootDirReal = realpathSync(config.rootDirAbs);
  } catch {
    rootDirReal = config.rootDirAbs;
  }

  try {
    indexDirReal = realpathSync(config.indexDirAbs);
  } catch {
    indexDirReal = config.indexDirAbs;
  }

  const manifest: ManifestData = {
    manifestVersion: MANIFEST_VERSION,
    toolVersion: TOOL_VERSION,
    schemaVersion: config.schemaVersion,
    configHash: generateConfigHash(config),
    rootDir: config.rootDirAbs,
    rootDirReal,
    indexDir: config.indexDirAbs,
    indexDirReal,
    indexedAt: new Date().toISOString(),
    stats,
    searchTier,
  };

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return manifest;
}

/**
 * Validate manifest against current config.
 *
 * Checks:
 * 1. Manifest exists
 * 2. Manifest version is compatible
 * 3. Root/index dirs match (using realpath)
 * 4. Config hash matches (not stale)
 */
export function validateManifest(config: ResolvedConfig): ManifestValidationResult {
  const manifest = readManifest(config);

  // Check if manifest exists
  if (!manifest) {
    return {
      valid: false,
      reason: 'missing',
      message: 'No manifest found. Run `embedcontext index` to build the index.',
    };
  }

  // Check manifest version
  if (manifest.manifestVersion > MANIFEST_VERSION) {
    return {
      valid: false,
      reason: 'newer_version',
      message: `Index was created by a newer version of EmbedContext (manifest v${manifest.manifestVersion}). Please upgrade.`,
    };
  }

  // Check root/index dir match using realpath
  let currentRootReal: string;
  let currentIndexReal: string;

  try {
    currentRootReal = realpathSync(config.rootDirAbs);
  } catch {
    currentRootReal = config.rootDirAbs;
  }

  try {
    currentIndexReal = realpathSync(config.indexDirAbs);
  } catch {
    currentIndexReal = config.indexDirAbs;
  }

  if (manifest.rootDirReal !== currentRootReal) {
    return {
      valid: false,
      reason: 'mismatch',
      message: `Manifest rootDir doesn't match. Expected: ${currentRootReal}, Got: ${manifest.rootDirReal}`,
    };
  }

  if (manifest.indexDirReal !== currentIndexReal) {
    return {
      valid: false,
      reason: 'mismatch',
      message: `Manifest indexDir doesn't match. Expected: ${currentIndexReal}, Got: ${manifest.indexDirReal}`,
    };
  }

  // Check config hash for staleness
  const currentHash = generateConfigHash(config);
  if (manifest.configHash !== currentHash) {
    return {
      valid: false,
      reason: 'stale',
      message: 'Config changed since last index. Run `embedcontext index` to update.',
    };
  }

  return { valid: true, manifest };
}

/**
 * Get a human-readable index status string.
 */
export function getIndexStatus(config: ResolvedConfig): string {
  const result = validateManifest(config);

  if (result.valid) {
    const manifest = result.manifest;
    const age = getIndexAge(manifest.indexedAt);
    return `present (${manifest.stats.chunkCount} chunks, indexed ${age})`;
  }

  switch (result.reason) {
    case 'missing':
      return 'missing';
    case 'mismatch':
      return 'invalid (manifest mismatch)';
    case 'stale':
      return 'stale (config changed)';
    case 'newer_version':
      return 'incompatible (newer version)';
    default:
      return 'unknown';
  }
}

/**
 * Get human-readable age string from ISO date.
 */
function getIndexAge(isoDate: string): string {
  const indexedAt = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - indexedAt.getTime();

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return indexedAt.toLocaleDateString();
}
