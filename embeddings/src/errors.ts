/**
 * Custom Error Classes for EmbedContext
 *
 * Provides structured error handling with error codes and context.
 */

/**
 * Base error class for all EmbedContext errors
 */
export class EmbedContextError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;
  public readonly cause?: Error;

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message);
    this.name = 'EmbedContextError';
    this.code = code;
    this.context = context;
    this.cause = cause;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get a user-friendly error message
   */
  toUserMessage(): string {
    return `${this.message} (${this.code})`;
  }

  /**
   * Convert to JSON for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Configuration-related errors
 */
export class ConfigError extends EmbedContextError {
  constructor(message: string, context?: Record<string, unknown>, cause?: Error) {
    super(message, 'CONFIG_ERROR', context, cause);
    this.name = 'ConfigError';
  }
}

/**
 * Configuration file not found
 */
export class ConfigNotFoundError extends ConfigError {
  constructor(searchPaths?: string[]) {
    super(
      'Configuration file not found. Run `embedcontext init` to create one.',
      { searchPaths }
    );
    this.name = 'ConfigNotFoundError';
  }
}

/**
 * Configuration file is invalid
 */
export class ConfigInvalidError extends ConfigError {
  constructor(message: string, configPath?: string, cause?: Error) {
    super(message, { configPath }, cause);
    this.name = 'ConfigInvalidError';
  }
}

/**
 * Index-related errors
 */
export class IndexError extends EmbedContextError {
  constructor(message: string, context?: Record<string, unknown>, cause?: Error) {
    super(message, 'INDEX_ERROR', context, cause);
    this.name = 'IndexError';
  }
}

/**
 * Index not found or not built
 */
export class IndexNotFoundError extends IndexError {
  constructor(indexPath?: string) {
    super(
      'Index not found. Run `embedcontext index` to build it.',
      { indexPath }
    );
    this.name = 'IndexNotFoundError';
  }
}

/**
 * Index is stale (config changed)
 */
export class IndexStaleError extends IndexError {
  constructor(reason?: string) {
    super(
      'Index is stale. Run `embedcontext index` to rebuild.',
      { reason }
    );
    this.name = 'IndexStaleError';
  }
}

/**
 * Ollama-related errors
 */
export class OllamaError extends EmbedContextError {
  constructor(message: string, context?: Record<string, unknown>, cause?: Error) {
    super(message, 'OLLAMA_ERROR', context, cause);
    this.name = 'OllamaError';
  }
}

/**
 * Ollama server not reachable
 */
export class OllamaConnectionError extends OllamaError {
  constructor(endpoint?: string) {
    super(
      'Ollama server not reachable. Start it with: ollama serve',
      { endpoint }
    );
    this.name = 'OllamaConnectionError';
  }
}

/**
 * Ollama model not found
 */
export class OllamaModelNotFoundError extends OllamaError {
  constructor(model: string) {
    super(
      `Embedding model not found. Install with: ollama pull ${model}`,
      { model }
    );
    this.name = 'OllamaModelNotFoundError';
  }
}

/**
 * Search-related errors
 */
export class SearchError extends EmbedContextError {
  constructor(message: string, context?: Record<string, unknown>, cause?: Error) {
    super(message, 'SEARCH_ERROR', context, cause);
    this.name = 'SearchError';
  }
}

/**
 * Resource limit exceeded
 */
export class ResourceLimitError extends EmbedContextError {
  public readonly limit: string;
  public readonly actual: number;
  public readonly maximum: number;

  constructor(limit: string, actual: number, maximum: number) {
    super(
      `Resource limit exceeded: ${limit} (${actual} > ${maximum})`,
      'RESOURCE_LIMIT',
      { limit, actual, maximum }
    );
    this.name = 'ResourceLimitError';
    this.limit = limit;
    this.actual = actual;
    this.maximum = maximum;
  }
}

/**
 * Concurrency limit exceeded
 */
export class ConcurrencyLimitError extends EmbedContextError {
  constructor(limit: number) {
    super(
      `Too many concurrent requests. Maximum: ${limit}`,
      'CONCURRENCY_LIMIT',
      { limit }
    );
    this.name = 'ConcurrencyLimitError';
  }
}

/**
 * Operation timed out
 */
export class TimeoutError extends EmbedContextError {
  constructor(operation: string, timeoutMs: number) {
    super(
      `Operation timed out: ${operation} (${timeoutMs}ms)`,
      'TIMEOUT',
      { operation, timeoutMs }
    );
    this.name = 'TimeoutError';
  }
}

/**
 * Check if an error is an EmbedContext error
 */
export function isEmbedContextError(error: unknown): error is EmbedContextError {
  return error instanceof EmbedContextError;
}

/**
 * Wrap an unknown error in an EmbedContextError
 */
export function wrapError(error: unknown, defaultMessage: string): EmbedContextError {
  if (error instanceof EmbedContextError) {
    return error;
  }

  if (error instanceof Error) {
    return new EmbedContextError(
      error.message || defaultMessage,
      'UNKNOWN_ERROR',
      undefined,
      error
    );
  }

  return new EmbedContextError(
    defaultMessage,
    'UNKNOWN_ERROR',
    { originalError: String(error) }
  );
}
