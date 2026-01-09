/**
 * Input Validation and Sanitization
 *
 * Provides security-focused validation for all user inputs:
 * - Path validation (prevent traversal attacks)
 * - Query sanitization
 * - Config validation
 */

import { resolve, normalize, relative, isAbsolute } from 'path';
import { existsSync, statSync } from 'fs';

/**
 * Validation error with detailed context
 */
export class ValidationError extends Error {
  public readonly code: string;
  public readonly field?: string;
  public readonly value?: unknown;

  constructor(message: string, code: string, field?: string, value?: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.field = field;
    this.value = value;
  }
}

/**
 * Validate that a path is within the allowed root directory.
 * Prevents path traversal attacks (e.g., ../../../etc/passwd)
 */
export function validatePathWithinRoot(inputPath: string, rootDir: string): string {
  // Normalize and resolve both paths
  const normalizedRoot = resolve(normalize(rootDir));
  const normalizedInput = resolve(normalizedRoot, normalize(inputPath));

  // Check if the resolved path starts with the root
  const relativePath = relative(normalizedRoot, normalizedInput);

  // If relative path starts with '..' or is absolute, it's outside root
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new ValidationError(
      `Path "${inputPath}" is outside allowed root directory`,
      'PATH_TRAVERSAL',
      'path',
      inputPath
    );
  }

  return normalizedInput;
}

/**
 * Validate a file path exists and is a file (not directory)
 */
export function validateFileExists(filePath: string): void {
  if (!existsSync(filePath)) {
    throw new ValidationError(
      `File not found: ${filePath}`,
      'FILE_NOT_FOUND',
      'filePath',
      filePath
    );
  }

  const stats = statSync(filePath);
  if (!stats.isFile()) {
    throw new ValidationError(
      `Path is not a file: ${filePath}`,
      'NOT_A_FILE',
      'filePath',
      filePath
    );
  }
}

/**
 * Validate a directory path exists and is a directory
 */
export function validateDirectoryExists(dirPath: string): void {
  if (!existsSync(dirPath)) {
    throw new ValidationError(
      `Directory not found: ${dirPath}`,
      'DIR_NOT_FOUND',
      'dirPath',
      dirPath
    );
  }

  const stats = statSync(dirPath);
  if (!stats.isDirectory()) {
    throw new ValidationError(
      `Path is not a directory: ${dirPath}`,
      'NOT_A_DIRECTORY',
      'dirPath',
      dirPath
    );
  }
}

/**
 * Sanitize a search query for FTS5
 * Removes dangerous characters that could cause SQL injection or FTS5 errors
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    throw new ValidationError(
      'Search query must be a non-empty string',
      'INVALID_QUERY',
      'query',
      query
    );
  }

  // Trim whitespace
  let sanitized = query.trim();

  // Limit query length
  const MAX_QUERY_LENGTH = 1000;
  if (sanitized.length > MAX_QUERY_LENGTH) {
    sanitized = sanitized.slice(0, MAX_QUERY_LENGTH);
  }

  // Remove FTS5 special operators that could cause issues
  // Keep alphanumeric, spaces, and common punctuation
  sanitized = sanitized
    .replace(/[*"(){}[\]^~\\]/g, ' ') // Remove FTS5 special chars
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();

  if (sanitized.length === 0) {
    throw new ValidationError(
      'Search query is empty after sanitization',
      'EMPTY_QUERY',
      'query',
      query
    );
  }

  return sanitized;
}

/**
 * Validate a domain name
 */
export function validateDomainName(domain: string): string {
  if (!domain || typeof domain !== 'string') {
    throw new ValidationError(
      'Domain name must be a non-empty string',
      'INVALID_DOMAIN',
      'domain',
      domain
    );
  }

  // Allow alphanumeric, hyphens, and underscores
  const sanitized = domain.trim().toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(sanitized)) {
    throw new ValidationError(
      'Domain name contains invalid characters',
      'INVALID_DOMAIN_CHARS',
      'domain',
      domain
    );
  }

  const MAX_DOMAIN_LENGTH = 64;
  if (sanitized.length > MAX_DOMAIN_LENGTH) {
    throw new ValidationError(
      `Domain name exceeds maximum length of ${MAX_DOMAIN_LENGTH}`,
      'DOMAIN_TOO_LONG',
      'domain',
      domain
    );
  }

  return sanitized;
}

/**
 * Validate a glob pattern for safety
 */
export function validateGlobPattern(pattern: string): string {
  if (!pattern || typeof pattern !== 'string') {
    throw new ValidationError(
      'Glob pattern must be a non-empty string',
      'INVALID_PATTERN',
      'pattern',
      pattern
    );
  }

  const trimmed = pattern.trim();

  // Disallow absolute paths in patterns
  if (isAbsolute(trimmed)) {
    throw new ValidationError(
      'Glob patterns must not be absolute paths',
      'ABSOLUTE_PATTERN',
      'pattern',
      pattern
    );
  }

  // Disallow parent directory traversal
  if (trimmed.includes('..')) {
    throw new ValidationError(
      'Glob patterns must not contain parent directory references',
      'PATTERN_TRAVERSAL',
      'pattern',
      pattern
    );
  }

  return trimmed;
}

/**
 * Validate numeric option is within bounds
 */
export function validateNumericOption(
  value: number,
  name: string,
  min: number,
  max: number
): number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(
      `${name} must be a number`,
      'INVALID_NUMBER',
      name,
      value
    );
  }

  if (value < min || value > max) {
    throw new ValidationError(
      `${name} must be between ${min} and ${max}`,
      'OUT_OF_RANGE',
      name,
      value
    );
  }

  return Math.floor(value);
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new ValidationError(
      'Project name must be a non-empty string',
      'INVALID_PROJECT_NAME',
      'projectName',
      name
    );
  }

  const sanitized = name.trim();

  const MAX_PROJECT_NAME_LENGTH = 128;
  if (sanitized.length > MAX_PROJECT_NAME_LENGTH) {
    throw new ValidationError(
      `Project name exceeds maximum length of ${MAX_PROJECT_NAME_LENGTH}`,
      'PROJECT_NAME_TOO_LONG',
      'projectName',
      name
    );
  }

  // Allow most characters but sanitize for file system safety
  const safe = sanitized.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
  return safe;
}

/**
 * Validate file size is within limits
 */
export function validateFileSize(filePath: string, maxSizeBytes: number): void {
  const stats = statSync(filePath);

  if (stats.size > maxSizeBytes) {
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const maxMB = (maxSizeBytes / (1024 * 1024)).toFixed(2);
    throw new ValidationError(
      `File size (${sizeMB}MB) exceeds maximum allowed (${maxMB}MB)`,
      'FILE_TOO_LARGE',
      'filePath',
      filePath
    );
  }
}
