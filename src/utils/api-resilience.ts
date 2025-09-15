/**
 * API Resilience utilities for handling rate limiting and failures
 */

export interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export class CircuitBreaker {
  private state: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    state: 'CLOSED'
  };
  
  private readonly maxFailures: number;
  private readonly timeout: number;
  
  constructor(maxFailures = 5, timeout = 30000) {
    this.maxFailures = maxFailures;
    this.timeout = timeout;
  }
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state.state === 'OPEN') {
      if (Date.now() - this.state.lastFailureTime < this.timeout) {
        throw new Error('Circuit breaker is OPEN - too many consecutive failures');
      }
      this.state.state = 'HALF_OPEN';
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.state.failures = 0;
    this.state.state = 'CLOSED';
  }
  
  private onFailure() {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();
    
    if (this.state.failures >= this.maxFailures) {
      this.state.state = 'OPEN';
    }
  }
  
  getState() {
    return { ...this.state };
  }

  reset() {
    this.state = {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED'
    };
  }
}

/**
 * Enhanced retry with jitter and intelligent backoff
 */
export async function enhancedRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 30000,
  jitterFactor: number = 0.1
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries - 1) {
        break; // Last attempt failed
      }
      
      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = exponentialDelay * jitterFactor * Math.random();
      const totalDelay = exponentialDelay + jitter;
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(totalDelay)}ms`);
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

/**
 * Rate limiter with pre-emptive delays
 */
export class RateLimiter {
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private windowStart: number = Date.now();
  
  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000,
    private minDelay: number = 1000
  ) {}
  
  async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Reset window if expired
    if (now - this.windowStart >= this.windowMs) {
      this.requestCount = 0;
      this.windowStart = now;
    }
    
    // Check if we've hit the rate limit
    if (this.requestCount >= this.maxRequests) {
      const waitTime = this.windowMs - (now - this.windowStart);
      if (waitTime > 0) {
        console.log(`Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
        this.windowStart = Date.now();
      }
    }
    
    // Enforce minimum delay between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelay) {
      const additionalDelay = this.minDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, additionalDelay));
    }
    
    this.requestCount++;
    this.lastRequestTime = Date.now();
  }
}

/**
 * API health monitor
 */
export class ApiHealthMonitor {
  private errorCount: number = 0;
  private successCount: number = 0;
  private responseTimeSum: number = 0;
  private requestCount: number = 0;
  
  recordSuccess(responseTime: number) {
    this.successCount++;
    this.requestCount++;
    this.responseTimeSum += responseTime;
  }
  
  recordError() {
    this.errorCount++;
    this.requestCount++;
  }
  
  getHealthMetrics() {
    return {
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      averageResponseTime: this.requestCount > 0 ? this.responseTimeSum / this.requestCount : 0,
      totalRequests: this.requestCount,
      isHealthy: this.requestCount > 0 ? (this.errorCount / this.requestCount) < 0.5 : true
    };
  }
  
  reset() {
    this.errorCount = 0;
    this.successCount = 0;
    this.responseTimeSum = 0;
    this.requestCount = 0;
  }
}