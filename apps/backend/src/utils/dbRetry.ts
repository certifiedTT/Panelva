export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  factor?: number;
}

/**
 * Executes a database or network operation with exponential backoff retry logic.
 */
export async function withRetry<T>(
  operation: () => PromiseLike<T>,
  options: RetryOptions = {},
  onRetry?: (error: any, attempt: number, delay: number) => void
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const factor = options.factor ?? 2;
  const initialDelayMs = options.initialDelayMs ?? 150;

  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      
      if (attempt > maxRetries) {
        throw error;
      }

      // Identify common database transient or network failure keywords
      const errorMessage = (error.message || "").toLowerCase();
      const isTransient =
        errorMessage.includes("connection") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("fetch failed") ||
        errorMessage.includes("network") ||
        errorMessage.includes("socket") ||
        errorMessage.includes("pool") ||
        error.status === 502 ||
        error.status === 503 ||
        error.status === 504;

      // Fail fast on hard validation or syntax errors (avoid redundant retries)
      if (!isTransient) {
        throw error;
      }

      const delay = initialDelayMs * Math.pow(factor, attempt - 1);
      
      if (onRetry) {
        onRetry(error, attempt, delay);
      } else {
        console.warn(
          `[Resilience] Transient error encountered (Attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms... error: ${error.message || error}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
