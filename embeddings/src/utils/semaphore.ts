/**
 * Semaphore for Concurrency Control
 *
 * Limits the number of concurrent operations to prevent resource exhaustion.
 * Used by the MCP server to limit concurrent search requests.
 */

import { ConcurrencyLimitError, TimeoutError } from '../errors.js';

/**
 * A counting semaphore for limiting concurrent access
 */
export class Semaphore {
  private permits: number;
  private readonly maxPermits: number;
  private readonly waitQueue: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
    timeoutId?: NodeJS.Timeout;
  }> = [];

  constructor(maxPermits: number) {
    if (maxPermits <= 0) {
      throw new Error('Semaphore must have at least 1 permit');
    }
    this.maxPermits = maxPermits;
    this.permits = maxPermits;
  }

  /**
   * Get the number of available permits
   */
  get available(): number {
    return this.permits;
  }

  /**
   * Get the number of waiters in queue
   */
  get waiting(): number {
    return this.waitQueue.length;
  }

  /**
   * Acquire a permit, waiting if necessary
   * @param timeoutMs Optional timeout in milliseconds
   */
  async acquire(timeoutMs?: number): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    // Need to wait for a permit
    return new Promise((resolve, reject) => {
      const waiter = { resolve, reject, timeoutId: undefined as NodeJS.Timeout | undefined };

      if (timeoutMs !== undefined && timeoutMs > 0) {
        waiter.timeoutId = setTimeout(() => {
          // Remove from queue
          const index = this.waitQueue.indexOf(waiter);
          if (index !== -1) {
            this.waitQueue.splice(index, 1);
          }
          reject(new TimeoutError('Semaphore acquire', timeoutMs));
        }, timeoutMs);
      }

      this.waitQueue.push(waiter);
    });
  }

  /**
   * Try to acquire a permit without waiting
   * @returns true if permit was acquired, false otherwise
   */
  tryAcquire(): boolean {
    if (this.permits > 0) {
      this.permits--;
      return true;
    }
    return false;
  }

  /**
   * Release a permit
   */
  release(): void {
    if (this.permits >= this.maxPermits) {
      throw new Error('Cannot release more permits than maximum');
    }

    const waiter = this.waitQueue.shift();
    if (waiter) {
      // Give permit to next waiter
      if (waiter.timeoutId) {
        clearTimeout(waiter.timeoutId);
      }
      waiter.resolve();
    } else {
      // Return permit to pool
      this.permits++;
    }
  }

  /**
   * Execute a function with a permit
   * Automatically acquires before and releases after
   */
  async withPermit<T>(fn: () => Promise<T>, timeoutMs?: number): Promise<T> {
    await this.acquire(timeoutMs);
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  /**
   * Try to execute a function with a permit without waiting
   * Throws ConcurrencyLimitError if no permit available
   */
  async tryWithPermit<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.tryAcquire()) {
      throw new ConcurrencyLimitError(this.maxPermits);
    }
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

/**
 * Rate limiter using sliding window
 */
export class RateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly timestamps: number[] = [];

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request is allowed and record it
   * @returns true if allowed, false if rate limited
   */
  tryRequest(): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove old timestamps
    while (this.timestamps.length > 0 && this.timestamps[0] < windowStart) {
      this.timestamps.shift();
    }

    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }

    this.timestamps.push(now);
    return true;
  }

  /**
   * Get time until next request is allowed (in ms)
   * Returns 0 if request is allowed now
   */
  getWaitTime(): number {
    if (this.timestamps.length < this.maxRequests) {
      return 0;
    }

    const oldestInWindow = this.timestamps[0];
    const windowEnd = oldestInWindow + this.windowMs;
    return Math.max(0, windowEnd - Date.now());
  }

  /**
   * Get current request count in window
   */
  get currentCount(): number {
    const windowStart = Date.now() - this.windowMs;
    return this.timestamps.filter((t) => t >= windowStart).length;
  }
}

/**
 * Request queue with timeout support
 */
export class RequestQueue<T> {
  private readonly queue: Array<{
    task: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
    timeoutId?: NodeJS.Timeout;
  }> = [];
  private readonly semaphore: Semaphore;
  private processing = false;

  constructor(concurrency: number) {
    this.semaphore = new Semaphore(concurrency);
  }

  /**
   * Add a task to the queue
   */
  async enqueue(task: () => Promise<T>, timeoutMs?: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const item = {
        task,
        resolve,
        reject,
        timeoutId: undefined as NodeJS.Timeout | undefined,
      };

      if (timeoutMs !== undefined && timeoutMs > 0) {
        item.timeoutId = setTimeout(() => {
          const index = this.queue.indexOf(item);
          if (index !== -1) {
            this.queue.splice(index, 1);
            reject(new TimeoutError('Request queue', timeoutMs));
          }
        }, timeoutMs);
      }

      this.queue.push(item);
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];

      try {
        await this.semaphore.acquire();
        this.queue.shift(); // Remove from queue

        if (item.timeoutId) {
          clearTimeout(item.timeoutId);
        }

        try {
          const result = await item.task();
          item.resolve(result);
        } catch (error) {
          item.reject(error instanceof Error ? error : new Error(String(error)));
        } finally {
          this.semaphore.release();
        }
      } catch {
        // Acquire failed, stop processing
        break;
      }
    }

    this.processing = false;
  }

  /**
   * Get queue length
   */
  get length(): number {
    return this.queue.length;
  }
}
