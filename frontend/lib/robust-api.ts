/**
 * Robust API client with error handling, timeouts, and retry logic
 */

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class APIClient {
  private baseURL: string;
  private defaultTimeout: number = 30000; // 30 seconds
  private defaultRetries: number = 3;

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async requestWithTimeout<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const timeout = options.timeout || this.defaultTimeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = {};
        }

        throw new APIError(
          response.status,
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.code,
          errorData.details
        );
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      } else {
        return response.text() as unknown as T;
      }
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof APIError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new APIError(408, 'Request timeout');
      }

      if (error instanceof TypeError) {
        // Network errors
        throw new APIError(0, 'Network error - please check your connection');
      }

      throw new APIError(500, 'Unexpected error occurred');
    }
  }

  async request<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const retries = options.retries ?? this.defaultRetries;
    const retryDelay = options.retryDelay ?? 1000;

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.requestWithTimeout<T>(url, options);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx) or specific errors that shouldn't be retried
        if (error instanceof APIError) {
          if (
            error.status < 500 || // Client errors
            error.status === 401 || // Unauthorized
            error.status === 403 || // Forbidden  
            error.status === 404 || // Not found
            error.status === 422 || // Validation error
            error.status === 429    // Rate limited (will be handled by server)
          ) {
            throw error;
          }
        }

        // If this is the last attempt, throw the error
        if (attempt === retries) {
          throw error;
        }

        // Wait before retrying with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError!;
  }

  // HTTP methods
  async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  // File upload method
  async upload<T>(
    url: string,
    file: File,
    additionalData?: Record<string, any>,
    options: RequestOptions = {}
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }

    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', { timeout: 5000, retries: 1 });
      return true;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const apiClient = new APIClient(apiURL);

// Export individual methods for convenience
export const api = {
  get: <T>(url: string, options?: RequestOptions) => apiClient.get<T>(url, options),
  post: <T>(url: string, data?: any, options?: RequestOptions) => apiClient.post<T>(url, data, options),
  put: <T>(url: string, data?: any, options?: RequestOptions) => apiClient.put<T>(url, data, options),
  delete: <T>(url: string, options?: RequestOptions) => apiClient.delete<T>(url, options),
  upload: <T>(url: string, file: File, data?: Record<string, any>, options?: RequestOptions) => 
    apiClient.upload<T>(url, file, data, options),
  healthCheck: () => apiClient.healthCheck(),
};

// Error handling utilities
export const handleAPIError = (error: unknown): string => {
  if (error instanceof APIError) {
    // Return user-friendly messages for common errors
    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 408:
        return 'Request timed out. Please check your connection and try again.';
      case 422:
        return 'Invalid data provided. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
};

export default api;
