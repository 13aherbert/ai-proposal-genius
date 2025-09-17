export interface ErrorContext {
  function: string;
  step: string;
  requestId?: string;
  userId?: string;
  projectId?: string;
  sectionTitle?: string;
  timestamp: string;
}

export interface EnhancedError extends Error {
  context?: ErrorContext;
  isRetryable?: boolean;
  statusCode?: number;
  userMessage?: string;
}

export class ProposalGenerationError extends Error implements EnhancedError {
  context?: ErrorContext;
  isRetryable: boolean;
  statusCode: number;
  userMessage: string;

  constructor(
    message: string, 
    context?: ErrorContext, 
    isRetryable = false, 
    statusCode = 500,
    userMessage?: string
  ) {
    super(message);
    this.name = 'ProposalGenerationError';
    this.context = context;
    this.isRetryable = isRetryable;
    this.statusCode = statusCode;
    this.userMessage = userMessage || this.getDefaultUserMessage(statusCode);
  }

  private getDefaultUserMessage(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'There was an issue with the request. Please check your inputs and try again.';
      case 401:
        return 'Authentication required. Please log in and try again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait a moment before trying again.';
      case 500:
        return 'An internal error occurred. Our team has been notified.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

export function createErrorContext(
  functionName: string,
  step: string,
  additionalContext?: Partial<ErrorContext>
): ErrorContext {
  return {
    function: functionName,
    step,
    timestamp: new Date().toISOString(),
    ...additionalContext
  };
}

export function handleApiError(error: any, context: ErrorContext): ProposalGenerationError {
  console.error(`Error in ${context.function}:${context.step}:`, {
    error: error.message || error,
    stack: error.stack,
    context
  });

  // Handle specific API errors
  if (error.message?.includes('API key')) {
    return new ProposalGenerationError(
      'API authentication failed',
      context,
      false,
      500,
      'Service configuration error. Please contact support.'
    );
  }

  if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
    return new ProposalGenerationError(
      'API rate limit exceeded',
      context,
      true,
      429,
      'Service is temporarily busy. Please try again in a few moments.'
    );
  }

  if (error.message?.includes('timeout') || error.message?.includes('network')) {
    return new ProposalGenerationError(
      'Network timeout',
      context,
      true,
      500,
      'Network issue detected. Please try again.'
    );
  }

  if (error.message?.includes('JSON') || error.message?.includes('parse')) {
    return new ProposalGenerationError(
      'Invalid data format',
      context,
      false,
      400,
      'Invalid request format. Please refresh and try again.'
    );
  }

  // Handle database errors
  if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
    return new ProposalGenerationError(
      'Resource not found',
      context,
      false,
      404,
      'The requested project or section was not found.'
    );
  }

  if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
    return new ProposalGenerationError(
      'Authorization failed',
      context,
      false,
      403,
      'You do not have permission to access this resource.'
    );
  }

  // Generic error
  return new ProposalGenerationError(
    error.message || 'Unknown error occurred',
    context,
    false,
    500
  );
}

export function createSuccessResponse(data: any, optimizationMetrics?: any) {
  const response = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };

  if (optimizationMetrics) {
    response.optimizationMetrics = optimizationMetrics;
  }

  return response;
}

export function createErrorResponse(error: ProposalGenerationError) {
  return {
    success: false,
    error: {
      message: error.userMessage,
      code: error.statusCode,
      isRetryable: error.isRetryable,
      context: error.context,
      timestamp: new Date().toISOString()
    }
  };
}

// Retry mechanism for retryable operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  context?: ErrorContext
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      const enhancedError = error instanceof ProposalGenerationError ? 
        error : 
        handleApiError(error, context || createErrorContext('withRetry', 'operation'));
      
      console.log(`Attempt ${attempt}/${maxAttempts} failed:`, enhancedError.message);
      
      // Don't retry non-retryable errors
      if (!enhancedError.isRetryable || attempt === maxAttempts) {
        throw enhancedError;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Circuit breaker pattern for API calls
class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private isOpen: boolean = false;
  
  constructor(
    private maxFailures: number = 5,
    private resetTimeout: number = 60000 // 1 minute
  ) {}
  
  async execute<T>(operation: () => Promise<T>, context?: ErrorContext): Promise<T> {
    if (this.isOpen) {
      if (Date.now() - this.lastFailureTime < this.resetTimeout) {
        throw new ProposalGenerationError(
          'Circuit breaker is open',
          context,
          true,
          503,
          'Service is temporarily unavailable. Please try again later.'
        );
      } else {
        this.reset();
      }
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
    this.failures = 0;
    this.isOpen = false;
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.maxFailures) {
      this.isOpen = true;
      console.warn(`Circuit breaker opened after ${this.failures} failures`);
    }
  }
  
  private reset() {
    this.failures = 0;
    this.isOpen = false;
    console.log('Circuit breaker reset');
  }
}

export const apiCircuitBreaker = new CircuitBreaker();